const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profiles/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth , async (req, res) => {
    try {
        const profile = await Profile.findOne({user : req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({errors : [{msg : "There is no profile for this User"}]});
        }
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


// @route   POST api/profiles/
// @desc    Create or Update a User Profile
// @access  Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', "Skills is required").not().isEmpty()
]] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }
    const {company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin} = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill=>skill.trim())
    }
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(twitter) profileFields.social.twitter = twitter;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;
    
    try {
        let profile = await Profile.findOne({user : req.user.id});
        if(profile) {
            profile = await Profile.findOneAndUpdate(
                { user : req.user.id}, 
                { $set : profileFields}, 
                { new : true }
            );
            return res.json(profile);
        }
        profile = new Profile(profileFields);
        await profile.save();
        return res.json(profile)
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

// @route   Get api/profiles/
// @desc    Get all Profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

// @route   Get api/profiles//user/:user_id
// @desc    Get profiles by user_id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user : req.params.user_id}).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({errors : [{msg : "Profile not found"}]});
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == "ObjectId") {
            return res.status(400).json({errors : [{msg : "Profile not found"}]});
        }
        return res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profiles/
// @desc    Delete profile, user and post
// @access  Provate
router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user : req.user.id });
        await User.findOneAndRemove({ _id : req.user.id });
        res.json({ msg : "User Deleted"});
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

module.exports = router;