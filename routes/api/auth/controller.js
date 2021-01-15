const jwt = require('jsonwebtoken');
const User = require('../../../model/user');

exports.login = (req, res, next) => {
  const JWT_SECRET = req.app.get('jwt-secret');
  User.findOne({ uid: req.body.uid }).then(result => {
    if (result !== null) {
      const token = jwt.sign(
        {
          uid: result.uid,
          name: result.name,
          url: result.url,
          email: result.email,
        },
        JWT_SECRET,
        {
          expiresIn: '1h'
        },
        (err, token) => {
          if (err) {
            next(new ERRORS.serverError());
          } else {
            res.status(201).json({
              message: "created token",
              token
            });
          }
        }
      );
    } else {
      const { uid, name, url, email } = req.body;
      const newUser = new User({
        uid,
        name,
        url,
        email
      });

      newUser.save((err, user) => {
        if (err) {
          next(new ERRORS.ServerError());
        } else {
          const token = jwt.sign(
            {
              uid,
              name,
              url,
              email
            },
            JWT_SECRET,
            {
              expiresIn: '1h'
            },
            (err, token) => {
              if (err) {
                next(new ERRORS.serverError());
              } else {
                res.status(201).json({
                  message: "new user created",
                  token
                });
              }
            }
          );
        }
      });
    }
  }).catch((err) => {
    next(new ERRORS.serverError());
  });

};

exports.user = (req, res) => {
  User.find({}).exec()
    .then(
      users => {
        res.json({ users })
      }
    );
};

exports.check = (req, res) => {
  res.json({
    success: true,
    info: req.decoded
  });
};