const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

// @route   POST api/users
// @desc    register User
// @access  Public
router.post('/', [
    check('name', "Name is Required").not().isEmpty(),
    check('email', "Please include a valid Email").isEmail(),
    check('password', "Please Enter a password with 6 or more characters").isLength({ min : 6})
], (req, res) => { 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }
    res.send(req.body)
});

module.exports = router;