const axios = require('axios');
const alertUtil = require('./util');
const config = require('../../../config/config');
const debug = require('debug')('statustick-api:alert-sender:webhook');

axios.defaults.headers.common['User-Agent'] = config.userAgent;

const parse = (alert, monitor) => ({
  message: alertUtil.getAlertTitle(alert, monitor),
  issue: alertUtil.getIssueCode(alert, monitor),
  alert: {
    id: alert._id,
    createdAt: alert.createdAt,
    closedAt: alert.closedAt,
    isActive: alert.isActive
  },
  monitor: {
    id: monitor.id,
    name: monitor.name,
    type: monitor.type,
    lastTriggerAt: monitor.lastTriggerAt
  }
});


module.exports = {
  send: (alert, monitor, contact) => new Promise((resolve, reject) => {
    axios({
      url: contact.params.url,
      method: 'POST',
      data: parse(alert, monitor)
    }).then(() => resolve({ success: true }))
      .catch((e) => {
        debug(e);
        reject(new Error(e.message, e.code));
      });
  })
};
