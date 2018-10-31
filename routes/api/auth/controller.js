const jwt = require('jsonwebtoken');
const User = require('../../../model/user');

exports.register = (req, res) => {
  const { username, password } = req.body;
  let newUser = null;
  const create = (user) => {
    if (user) {
      throw new Error('username exists')
    } else {
      return User.create(username, password)
    }
  };

  const count = (user) => {
    newUser = user
    return User.count({}).exec()
  };

  const assign = (count) => {
    if (count === 1) {
      return newUser.assignAdmin()
    } else {
      return Promise.resolve(false)
    }
  }

  // respond to the client
  const respond = (isAdmin) => {
    res.json({
      message: 'registered successfully',
      admin: isAdmin ? true : false
    })
  }

  // run when there is an error (username exists)
  const onError = (error) => {
    res.status(409).json({
      message: error.message
    })
  }

  // check username duplication
  User.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError)
}

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