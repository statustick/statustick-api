const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const authCtrl = require('./auth.controller');

const router = express.Router();

/** POST /auth/register - Returns token if correct username and password is provided */
router.route('/register')
  .post(validate(paramValidation.auth.register), authCtrl.register);

/** POST /auth/login - Returns token if correct username and password is provided */
router.route('/login')
  .post(validate(paramValidation.auth.login), authCtrl.login);

/** GET /auth/profile - Returns authorized profile */
router.route('/profile')
  .get(authCtrl.profile);


/** GET /auth/account - Returns authorized account */
router.route('/account')
  .get(authCtrl.account);


module.exports = router;
