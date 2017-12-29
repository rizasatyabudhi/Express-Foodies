exports.loginForm = (req, res) => {
  res.render("login", { title: "login" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "register" });
};

exports.validateRegister = (req, res, next) => {
  // we get these functions from "expressValidator" library we import in app.js
  req.sanitizeBody("name");
  req.checkBody("name", "You must supply a name!").notEmpty();
  req.checkBody("email", "That email is not valid!").isEmail();
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody("password", "Password cannot be blanked!").notEmpty();
  req
    .checkBody("password-confirm", "Password confirm cannot be blanked!")
    .notEmpty();
  req
    .checkBody("password-confirm", "Your passwords do not match")
    .equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    req.flash("error", errors.map(err => err.msg));
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash()
    });
    return; // stop the function from running
  }
  next(); // there were no errors
};
