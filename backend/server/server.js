import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import cookieParser from 'cookie-parser'
import path from 'path'
import connectDB from './config/mongodb.js'
import authRouter from './routes/authRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try to load .env from server directory, fallback to parent directory
dotenv.config({ path: path.join(__dirname, '.env') });
// Also try parent directory (backend root)
if (!process.env.MONGO_URI) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const app = express();

const PORT = process.env.PORT || 4000;

// Verify MONGO_URI is set before connecting
if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI is not defined in environment variables');
    console.error('Please create a .env file in the backend/ or backend/server/ directory with:');
    console.error('MONGO_URI=your_mongodb_connection_string');
    process.exit(1);
}

connectDB();

app.use(express.json());
app.use(cookieParser());

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Body:', req.body);
    }
    next();
});
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true })); 

//API ENDPOINTS
app.get('/', (req, res) => {
    res.send('Working');
});

app.use('/api/auth', authRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});