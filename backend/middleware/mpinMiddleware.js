// backend/middleware/mpinMiddleware.js
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = async function (req, res, next) {
    // 1. Grab the raw MPIN from the custom request headers
    const rawMpin = req.header('x-mpin');

    // 2. Block the request if no MPIN is provided
    if (!rawMpin) {
        return res.status(400).json({ message: 'Action denied: MPIN required' });
    }

    try {
        // 3. Fetch the full user document from the database using the ID from the JWT
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 4. Compare the provided MPIN with the hashed MPIN in MongoDB
        const isMatch = await bcrypt.compare(rawMpin, user.mpin);
        if (!isMatch) {
            return res.status(403).json({ message: 'Action denied: Invalid MPIN' });
        }

        // 5. If it matches, allow the hardware action to proceed!
        next();

    } catch (error) {
        console.error('MPIN verification error:', error.message);
        res.status(500).json({ message: 'Server error during MPIN verification' });
    }
};