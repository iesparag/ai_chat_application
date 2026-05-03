const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');

const auth = async (req, res, next) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({ error: 'Database is starting up. Please try again in a moment.' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Received token:', token ? '[redacted]' : null);

    if (!token) {
      console.log('No token provided');
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.userId).maxTimeMS(8000).exec();
    if (!user) {
      console.log('User not found for id:', decoded.userId);
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    console.log('Authentication successful for user:', user.email);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
