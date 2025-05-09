# AI Chat Application

A real-time chat application with AI capabilities built using the MEAN stack (MongoDB, Express.js, Angular, Node.js).

## Deployment Instructions

### Frontend (Netlify)

1. Log in to [Netlify](https://www.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist/frontend/browser`
5. Add environment variables:
   - None required for frontend

### Backend (Render)

1. Log in to [Render](https://render.com/)
2. Click "New" → "Web Service"
3. Connect to your GitHub repository
4. Configure the service:
   - Name: `ai-chat-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3000

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```
3. Start development servers:
   ```bash
   # Start frontend server
   cd frontend
   npm start

   # Start backend server
   cd ../backend
   npm run dev
   ```

## Features

- Real-time chat with AI
- User authentication
- Multiple chat sessions
- Responsive design
- Mobile-friendly interface
