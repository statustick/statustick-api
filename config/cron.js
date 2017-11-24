const redis = require('redis');
const worker = require('./worker');
const config = require('./config');
const Monitor = require('../server/monitor/monitor.model');
const Drone = require('../server/drone/drone.model');

const { CronJob } = require('cron-cluster')(redis.createClient(config.redis));

const debug = require('debug')('statustick-api:cron');

const taskJob = new CronJob('*/5 * * * * *', () => {
  Monitor.getDues()
    .then((monitors) => {
      monitors.forEach((monitor) => {
        Monitor.updateById(monitor._id, { lastTriggerAt: new Date() });
        worker.task.add(monitor);
        debug(`Monitor ${monitor._id} - ${monitor.name} triggered`);
      });
    });
});


const droneJob = new CronJob('*/5 * * * *', () => {
  Drone.list().then((drones) => {
    drones.forEach(drone => worker.drone.add(drone.toWorker()));
  });
});

module.exports = {
  start: () => {
    taskJob.start();
    droneJob.start();
  }
};
