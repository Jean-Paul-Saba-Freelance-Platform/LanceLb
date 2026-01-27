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
import {authRouter} from './routes/authRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

const PORT = process.env.PORT || 4000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true}));

//API ENDPOINTS
app.get('/', (req, res) => {
    res.send('Working');
});

app.use('/api/auth', authRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});