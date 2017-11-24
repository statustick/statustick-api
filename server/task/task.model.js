const Promise = require('bluebird');
const mongoose = require('mongoose');
const mathjs = require('mathjs');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Metric = require('../metric/metric.model');

mongoose.Promise = Promise;

/**
 * Task Schema
 */
const TaskSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    index: true
  },
  monitor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Monitor',
    index: true
  },
  status: {
    type: 'String',
    enum: ['SUCCESS', 'FAIL'],
    index: true
  },
  statistics: {
    mean: { type: 'Number' },
    median: { type: 'Number' },
    min: { type: 'Number' },
    max: { type: 'Number' }
  },
  responses: [{
    code: { type: 'Number' },
    time: { type: 'Number' },
    drone: {
      name: { type: String },
      location: {
        type: [Number],
        index: '2d'
      }
    }
  }]
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

TaskSchema.pre('save', function save(next) {
  const task = this;
  const responseTimes = this.responses
    .filter(response => response.code === 200)
    .map(response => response.time);
  if (responseTimes.length > 0) {
    task.statistics = {
      mean: mathjs.mean(responseTimes),
      median: mathjs.median(responseTimes),
      min: mathjs.min(responseTimes),
      max: mathjs.max(responseTimes),
    };
    Metric.set(task.monitor, 'response_time', task.statistics.mean);
    Metric.set(task.monitor, 'check', responseTimes.length);
  }
  next();
});

/**
 * toJSON implementation
 */
TaskSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * Methods
 */
TaskSchema.method({});

TaskSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    createdAt: this.createdAt,
    status: this.status,
    statistics: this.statistics,
    responses: this.responses.map(response => ({
      code: response.code,
      took: response.time
    }))
  };
};

/**
 * Statics
 */
TaskSchema.statics = {
  get(id) {
    return this.findById(id)
      .exec()
      .then((task) => {
        if (task) {
          return task;
        }
        const err = new APIError('No such task exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByMonitor(monitor, {
    skip = 0,
    limit = 50,
    from,
    to,
    status
  } = {}) {
    const query = { monitor };
    if (from && to) {
      query.createdAt = { $gte: from, $lte: to };
    } else if (from) {
      query.createdAt = { $gte: from };
    } else if (to) {
      query.createdAt = { $lte: to };
    }

    if (status) {
      query.status = status;
    }
    let total = 0;
    return this.count(query)
      .then((count) => {
        total = count;
        return this.find(query)
          .sort({ createdAt: 1 })
          .skip(+skip)
          .limit(+limit)
          .exec();
      })
      .then(tasks => ({ tasks, total }));
  },
};

/**
 * @typedef Task
 */
module.exports = mongoose.model('Task', TaskSchema);
