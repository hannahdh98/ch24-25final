// import statements
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

//the signup will get the email, name and password from user.
exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
  //if this doesnt work a 422 status code will show
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  //bycrypt with protect the password and user info
  bcrypt
    .hash(password, 12)
    .then(hashedPw => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: 'User created!', userId: result._id });
    })
    //500 error status code
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


//login information will get the email, password
exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    // find user that matches the email
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('A user with this email could not be found.');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            }, 'secret', {
                expiresIn: '1h'
            });
            res.status(200).json({token: token, userId: loadedUser._id.toString()});
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}
