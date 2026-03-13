// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- REGISTER LOGIC ---
exports.register = async (req, res) => {
    try {
        const { name, email, password, mpin, role } = req.body;

        // 1. Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Generate a salt and hash the password & MPIN
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const hashedMpin = await bcrypt.hash(mpin, salt);

        // 3. Create and save the new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            mpin: hashedMpin,
            role
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// --- LOGIN LOGIC ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Create the JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // 4. Sign the token and send it to the client
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }, // Token expires in 24 hours
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { id: user.id, name: user.name, role: user.role } 
                });
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};