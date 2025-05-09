require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Configuration, OpenAIApi } = require('openai');

const User = require('./models/user');
const Chat = require('./models/chat');
const auth = require('./middleware/auth');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:4200',  // Local development
  'https://ai-chat-app-parag.netlify.app', // Production frontend URL (update this)
  'https://ies-parag-gpt.netlify.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// OpenAI Configuration
if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is not set in environment variables');
  process.exit(1);
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set');
    }
    if (!process.env.OPENAI_API_KEY.startsWith('sk-') || process.env.OPENAI_API_KEY.startsWith('sk-proj-')) {
      throw new Error('Invalid OpenAI API key format. Key should start with "sk-" but not "sk-proj-"');
    }
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello!" }],
      model: "gpt-3.5-turbo",
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
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid login credentials');
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
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
      socket.join(userId); // Join a room specific to this user
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  socket.on('message', async ({ chatId, message }) => {
    try {
      console.log('Received message:', { chatId, message });
      
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
        content: message,
        role: 'user'
      });

      // Emit user message back to confirm receipt
      socket.emit('message', {
        chatId,
        message: {
          content: message,
          role: 'user'
        }
      });

      try {
        console.log('Sending request to OpenAI...');
        // Get AI response
        const completion = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [
            ...chat.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        if (!completion.data || !completion.data.choices || !completion.data.choices[0]) {
          throw new Error('Invalid response from OpenAI');
        }

        const aiResponse = completion.data.choices[0].message.content;
        console.log('AI Response:', aiResponse);

        // Save AI response
        chat.messages.push({
          content: aiResponse,
          role: 'assistant'
        });

        // Update chat title if it's the first message
        if (chat.messages.length === 2) {
          chat.title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
