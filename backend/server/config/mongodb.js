import mongoose from 'mongoose';

const connectDB = async () => {


    mongoose.connection.on('connected', () => {
        console.log('DB connected');
    });
    const mongoUri = process.env.MONGO_URI;
  

    await mongoose.connect(`${mongoUri}/freelance-project`);
       
    }
   
    

export default connectDB;