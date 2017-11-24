const moment = require('moment-timezone');
const Metric = require('./metric.model');

function list(req, res, next) {
  const from = (req.query.from) ? moment(req.query.from) : moment().startOf('month');
  const to = (req.query.to) ? moment(req.query.to) : moment();

  Metric.list(req.monitor.id, req.params.metric, from, to)
    .then(metrics => (res.json({ success: true, metrics })))
    .catch(e => next(e));
}


module.exports = { list };
