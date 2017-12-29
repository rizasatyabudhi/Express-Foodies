const passport = require("passport");

// tell what strategy we want to use, we use "local"
exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed login",
  successRedirect: "/",
  successFlash: "You are now logged in"
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next();
    return; // carry on, user is logged in
  }
  req.flash("error", "you must be logged in first!");
  res.redirect("/login");
};
