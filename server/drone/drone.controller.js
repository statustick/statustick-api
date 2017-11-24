const config = require('../../config/config');
const worker = require('../../config/worker');
const Drone = require('./drone.model');

function list(req, res) {
  Drone.list()
    .then(drones => (res.json({ success: true, drones })));
}

Drone.count()
  .then((count) => {
    if (count === 0) {
      return new Drone({
        info: {
          city: '',
          country: ''
        },
        basePath: config.defaultDronePath
      }).save();
    }
    return null;
  })
  .then((savedDrone) => {
    if (savedDrone !== null) {
      worker.drone.add(savedDrone.toWorker());
    }
  });

module.exports = { list };
