const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../../config/config');
const Account = require('../account/account.model');
const User = require('../user/user.model');

function register(req, res, next) {
  User.getByUsername(req.body.username)
    .then(() => {
      res.status(httpStatus.CONFLICT).json({
        success: false,
        message: 'Username already taken',
        code: 'error.conflict.username'
      });
    })
    .catch(() => {
      const user = new User({
        username: req.body.username,
        password: req.body.password
      });

      let savedUser;
      user.save()
        .then((userModel) => {
          savedUser = userModel;

          return new Account({
            name: `${savedUser.username}'s Account`,
            user: savedUser,
            users: [{
              user: savedUser,
              permission: 'Admin',
              pending: false
            }]
          }).save();
        })
        .then((savedAccount) => {
          const authorizedAccount = savedAccount;
          authorizedAccount.token = jwt.sign({
            user: savedUser.toToken(),
            account: savedAccount.toToken(),
            role: savedAccount.getPermission(savedUser._id)
          }, config.jwtSecret);

          res.json({
            success: true,
            user: savedUser,
            accounts: [authorizedAccount]
          });
        })
        .catch(e => next(e));
    });
}

function login(req, res) {
  let loggedUser;
  User.getByUsername(req.body.username)
    .then((user) => {
      loggedUser = user;
      return user.comparePassword(req.body.password);
    })
    .then(() => Account.listByUser(loggedUser._id))
    .then((accounts) => {
      const authorizedAccounts = accounts.map((mappedAccount) => {
        const authorizedAccount = mappedAccount;
        authorizedAccount.token = jwt.sign({
          user: loggedUser.toToken(),
          account: mappedAccount.toToken(),
          role: mappedAccount.getPermission(loggedUser._id)
        }, config.jwtSecret);
        return authorizedAccount;
      });
      res.json({ success: true, user: loggedUser, accounts: authorizedAccounts });
    })
    .catch(() => {
      // return UNAUTHORIZED on purpose
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication error',
        code: 'error.auth.login'
      });
    });
}

function profile(req, res) {
  User.getByUsername(req.auth.user.username)
    .then(user => res.json({ success: true, user }))
    .catch(() => {
      // return UNAUTHORIZED on purpose
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
        code: 'error.notfound'
      });
    });
}

function account(req, res) {
  Account.get(req.auth.account.id)
    .then(authAccount => res.json({ success: true, account: authAccount }))
    .catch(() => {
      // return UNAUTHORIZED on purpose
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Account not found',
        code: 'error.notfound'
      });
    });
}

module.exports = {
  register,
  login,
  profile,
  account
};
