const passport = require("passport");

// tell what strategy we want to use, we use "local"
exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed login",
  successRedirect: "/",
  successFlash: "You are now logged in"
});
