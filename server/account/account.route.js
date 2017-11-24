const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const accountCtrl = require('./account.controller');

const router = express.Router();

router.route('/')
/** GET /accounts - Get list of accounts */
  .get(accountCtrl.list)

  /** POST /accounts - Create new account */
  .post(
    validate(paramValidation.account.create),
    accountCtrl.validateByKey,
    accountCtrl.create,
    accountCtrl.process
  )

  /** PUT /accounts - Update current account */
  .put(
    validate(paramValidation.account.update),
    accountCtrl.validateByKey,
    accountCtrl.update,
    accountCtrl.process
  );


module.exports = router;
