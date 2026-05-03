require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');

mongoose.set('bufferCommands', false);

const User = require('./models/user');
const Chat = require('./models/chat');
const auth = require('./middleware/auth');

const app = express();
const server = require('http').createServer(app);
const allowedOrigins = [
  'http://localhost:4200',  // Local development
  'http://127.0.0.1:4200',
  'http://localhost:4300',
  'http://127.0.0.1:4300',
  'https://ai-chat-app-parag.netlify.app', // Production frontend URL
  'https://ies-parag-gpt.netlify.app'
];

const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure CORS - must be before any routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const redactSensitiveFields = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      ['password', 'token', 'authorization'].includes(key.toLowerCase()) ? '[redacted]' : fieldValue
    ])
  );
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request Headers:', redactSensitiveFields(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', redactSensitiveFields(req.body));
  }
  next();
});

// Connect to MongoDB
let mongoRetryTimer = null;

async function connectToMongoDB() {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not configured. Auth and chat APIs will return 503 until it is set.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (!mongoRetryTimer) {
      mongoRetryTimer = setTimeout(() => {
        mongoRetryTimer = null;
        connectToMongoDB();
      }, 10000);
    }
  }
}

connectToMongoDB();

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const requireDatabase = (req, res, next) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({ error: 'Database is starting up. Please try again in a moment.' });
  }

  next();
};

const withTimeout = (promise, ms, message = 'Request timed out') => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message);
      error.code = 'REQUEST_TIMEOUT';
      reject(error);
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not set. Auth and chat history will work, but AI replies will fail until OPENAI_API_KEY is configured.');
      return false;
    }
    // if (!process.env.OPENAI_API_KEY.startsWith('sk-') || process.env.OPENAI_API_KEY.startsWith('sk-proj-')) {
    //   throw new Error('Invalid OpenAI API key format. Key should start with "sk-" but not "sk-proj-"');
    // }
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello!" }],
      model: "gpt-4.1",
    });
    console.log('OpenAI connection test successful');
    return true;
  } catch (error) {
    if (error.response) {
      console.error('OpenAI API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        message: error.message
      });
      if (error.response.status === 429) {
        console.error('Rate limit exceeded or insufficient quota. Please check your OpenAI account billing status.');
      }
    } else {
      console.error('OpenAI connection test failed:', error.message);
    }
    return false;
  }
}

testOpenAIConnection();

// Authentication Routes
app.post('/api/auth/signup', requireDatabase, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = new User({ name: name.trim(), email: normalizedEmail, password });
    await withTimeout(user.save(), 10000, 'Signup database request timed out');
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error('Signup error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    if (error.code === 'REQUEST_TIMEOUT') {
      return res.status(504).json({ error: 'Signup is taking too long. Please try again.' });
    }

    res.status(400).json({ error: 'Unable to create account. Please check your details and try again.' });
  }
});

app.post('/api/auth/login', requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await withTimeout(
      User.findOne({ email: normalizedEmail }).select('+password').maxTimeMS(8000).exec(),
      10000,
      'Login database request timed out'
    );
    
    const passwordMatches = user
      ? await withTimeout(user.comparePassword(password), 6000, 'Password check timed out')
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error('Login error:', error.message);

    if (error.code === 'REQUEST_TIMEOUT') {
      return res.status(504).json({ error: 'Login is taking too long. Please try again.' });
    }

    res.status(500).json({ error: 'Unable to login right now. Please try again.' });
  }
});

// Chat Routes
app.get('/api/chats', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ lastUpdated: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chats', auth, async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.user._id,
      title: req.body.title || 'New Chat',
      messages: []
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/chats/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('User connected');
  let userId = null;

  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log('Authenticated user:', userId);
      socket.join(userId); // Join a room specific to this user
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  socket.on('message', async ({ chatId, message }) => {
    try {
      // Extract content - client sends { content, timestamp }; ensure we always get a string
      const raw = typeof message === 'string' ? message : message?.content;
      const content = typeof raw === 'string' ? raw : '';
      if (!content || !content.trim()) {
        socket.emit('error', { message: 'Message content is required.' });
        return;
      }
      console.log('Received message:', { chatId, content });
      
      if (!userId) {
        throw new Error('Not authenticated');
      }

      // Save user message
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Add user message
      chat.messages.push({
        content,
        role: 'user'
      });

      // Emit user message back to confirm receipt
      socket.emit('message', {
        chatId,
        message: {
          content,
          role: 'user'
        }
      });

      try {
        console.log('Sending request to OpenAI...');
        // Get AI response
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            ...chat.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        if (!completion.choices || !completion.choices[0]) {
          throw new Error('Invalid response from OpenAI');
        }

        const aiResponse = completion.choices[0].message.content;
        console.log('AI Response:', aiResponse);

        // Save AI response
        chat.messages.push({
          content: aiResponse,
          role: 'assistant'
        });

        // Update chat title if it's the first message
        if (chat.messages.length === 2) {
          chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        }

        await chat.save();

        // Emit AI response
        socket.emit('message', {
          chatId,
          message: {
            content: aiResponse,
            role: 'assistant'
          }
        });
      } catch (error) {
        console.error('OpenAI API Error:', error);
        socket.emit('error', { message: 'Failed to get AI response. Please check your API key.' });
      }
    } catch (error) {
      console.error('Error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
