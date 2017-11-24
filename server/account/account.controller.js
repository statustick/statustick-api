const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../../config/config');
const Account = require('./account.model');

function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Account.listByUser(req.auth.user.id, { limit, skip })
    .then(accounts => res.json({ success: true, accounts }))
    .catch(e => next(e));
}

function create(req, res, next) {
  req.account = {
    user: req.auth.user.id,
    users: [{
      user: req.auth.user.id,
      permission: 'Admin',
      pending: false
    }]
  };
  next();
}

function update(req, res, next) {
  Account.get(req.auth.account.id)
    .then((account) => {
      req.account = account;
      next();
    });
}

function process(req, res, next) {
  const account = new Account(req.account);

  account.name = req.body.name || account.name;
  account.key = req.body.key || account.key;
  account.timezone = req.body.timezone || account.timezone;

  account.save()
    .then((savedAccount) => {
      const authorizedAccount = savedAccount;
      authorizedAccount.token = jwt.sign({
        user: req.auth.user,
        account: savedAccount.toToken(),
        role: savedAccount.getPermission(req.auth.user.id)
      }, config.jwtSecret);
      res.json({ success: true, account: authorizedAccount });
    })
    .catch(e => next(e));
}


function validateByKey(req, res, next) {
  if (req.body.key) {
    Account.getByKey(req.body.key)
      .then((account) => {
        if (req.method === 'PUT' && req.auth.account.id === account.id) {
          next();
        } else {
          res.status(httpStatus.CONFLICT).json({
            success: false,
            message: 'Key already using for another account',
            code: 'error.conflict.account.key'
          });
        }
        return null;
      })
      .catch(() => next());
  } else {
    next();
  }
}

module.exports = {
  list,
  create,
  update,
  process,
  validateByKey
};
