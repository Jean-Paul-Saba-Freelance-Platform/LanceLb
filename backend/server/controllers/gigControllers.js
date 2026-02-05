import Gig from '../models/gigModel.js';

export const createGig = async (req, res) => {
    try {
        const { title, description, category, price, images, skills } = req.body;
        const gig = new Gig({
            title,
            description,
            category,
            price,
            images,
            skills,
        });
        await gig.save();
        return res.status(201).json({ success: true, message: 'Gig created successfully', gig });
    } catch (error) {
        console.error("Error creating gig:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const getGigs = async (req, res) => {
    try {
        const gigs = await Gig.find();
        return res.status(200).json({ success: true, gigs });
    } catch (error) {
        console.error("Error getting gigs:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export const deleteGig = async (req, res) => {
    try {
        const { id } = req.params;
        const gig = await Gig.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: 'Gig deleted successfully', gig });
    } catch (error) {
        console.error("Error deleting gig:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}