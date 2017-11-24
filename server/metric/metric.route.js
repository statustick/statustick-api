const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const monitorCtrl = require('../monitor/monitor.controller');
const metricCtrl = require('./metric.controller');

const router = express.Router({ mergeParams: true });

router.route('/:idMonitor/:metric')
/** GET /metrics/:idMonitor/:metric - Get list of tasks */
  .get(validate(paramValidation.metric.list), monitorCtrl.validate, metricCtrl.list);

module.exports = router;
