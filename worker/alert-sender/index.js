require('../util/db');
const Promise = require('bluebird');
const worker = require('../../config/worker');
const config = require('../../config/config');
const Metric = require('../../server/metric/metric.model');
const alertFactory = require('./alert');

const debug = require('debug')('statustick-api:alert-sender');

const processAlert = (job, done) => {
  const queue = worker.singleAlert;
  const jobs = [];
  const { monitor, alert } = job.data;

  monitor.contacts.forEach(contact => jobs.push(queue.add({ monitor, alert, contact })));

  Promise.all(jobs).then(() => done({ success: true }));
};

const processSingleAlert = (job, done) => {
  const { monitor, alert, contact } = job.data;
  alertFactory
    .getInstance(contact.type)
    .send(alert, monitor, contact)
    .then((result) => {
      debug(result);
      Metric.set(monitor._id, 'alert_sent', 1);
      done({ success: true });
    })
    .catch((e) => {
      debug(e);
      done(e);
    });
};

if (config.env !== 'test') {
  worker.alert.process(processAlert);

  worker.singleAlert.process(processSingleAlert);
}

module.exports = {
  processAlert,
  processSingleAlert
};
