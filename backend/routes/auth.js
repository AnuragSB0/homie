// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Test protected route (requires valid token)
router.get('/me', authMiddleware, (req, res) => {
    // If authMiddleware passes, req.user will be populated
    res.json({ 
        message: "You have successfully accessed a protected route!", 
        user: req.user 
    });
});

module.exports = router;