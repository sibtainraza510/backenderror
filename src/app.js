import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';  // Ensure this path is correct

dotenv.config({
    path: './.env'
});

const app = express();

// Middleware for CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Middleware to parse incoming JSON requests
app.use(express.json());

// User Routes with new base path
app.use('/api/v1/users', userRoutes);  // Updated base path

// Logging middleware
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});

export default app;
