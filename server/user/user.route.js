const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const userCtrl = require('./user.controller');

const router = express.Router();

router.route('/')
  /** PUT /users - Update user */
  .put(validate(paramValidation.user.update), userCtrl.update);


module.exports = router;
