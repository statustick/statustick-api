const express = require('express');
const pageCtrl = require('./page.controller');

const router = express.Router({ mergeParams: true }); // eslint-disable-line new-cap

router.route('/:key')
/** GET /pages/:key - Get list of tasks */
  .get(
    pageCtrl.validate,
    pageCtrl.info
  );

router.route('/:key/alerts')
/** GET /pages/:key/alerts - Get list of tasks */
  .get(
    pageCtrl.validate,
    pageCtrl.alerts
  );

module.exports = router;
