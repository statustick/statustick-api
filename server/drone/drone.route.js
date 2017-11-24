const express = require('express');
const droneCtrl = require('./drone.controller');

const router = express.Router();

router.route('/')
/** GET /drones - Get list of drones */
  .get(droneCtrl.list);

module.exports = router;
