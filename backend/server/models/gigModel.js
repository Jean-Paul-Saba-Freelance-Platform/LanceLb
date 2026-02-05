import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    skills: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

const Gig = mongoose.model('Gig', gigSchema);

export default Gig;