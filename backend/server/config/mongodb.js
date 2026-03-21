import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Check if MONGO_URI is defined
        const mongoUri = process.env.MONGO_URI;

        // Disable command buffering so queries throw immediately
        // instead of waiting forever if the DB is unreachable.
        mongoose.set('bufferCommands', false);
        
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
        let connectionString = mongoUri;
        
        // If the URI doesn't contain a database name, add one
        // A typical URI is mongodb+srv://<user>:<pass>@<cluster>/<database>?<options>
        // We look for the part between the last / and the first ?
        const dbNameMatch = mongoUri.match(/\/([^\/\?]+)(\?|$)/);
        if (!dbNameMatch || dbNameMatch[1] === 'test') {
            const baseUrl = mongoUri.split('?')[0].replace(/\/$/, '');
            const options = mongoUri.includes('?') ? '?' + mongoUri.split('?')[1] : '';
            connectionString = `${baseUrl}/freelance-project${options}`;
            console.log('No specific database found in URI, using: freelance-project');
        } else {
            console.log(`Connecting to database: ${dbNameMatch[1]}`);
        }

        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 10000, // fail in 10s if no server found
        });
        console.log(`MongoDB connected to: ${mongoose.connection.name}`);
        
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        // Don't exit in development, just log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

export default connectDB;
