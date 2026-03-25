import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

console.log('[mail] SMTP_USER set:', Boolean(smtpUser));
console.log('[mail] SMTP_PASS set:', Boolean(smtpPass));
console.log('[mail] SENDER_EMAIL:', process.env.SENDER_EMAIL || 'NOT SET');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

if (process.env.NODE_ENV !== 'production') {
    transporter.verify((error) => {
        if (error) {
            console.error('[mail] Transport verify failed:', error.message);
        } else {
            console.log('[mail] Transport ready');
        }
    });
}

export default transporter;