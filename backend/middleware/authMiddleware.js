// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get the token from the request header (Standard format is "Bearer <token>")
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; 

    // 2. If no token is found, block access
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // 3. Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the decoded user payload to the request object
        req.user = decoded.user; 
        
        // Move on to the next middleware or the actual route controller
        next(); 
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid or has expired' });
    }
};