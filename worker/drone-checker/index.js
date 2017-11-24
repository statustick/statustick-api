require('../util/db');
const Promise = require('bluebird');
const axios = require('axios');
const worker = require('../../config/worker');
const config = require('../../config/config');
const Drone = require('../../server/drone/drone.model');

const debug = require('debug')('statustick-api:drone-checker');

const getDroneInfo = drone => new Promise((resolve, reject) => {
  axios(`${drone.basePath}/check`)
    .then(response => resolve(response.data))
    .catch(e => reject(e));
});

const updateDrone = (drone, data) => new Promise((resolve, reject) => {
  const { info } = data;
  info.location = [info.location.lon, info.location.lat];
  Drone.updateById(drone.id, {
    lastPingAt: Date.now(),
    info,
    support: data.support
  })
    .then((result) => {
      if (result.n > 0) resolve();
      else reject(new Error('Drone not found'));
    });
});

const process = (job, done) => {
  const drone = job.data;
  getDroneInfo(drone)
    .then(data => updateDrone(drone, data))
    .then(() => {
      debug(`Drone ${drone.id} - ${drone.basePath} updated`);
      done({ success: true });
    })
    .catch((e) => {
      debug(e.message);
      done(e);
    });
};

if (config.env !== 'test') {
  worker.drone.process(process);
}


module.exports = {
  getDroneInfo,
  updateDrone,
  process
};
