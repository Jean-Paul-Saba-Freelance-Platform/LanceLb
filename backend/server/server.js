import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import cookieParser from 'cookie-parser'
import path from 'path'
import connectDB from './config/mongodb.js'
import authRoutes from './routes/authRoutes.js'

dotenv.config();

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

app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});