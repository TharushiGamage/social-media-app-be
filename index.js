const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhooks');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

// Middleware
app.use(cors());

// Clerk Webhook needs raw body
app.use('/api/webhooks', bodyParser.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json()); // for parsing application/json

// Connect to Database
connectDB();

// Clerk Middleware
app.use(clerkMiddleware());

// Basic Route
app.get('/', (req, res) => {
    res.send('Social Media App Backend is running');
});

const uploadRoute = require('./routes/upload');
const path = require('path');

// ...
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoute);

const PORT = process.env.PORT || 8800;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
