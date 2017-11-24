const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const contactCtrl = require('./contact.controller');

const router = express.Router();

router.route('/')

  /** GET /contacts - Get list of contacts */
  .get(contactCtrl.list)

  /** GET /contacts - Create new contact */
  .post(
    validate(paramValidation.contact.create),
    contactCtrl.create
  );


router.route('/:idContact')

  /** GET /contacts/:idContact - Get detail of contact */
  .get(contactCtrl.validate, contactCtrl.detail)

  /** DELETE /contacts/:idContact - Remove contact */
  .delete(contactCtrl.validate, contactCtrl.remove);

module.exports = router;
