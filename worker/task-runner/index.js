require('../util/db');
const Promise = require('bluebird');
const array = require('lodash/array');
const axios = require('axios');
const config = require('../../config/config');
const worker = require('../../config/worker');
const Drone = require('../../server/drone/drone.model');
const Task = require('../../server/task/task.model');
const Alert = require('../../server/alert/alert.model');
const Monitor = require('../../server/monitor/monitor.model');
const Metric = require('../../server/metric/metric.model');

const debug = require('debug')('statustick-api:task-runner');


const getActiveAlert = monitor => new Promise((resolve) => {
  Alert.getActiveByMonitor(monitor)
    .then(alert => resolve(alert))
    .catch(() => {
      const alert = new Alert({ monitor });

      Alert.getLastIssueNumberByMonitor(monitor)
        .then((issueNumber) => {
          alert.issueNumber = issueNumber + 1;
          resolve(alert);
        });
    });
});

const handleAlert = (task, monitor, alert) => {
  if (alert.tasks.length === 0 && task.status === 'SUCCESS') {
    return;
  }
  if (task.status === 'SUCCESS') {
    const closedAlert = alert;
    closedAlert.isActive = false;
    closedAlert.closedAt = Date.now();
  }

  alert.tasks.push(task);
  alert.save()
    .then((savedAlert) => {
      if (new Monitor(monitor).shouldTrigger(savedAlert)) {
        // if (savedAlert.tasks.length === 1 || !savedAlert.isActive) {
        const triggeredAlert = savedAlert;
        triggeredAlert.alertAt = Date.now();
        triggeredAlert.save();
        worker.alert.add({ alert: savedAlert.toWorker(), monitor });
      }
    });
};

const process = (job, done) => {
  const monitor = job.data;
  let droneList = [];
  Drone.getByType(monitor.type)
    .then((drones) => {
      if (drones.length === 0) {
        return Promise.reject(new Error('No available drone found!!!'));
      }
      const promiseList = [];
      droneList = drones;
      drones.forEach((drone) => {
        switch (monitor.type) {
          case 'HTTP':
            promiseList.push(axios.post(`${drone.basePath}/http`, {
              params: monitor.params,
              delay: monitor.delay,
              http: monitor.http,
              timeout: monitor.timeout
            }));
            break;
          default:
            throw new Error(`Unimplemented type: ${monitor.type}`);
        }
      });
      return Promise.all(promiseList);
    })
    .then((responseList) => {
      const responses = responseList
        .map(response => response.data.data)
        .map((response, index) => {
          const { info } = droneList[index];
          response.drone = {
            name: `${info.city}/${info.country}`,
            location: info.location
          };

          return response;
        });
      let successStatus = 'FAIL';
      let failCount = 0;
      switch (monitor.type) {
        case 'HTTP':
          failCount = responses
            .map(response => response.code)
            .filter(code => array.indexOf(monitor.http.alertStatuses, code) > -1).length;
          successStatus = (failCount >= monitor.confirmation) ? 'FAIL' : 'SUCCESS';
          break;
        default:
          throw new Error(`Unimplemented type: ${monitor.type}`);
      }

      Metric.set(monitor._id, ((successStatus === 'SUCCESS') ? 'task_success' : 'task_fail'), 1);
      let task;
      new Task({
        account: monitor.account._id,
        status: successStatus,
        monitor,
        responses
      }).save()
        .then((savedTask) => {
          task = savedTask;
          return getActiveAlert(monitor);
        })
        .then(alert => handleAlert(task, monitor, alert));
    })
    .then(() => {
      debug('Task Runner OK');
      done();
    })
    .catch((e) => {
      debug(e);
      done(e);
    });
};

if (config.env !== 'test') {
  worker.task.process(process);
}

module.exports = {
  process
};
