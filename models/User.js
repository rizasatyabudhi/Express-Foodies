const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const md5 = require("md5");
const validator = require("validator");
const mongodbErrorHandler = require("mongoose-mongodb-errors");
const passportLocalMongoose = require("passport-local-mongoose");

// don't forget to import it in start.js
const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true, //usually for email normalization (capital email to lowercase email),
    trim: true,
    validate: [validator.isEmail, "Invalid Email Address"],
    required: "Please supply email address"
  },
  name: {
    type: String,
    required: "Please supply a name",
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

userSchema.virtual("gravatar").get(function() {
  // we use gravatar for the profile image
  // we hash the email from the model
  // s=200 is the size of 200px 200px
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

// tell passport to use "email" as username for authentication
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("User", userSchema);
