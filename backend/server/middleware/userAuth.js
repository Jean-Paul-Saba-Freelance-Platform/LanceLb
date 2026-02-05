import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const userAuth = async (req, res, next) => {
    // Check both cookies and Authorization header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log("Token found:", !!token);          // DEBUG LOG

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (decodedToken.userId) {
            req.userId = decodedToken.userId; 
            
        } else {
            return res.status(401).json({ success: false, message: 'Invalid Token. Login Again' });
        }
        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message); // DEBUG LOG
        return res.status(401).json({ success: false, message: error.message });
    }
}

export default userAuth;
