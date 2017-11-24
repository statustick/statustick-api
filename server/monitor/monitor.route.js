const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const monitorCtrl = require('./monitor.controller');

const router = express.Router();

router.route('/')

/** GET /monitors - Get list of monitors of account */
  .get(monitorCtrl.list)

  /** POST /monitors - Create new monitor */
  .post(
    validate(paramValidation.monitor.create),
    monitorCtrl.validateByCode,
    monitorCtrl.create,
    monitorCtrl.process
  );


router.route('/test')
/** POST /monitors/test - Test monitor */
  .post(
    validate(paramValidation.monitor.test),
    monitorCtrl.test
  );

router.route('/:idMonitor')
/** GET /monitors/:idMonitor - Get monitor */
  .get(
    validate(paramValidation.monitor.detail),
    monitorCtrl.validate,
    monitorCtrl.detail
  )
  /** PUT /monitors/:idMonitor - Update Monitor */
  .put(
    validate(paramValidation.monitor.update),
    monitorCtrl.validate,
    monitorCtrl.validateByCode,
    monitorCtrl.update,
    monitorCtrl.process
  )
  // TODO role check
  /** DELETE /monitors/:idMonitor - Delete Monitor */
  .delete(
    monitorCtrl.validate,
    monitorCtrl.remove
  );


router.route('/:idMonitor/contacts')
/** POST /monitors/:idMonitor/contact - Add new monitor contact */
  .post(
    validate(paramValidation.monitor.contact),
    monitorCtrl.validate,
    monitorCtrl.addContact,
    monitorCtrl.detail
  )
  /** Delete /monitors/:idMonitor/contact - Remove contact from monitor */
  .delete(
    validate(paramValidation.monitor.contact),
    monitorCtrl.validate,
    monitorCtrl.removeContact,
    monitorCtrl.detail
  );

module.exports = router;
