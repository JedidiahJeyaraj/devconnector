const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

// @route   POST api/users
// @desc    register User
// @access  Public
router.post('/', [
    check('name', "Name is Required").not().isEmpty(),
    check('email', "Please include a valid Email").isEmail(),
    check('password', "Please Enter a password with 6 or more characters").isLength({ min : 6})
], async (req, res) => { 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({email});

        if(user) {
            return res.status(400).json({errors : [{msg : "User Already exists"}]});
        }

        const avatar = gravatar.url(email, {
            s : '200',
            r : 'pg',
            d : 'mm'
        });

        user = new User({
            name,
            email,
            password,
            avatar
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.send("User registered")
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

module.exports = router;