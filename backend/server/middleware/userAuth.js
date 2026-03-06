import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// userAuth — JWT authentication middleware
// ---------------------------------------------------------------------------

/**
 * Protects routes by verifying the auth token included with each request.
 *
 * Token lookup order:
 *   1. req.cookies.token   — httpOnly cookie set by the auth controller
 *   2. Authorization header — "Bearer <token>" for clients that can't use cookies
 *      (e.g. mobile apps or Postman during development)
 *
 * On success:  sets req.userId to the authenticated user's ObjectId string
 *              and calls next() to continue to the route handler.
 * On failure:  returns 401 JSON and stops the request chain.
 */
const userAuth = async (req, res, next) => {
    // Prefer the httpOnly cookie; fall back to the Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
        // Expected format: "Bearer eyJhbGci..."
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }

    try {
        // Verify the token signature and expiry against JWT_SECRET
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedToken.userId) {
            // Token is structurally valid but missing the expected payload claim
            return res.status(401).json({ success: false, message: 'Invalid Token. Login Again' });
        }

        // Attach the authenticated user's ID to the request so downstream
        // handlers can use it without re-decoding the token
        req.userId = decodedToken.userId;
        next();

    } catch (error) {
        // jwt.verify throws for expired tokens, bad signatures, malformed JWTs, etc.
        console.error('JWT verification error:', error.message);
        return res.status(401).json({ success: false, message: error.message });
    }
};

export default userAuth;
