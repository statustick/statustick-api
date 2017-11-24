const Promise = require('bluebird');
const mongoose = require('mongoose');
const uuid = require('node-uuid');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Bcrypt = require('bcrypt');

mongoose.Promise = Promise;

const SALT_WORK_FACTOR = 10;

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: { unique: true }
  },
  password: {
    type: String,
    required: true
  },
  token: {
    type: 'String',
    required: true,
    default: uuid.v4,
    index: { unique: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

UserSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) return next();

  return Bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    return Bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) return next(error);
      user.password = hash;
      return next();
    });
  });
});

/**
 * toJSON implementation
 */
UserSchema.options.toJSON = {
  transform: doc => doc.toApi()
};


/**
 * Methods
 */
UserSchema.method({});

UserSchema.methods.toApi = function toApi() {
  return {
    id: this.id,
    username: this.username,
    createdAt: this.createdAt
  };
};

UserSchema.methods.toToken = function toToken() {
  return {
    id: this.id,
    username: this.username
  };
};

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return new Promise((resolve, reject) => {
    Bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return reject(err);
      return (isMatch) ? resolve() : reject();
    });
  });
};
/**
 * Statics
 */
UserSchema.statics = {
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByToken(token) {
    return this.findOne({ token })
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  getByUsername(username) {
    return this.findOne({ username })
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', UserSchema);
