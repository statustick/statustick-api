const Alert = require('./alert.model');

function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Alert.getByMonitor(req.monitor._id, { limit, skip })
    .then(({ alertList, total }) => (res.json({ success: true, total, alerts: alertList })))
    .catch(e => next(e));
}


module.exports = { list };
