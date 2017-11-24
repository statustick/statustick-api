const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../../config/config');
const User = require('./user.model');
const Account = require('../account/account.model');

function update(req, res, next) {
  let user;
  User.get(req.auth.user.id)
    .then((currentUser) => {
      const updatedUser = currentUser;
      updatedUser.username = req.body.username || currentUser.username;
      updatedUser.password = req.body.password || currentUser.password;
      return updatedUser.save();
    })
    .then((savedUser) => {
      user = savedUser;
      return Account.listByUser(user._id);
    })
    .then((accounts) => {
      const authorizedAccounts = accounts.map((mappedAccount) => {
        const authorizedAccount = mappedAccount;
        authorizedAccount.token = jwt.sign({
          user: user.toToken(),
          account: mappedAccount.toToken(),
          role: mappedAccount.getPermission(user._id)
        }, config.jwtSecret);
        return authorizedAccount;
      });
      res.json({ success: true, user, accounts: authorizedAccounts });
    })
    .catch((e) => {
      if (e.name === 'MongoError' && e.code === 11000) {
        res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Username already taken',
          code: 'error.conflict.username'
        });
      } else {
        next(e);
      }
    });
}

module.exports = {
  update
};
