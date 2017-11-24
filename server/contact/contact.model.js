const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

mongoose.Promise = Promise;

/**
 * Contact Schema
 */
const ContactSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastTriggerAt: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account'
  },
  type: {
    type: 'String',
    enum: ['SLACK', 'WEBHOOK']
  },
  name: { type: 'String' },
  params: {
    url: { type: 'String' },
    mail: { type: 'String' }
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

ContactSchema.pre('save', function save(next) {
  const contact = this;
  contact.updatedAt = Date.now();
  next();
});

/**
 * toJSON implementation
 */
ContactSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * Methods
 */
ContactSchema.method({});

ContactSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    lastTriggerAt: this.lastTriggerAt,
    active: this.active,
    name: this.name,
    type: this.type,
    params: this.params
  };
};

/**
 * Statics
 */
ContactSchema.statics = {
  get(id) {
    return this.findById(id)
      .exec()
      .then((contact) => {
        if (contact) {
          return contact;
        }
        const err = new APIError('No such contact exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByIdAndAccount(id, idAccount) {
    return this.findOne({ _id: id, account: idAccount })
      .exec()
      .then((contact) => {
        if (contact) {
          return contact;
        }
        const err = new APIError('No such contact exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByAccount(idAccount) {
    return this.find({ account: idAccount })
      .exec()
      .then((contacts) => {
        if (contacts) {
          return contacts;
        }
        const err = new APIError('No such contact exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Contact
 */
module.exports = mongoose.model('Contact', ContactSchema);
