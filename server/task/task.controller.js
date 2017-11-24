const Task = require('./task.model');

function list(req, res, next) {
  const {
    limit = 50,
    skip = 0,
    from,
    to,
    status
  } = req.query;

  Task.getByMonitor(req.monitor._id, {
    limit,
    skip,
    from,
    to,
    status
  }).then(({ tasks, total }) => (res.json({ success: true, total, tasks })))
    .catch(e => next(e));
}


module.exports = { list };
