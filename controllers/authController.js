const passport = require('passport');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

const User = mongoose.model('User');

const crypto = require('crypto');

// tell what strategy we want to use, we use "local"
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login',
  successRedirect: '/',
  successFlash: 'You are now logged in',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next();
    return; // carry on, user is logged in
  }
  req.flash('error', 'you must be logged in first!');
  res.redirect('/login');
};

// when the user click "send a reset"
exports.forgot = async (req, res) => {
  // 1. check if email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  }
  // 2. set reset token and exipiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. send them email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${
    user.resetPasswordToken
  }`;

  await mail.send({
    user, // the user we get from User.findOne
    filename: 'password-reset',
    subject: 'Password Reset',
    resetURL,
  });
  req.flash(
    'success',
    'You have been emailed a password reset link.',
  );
  // 4. redirect to login page
  res.redirect('/login');
};

// when the user visit the reset link from email
exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  // if there is no user
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset form
  res.render('reset', { title: 'Reset Your Password' });
};

// when the user click "reset password" in the form
exports.confirmedPasswords = async (req, res, next) => {
  // we use [] to escape "-" character
  if (req.body.password === req.body['password-confirm']) {
    next(); // password match, keep going
    return;
  }
  req.flash('error', 'password do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  // if there is no user
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // setPassword() is available because we import passportLocalMongoose in User model
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordExpires = undefined;
  user.resetPasswordExpires = undefined;
  // we need to run .save() to actually store the update in the database
  const updatedUser = await user.save();
  // req.login is from passport,
  // we can pass an existing user to login
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset! You are now logged in!');
  res.redirect('/');
};
