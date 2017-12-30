const passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');

// our User model can use "createStrategy()" from passportLocalMongoose we import in User model
passport.use(User.createStrategy());

// everytime we do request, passport will check if they are properly logged in
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// don't forget to require it in app.js
