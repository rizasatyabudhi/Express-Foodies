const mongoose = require('mongoose');

const Review = mongoose.model('Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id; // get the author from currently logged in user
  req.body.store = req.params.id; // get the store from the url parameter
  const newReview = await new Review(req.body).save();
  req.flash('success', 'Review Saved!');
  res.redirect('back');
};
