import express from "express";

const router = express.Router();

function VerifyWebhookSecret(req, res, next) {
    const signature = req.headers['stripe-signature'];
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if(!expectedSecret) {
        return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
    }
    if(signature !== expectedSecret) {
        return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
    next();
}

router.post('/job-created', VerifyWebhookSecret, async(req, res) => {
    res.json({ success: true, message: 'Webhook received' });
    try {
        const payload = req.body;
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;