const Promise = require('bluebird');
const mongoose = require('mongoose');
const uuid = require('node-uuid');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');

mongoose.Promise = Promise;

const AccountUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: true
  },
  permission: {
    type: String
  },
  pending: {
    type: Boolean,
    default: true
  }
});

/**
 * Account Schema
 */
const AccountSchema = new mongoose.Schema({
  name: { type: String },
  key: {
    type: String,
    required: true,
    default: uuid.v4,
    index: { unique: true }
  },
  timezone: {
    type: String,
    default: 'Europe/Istanbul'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: true
  },
  users: [AccountUserSchema]
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

AccountSchema.pre('save', function save(next) {
  const account = this;
  account.updatedAt = Date.now();
  next();
});

/**
 * toJSON implementation
 */
AccountSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * toJSON implementation
 */
AccountUserSchema.options.toJSON = {
  transform: doc => ({
    user: doc.user,
    permission: doc.permission,
    createdAt: doc.createdAt,
    pending: doc.pending
  })
};

/**
 * Methods
 */
AccountSchema.method({});

AccountSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    name: this.name,
    key: this.key,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    user: this.user,
    users: this.users,
    timezone: this.timezone,
    token: this.token
  };
};

AccountSchema.methods.toToken = function toToken() {
  return {
    id: this.id,
    name: this.name
  };
};

AccountSchema.methods.getPermission = function getPermission(idUser) {
  for (let i = 0; i < this.users.length; i += 1) {
    const id = (this.users[i].user._id !== undefined) ? this.users[i].user._id : this.users[i].user;
    if (id.toString() === idUser.toString()) {
      return this.users[i].permission;
    }
  }
  return '';
};

/**
 * Statics
 */
AccountSchema.statics = {
  get(id) {
    return this.findById(id)
      .populate({ path: 'user' })
      .populate({ path: 'users.user' })
      .exec()
      .then((account) => {
        if (account) {
          return account;
        }
        const err = new APIError('No such account exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByUser(id, idUser) {
    return this.findOne({ _id: id, 'users.user': idUser })
      .populate({ path: 'user', select: 'username' })
      .populate({ path: 'users.user', select: 'username' })
      .exec()
      .then((account) => {
        if (account) {
          return account;
        }
        const err = new APIError('No such account exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByKey(key) {
    return this.findOne({ key })
      .exec()
      .then((account) => {
        if (account) {
          return account;
        }
        const err = new APIError('No such account exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  listByUser(idUser) {
    return this.find({ 'users.user': idUser })
      .populate({ path: 'user' })
      .populate({ path: 'users.user' })
      .exec();
  },
  list({ skip = 0, limit = 50 } = {}) {
    return this.find({})
      .populate({ path: 'user', select: 'username' })
      .populate({ path: 'users.user', select: 'username' })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef Account
 */
module.exports = mongoose.model('Account', AccountSchema);
