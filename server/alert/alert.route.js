const express = require('express');
const alertCtrl = require('./alert.controller');
const monitorCtrl = require('../monitor/monitor.controller');

const router = express.Router({ mergeParams: true });

router.route('/')
/** GET /monitors/:idMonitor/alerts - Get list of alerts of monitor */
  .get(
    monitorCtrl.validate,
    alertCtrl.list
  );

module.exports = router;
