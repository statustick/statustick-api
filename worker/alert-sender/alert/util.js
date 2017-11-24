const moment = require('moment-timezone');

module.exports = {
  getAlertTitle: (alert, monitor) => {
    if (alert.isActive) {
      const time = moment(alert.createdAt).tz(monitor.account.timezone).fromNow();
      return `${monitor.name} is DOWN ${time}`;
    }
    const diff = moment(alert.closedAt).diff(alert.createdAt, 'seconds');
    const duration = moment.duration(diff, 'seconds').humanize();
    return `${monitor.name} is up now, total duration ${duration}, ${monitor.code}-${alert.issueNumber}`;
  },
  getIssueCode: (alert, monitor) => `${monitor.code}-${alert.issueNumber}`,
  getFormattedDate: (date, timezone) => moment(date).tz(timezone).format('ll HH:mm:ss')
};
