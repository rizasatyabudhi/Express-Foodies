const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// transport.sendMail({
//   from: 'Riza Satyabudhi <rizasatya@gmail.com>',
//   to: 'randy@example.com',
//   subject: 'Just trying things out',
//   html: 'Hey i <strong>hate</strong> you',
//   text: 'hey i hate you',
// });

// use it in authController

const generateHTML = (filename, options = {}) => {
  // __dirname is used so we we can have path that is absolute to this folder
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlined = juice(html); // make the css all inlined, to support many email
  return inlined;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Riza <noreply@riza.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};

