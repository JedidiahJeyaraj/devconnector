const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const request = require('request');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
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


// @route   POST api/profile/
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

// @route   Get api/profile/
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

// @route   Get api/profile//user/:user_id
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

// @route   DELETE api/profile/
// @desc    Delete profile, user and post
// @access  Private
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

// @route   PUT api/profile/experience
// @desc    Add Profile experience
// @access  Private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {title, location, company, from , to, current, description} = req.body;

    const newExp = {
        title, location, company, from , to, current, description
    }

    try {
        const profile = await Profile.findOne({user : req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }

});


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete Profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res)=> {
    try {
        const profile = await Profile.findOne({user : req.user.id});
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


// @route   PUT api/profile/education
// @desc    Add Profile education
// @access  Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
    check('from', 'From Date is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {school, fieldofstudy, degree, from , to, current, description} = req.body;

    const newEdu = {
        school, fieldofstudy, degree, from , to, current, description
    }

    try {
        const profile = await Profile.findOne({user : req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }

});


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete Profile education
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res)=> {
    try {
        const profile = await Profile.findOne({user : req.user.id});
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/github/:username
// @desc    get github repos
// @access  Public
router.get('/github/:username', async (req, res)=> {
    try {
        const options = {
            uri : `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,
            method : 'GET',
            headers : {'user-agent':'node.js'}
        };
        request(options, (err, response, body) => {
            if(err) {
                console.error(err.message);
                return res.status(500).send('Server Error');
            }
            if(response.statusCode != 200) {
                return res.status(404).json({msg : "No Github profile found"})
            }
            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});


module.exports = router;