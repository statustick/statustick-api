const axios = require('axios');
const httpStatus = require('http-status');
const Monitor = require('./monitor.model');
const Contact = require('../contact/contact.model');
const Alert = require('../alert/alert.model');
const Task = require('../task/task.model');
const Metric = require('../metric/metric.model');
const Drone = require('../drone/drone.model');

const debug = require('debug')('statustick-api:monitor');

const checkMinuteMap = {
  '30sec': 0.5,
  '1min': 1,
  '5min': 5,
  '15min': 15,
  '30min': 30,
  '1hour': 60,
  '3hour': 60 * 20,
};

function list(req, res, next) {
  Monitor.getByAccount(req.auth.account.id)
    .then(monitors => res.json({ success: true, monitors }))
    .catch(e => next(e));
}

function detail(req, res, next) {
  Monitor.get(req.monitor.id)
    .then(monitor => res.json({ success: true, monitor }))
    .catch(e => next(e));
}

function create(req, res, next) {
  req.monitor = new Monitor({ account: req.auth.account.id });
  next();
}

function update(req, res, next) {
  req.monitor = new Monitor(req.monitor);
  next();
}

function process(req, res, next) {
  const monitor = new Monitor(req.monitor);
  monitor.name = req.body.name || monitor.name;
  monitor.type = req.body.type || monitor.type;
  monitor.active = (req.body.active !== undefined) ? req.body.active : monitor.active;
  monitor.delay = req.body.delay || monitor.delay;
  monitor.code = req.body.code || monitor.code;
  monitor.confirmation = req.body.confirmation || monitor.confirmation;
  monitor.checkMinute = checkMinuteMap[req.body.check] || monitor.checkMinute;
  monitor.timeout = req.body.timeout || monitor.timeout;
  monitor.params = {
    url: req.body.url || monitor.params.url,
    auth: {
      basic: {
        username: req.body.authUsername || monitor.params.auth.basic.username,
        password: req.body.authPassword || monitor.params.auth.basic.password
      }
    }
  };
  monitor.http = {
    userAgent: req.body.userAgent || monitor.http.userAgent,
    followRedirect: req.body.followRedirect || monitor.http.followRedirect,
    cookie: req.body.cookie || monitor.http.cookie,
    customHeader: req.body.customHeader || monitor.http.customHeader,
    alertStatuses: req.body.statusCodes || monitor.http.alertStatuses
  };

  monitor.save()
    .then(savedMonitor => res.json({ success: true, monitor: savedMonitor }))
    .catch(e => next(e));
}

function addContact(req, res, next) {
  Contact.getByIdAndAccount(req.body.idContact, req.auth.account.id)
    .then((contact) => {
      req.monitor.contacts.push(contact);
      return req.monitor.save();
    })
    .then(() => next())
    .catch(e => next(e));
}

function removeContact(req, res, next) {
  const { monitor } = req;
  Contact.getByIdAndAccount(req.body.idContact, req.auth.account.id)
    .then(() => {
      monitor.contacts = monitor.contacts.filter(id => id.toString() !== req.body.idContact);
      return monitor.save();
    })
    .then(() => {
      next();
      return null;
    })
    .catch(e => next(e));
}

function remove(req, res, next) {
  const { monitor } = req;
  Task.remove({ monitor: req.monitor.id })
    .then(() => Alert.remove({ monitor: req.monitor.id }))
    .then(() => Metric.remove({ monitor: req.monitor.id }))
    .then(() => monitor.remove())
    .then(() => res.json({ success: true }))
    .catch(e => next(e));
}

function validate(req, res, next) {
  Monitor.getByIdAndAccount(req.params.idMonitor, req.auth.account.id)
    .then((monitor) => {
      req.monitor = monitor;
      next();
      return null;
    })
    .catch(e => next(e));
}

function validateByCode(req, res, next) {
  Monitor.getByCodeAndAccount(req.body.code, req.auth.account.id)
    .then((monitor) => {
      if (req.method === 'PUT' && req.monitor.id === monitor.id) {
        next();
      } else {
        res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Code already using for another monitor',
          code: 'error.conflict.monitor.code'
        });
      }
      return null;
    })
    .catch(() => next());
}

function test(req, res) {
  let drone;
  Drone.getRandomByType(req.body.type)
    .then((drones) => {
      if (drones.length === 0) {
        throw new Error('error.drone.not_implemented');
      }
      drone = drones[0]; // eslint-disable-line prefer-destructuring
      return axios.post(`${drone.basePath}/http`, {
        delay: 0 || req.body.delay,
        timeout: req.body.timeout,
        params: {
          url: req.body.url,
          auth: {
            basic: {
              username: req.body.authUsername,
              password: req.body.authPassword
            }
          }
        },
        http: {
          followRedirect: req.body.followRedirect
        }
      });
    })
    .then((response) => {
      if (response.data.success) {
        const { data } = response.data;
        data.drone = {
          location: drone.info.location,
          name: `${drone.info.city}/${drone.info.country}`
        };
        res.json({
          success: true, data
        });
      } else {
        debug(response.data);
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Failed to test',
          code: 'error.monitor.test.failed'
        });
      }
    })
    .catch((e) => {
      if (e.message === 'error.drone.not_implemented') {
        res.status(httpStatus.SERVICE_UNAVAILABLE).json({
          success: false,
          message: 'Test drone for this test not found, please try again later',
          code: e.message
        });
      } else {
        throw e;
      }
    });
}

module.exports = {
  list,
  detail,
  create,
  update,
  addContact,
  removeContact,
  remove,
  validate,
  validateByCode,
  process,
  test
};
