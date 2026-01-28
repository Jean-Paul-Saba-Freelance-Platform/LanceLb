import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Check if MONGO_URI is defined
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Connect to MongoDB
        // If MONGO_URI already includes a database name, use it as-is
        // Otherwise, append the database name
        let connectionString = mongoUri;
        
        // Check if the URI already has a database name (contains / after the host)
        // MongoDB Atlas URIs typically include the database name
        // Pattern: mongodb+srv://... or mongodb://... followed by /database
        if (!mongoUri.match(/\/[^\/\?]+(\?|$)/)) {
            // No database name in URI, append it
            // Use ? if URI has query params, & if it doesn't
            const separator = mongoUri.includes('?') ? '&' : '?';
            connectionString = `${mongoUri.replace(/\/$/, '')}/freelance-project`;
        }

        await mongoose.connect(connectionString);
        
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        // Don't exit in development, just log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

export default connectDB;
