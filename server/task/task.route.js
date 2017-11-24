const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const taskCtrl = require('./task.controller');
const monitorCtrl = require('../monitor/monitor.controller');

const router = express.Router({ mergeParams: true }); // eslint-disable-line new-cap

router.route('/')
/** GET /accounts/:idAccount/monitors/:idMonitor/tasks - Get list of tasks */
  .get(
    validate(paramValidation.task.list),
    monitorCtrl.validate,
    taskCtrl.list
  );

module.exports = router;
