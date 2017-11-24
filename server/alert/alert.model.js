const mongoose = require('mongoose');
const httpStatus = require('http-status');
const uuid = require('node-uuid');
const moment = require('moment-timezone');
const APIError = require('../helpers/APIError');

mongoose.Promise = Promise;

/**
 * Alert Schema
 */
const AlertSchema = new mongoose.Schema({
  token: {
    type: 'String',
    required: true,
    default: uuid.v4,
    index: { unique: true }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  alertAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  issueNumber: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  monitor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Monitor',
    index: true
  },
  tasks: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  }]
});

/**
 * toJSON implementation
 */
AlertSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * Methods
 */
AlertSchema.method({});

AlertSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    createdAt: this.createdAt,
    alertAt: this.alertAt,
    closedAt: (this.closedAt) ? this.closedAt : null,
    isActive: this.isActive,
    taskCount: this.tasks.length,
    issueNumber: this.issueNumber,
    tasks: this.tasks
  };
};

AlertSchema.methods.toWorker = function toWorker() {
  return {
    id: this.id,
    createdAt: this.createdAt,
    alertAt: this.alertAt,
    closedAt: (this.closedAt) ? this.closedAt : null,
    isActive: this.isActive,
    taskCount: this.tasks.length,
    issueNumber: this.issueNumber
  };
};

/**
 * Statics
 */
AlertSchema.statics = {
  getActiveByMonitor(monitor) {
    return this.findOne({ monitor: monitor._id, isActive: true })
      .exec()
      .then((alert) => {
        if (alert) {
          return alert;
        }
        const err = new APIError('No such alert exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getLastIssueNumberByMonitor(monitor) {
    return this.findOne({ monitor: monitor._id })
      .sort({ createdAt: -1 })
      .exec()
      .then(alert => ((alert) ? alert.issueNumber : 1));
  },
  hasActiveAlert(idMonitor) {
    return this.count({ monitor: idMonitor, isActive: true })
      .exec()
      .then(count => count > 0);
  },
  getByMonitor(monitor, { skip = 0, limit = 50 } = {}) {
    const query = { monitor };
    let total = 0;
    return this.count(query)
      .then((count) => {
        total = count;
        return this.find(query)
          .populate({ path: 'tasks' })
          .sort({ createdAt: -1 })
          .skip(+skip)
          .limit(+limit)
          .exec();
      })
      .then(alertList => ({ alertList, total }));
  },
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .skip(+skip)
      .limit(+limit)
      .exec();
  },
  groupByDate(monitors) {
    const dates = [];

    const currDate = moment().add(-1, 'months').startOf('day');
    const lastDate = moment().add(1, 'days').startOf('day');

    while (currDate.add(1, 'days').diff(lastDate) < 0) {
      dates.push(currDate.clone());
    }

    return new Promise((resolve, reject) => {
      this.aggregate([
        { $match: { monitors: { $in: monitors } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 }
          }
        }
      ])
        .exec((err, results) => {
          if (err) reject(err);
          const resultsObject = {};
          results.forEach((result) => {
            const key = `${result._id.day}${result._id.month}${result._id.year}`;
            resultsObject[key] = result.count;
          });
          const r = dates.map(date => ({
            timestamp: date.unix(),
            value: (resultsObject[date.format('DDMMYYYY')] !== undefined) ? resultsObject[date.format('DDMMYYYY')] : 0
          }));
          resolve(r);
        });
    });
  }
};

/**
 * @typedef Alert
 */
module.exports = mongoose.model('Alert', AlertSchema);
