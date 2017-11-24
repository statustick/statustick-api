const Promise = require('bluebird');
const mongoose = require('mongoose');
const uuid = require('node-uuid');
const moment = require('moment-timezone');
const httpStatus = require('http-status');
const slug = require('speakingurl');
const _ = require('lodash');
const APIError = require('../helpers/APIError');
const config = require('../../config/config');

mongoose.Promise = Promise;

const slugOptions = {
  separator: ''
};


/**
 * Monitor Schema
 */
const MonitorSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    default: uuid.v4,
    index: { unique: true }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastTriggerAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    index: true
  },
  contacts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Contact'
  }],
  type: { type: String },
  code: {
    type: String,
    index: true
  },
  name: { type: String },
  params: {
    url: { type: String },
    host: { type: String },
    port: { type: Number },
    auth: {
      basic: {
        username: { type: String },
        password: { type: String }
      }
    }
  },
  delay: {
    type: Number,
    default: 1
  },
  confirmation: {
    type: Number,
    default: 1
  },
  checkMinute: {
    type: Number,
    default: 5
  },
  timeout: { type: Number },
  http: {
    userAgent: { type: String },
    cookie: {
      type: 'Boolean',
      default: false
    },
    followRedirect: {
      type: 'Boolean',
      default: false
    },
    customHeader: { type: String },
    alertStatuses: [{
      type: Number,
      default: config.alertStatusCodes
    }],
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

MonitorSchema.pre('save', function save(next) {
  const monitor = this;
  monitor.updatedAt = Date.now();

  // Contacts
  monitor.contacts = _.uniqWith(monitor.contacts, _.isEqual);

  // Code
  monitor.code = slug(monitor.code.replace(/\W+/g, ''), slugOptions).toUpperCase();

  next();
});

/**
 * toJSON implementation
 */
MonitorSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * Methods
 */
MonitorSchema.method({});

MonitorSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    name: this.name,
    code: this.code,
    type: this.type,
    contacts: this.contacts,
    params: this.params,
    delay: this.delay,
    http: this.http
  };
};

MonitorSchema.methods.toPage = function toApi() {
  return {
    name: this.name,
    code: this.code,
    type: this.type,
    active: this.isActive
  };
};

MonitorSchema.methods.shouldTrigger = function shouldTrigger(alert) {
  let result = moment().diff(alert.createdAt, 'minutes') >= this.delay;
  if (alert.alertAt) {
    result = moment().diff(alert.alertAt, 'minutes') >= config.alertRepeatTime;
  }
  result = result || !alert.isActive;

  return result;
};

/**
 * Statics
 */
MonitorSchema.statics = {
  get(id) {
    return this.findById(id)
      .populate({ path: 'contacts' })
      .exec()
      .then((monitor) => {
        if (monitor) {
          return monitor;
        }
        const err = new APIError('No such monitor exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByAccount(idAccount) {
    return this.find({ account: idAccount })
      .populate({ path: 'contacts' })
      .exec();
  },
  getByIdAndAccount(id, idAccount) {
    return this.findOne({ _id: id, account: idAccount })
      .exec()
      .then((monitor) => {
        if (monitor) {
          return monitor;
        }
        const err = new APIError('No such monitor exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByCodeAndAccount(code, idAccount) {
    return this.findOne({ code, account: idAccount })
      .populate({ path: 'contacts' })
      .exec()
      .then((monitor) => {
        if (monitor) {
          return monitor;
        }
        const err = new APIError('No such monitor exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByContact(idContact) {
    return this.find({ contacts: idContact })
      .exec();
  },
  getDues() {
    return new Promise((resolve, reject) => {
      this.aggregate([
        { $match: { active: true } },
        {
          $redact: {
            $cond: {
              if: {
                $gt: [
                  { $subtract: [new Date(), { $add: ['$lastTriggerAt', { $multiply: ['$checkMinute', 1000 * 60] }] }] }, 0
                ]
              },
              then: '$$KEEP',
              else: '$$PRUNE'
            }
          }
        }
      ])
        .exec((err, monitors) => {
          this.populate(monitors, { path: 'account contacts' }, (error, populatedMonitors) => {
            if (error) {
              reject(error);
            } else {
              resolve(populatedMonitors);
            }
          });
        });
    });
  },
  updateById(idMonitor, data) {
    return this.update(
      { _id: idMonitor },
      {
        $set: data
      }
    )
      .exec();
  },
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .sort({ createdAt: -1 })
      .populate({ path: 'contacts' })
      .skip(+skip)
      .limit(+limit)
      .exec();
  },
  getIdList(idAccount) {
    return this.find({ account: idAccount }, { _id: 1 })
      .exec();
  }
};

/**
 * @typedef Monitor
 */
module.exports = mongoose.model('Monitor', MonitorSchema);
