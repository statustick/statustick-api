const mongoose = require('mongoose');

mongoose.Promise = Promise;

/**
 * Drone Schema
 */
const DroneSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastPingAt: {
    type: Date,
    default: Date.now
  },
  basePath: {
    type: String,
    required: true,
    index: { unique: true }
  },
  info: {
    city: { type: String },
    country: { type: String },
    ip: { type: String },
    timezone: { type: String },
    location: {
      type: [Number],
      index: '2d'
    }
  },
  support: [{
    type: String,
    enum: ['HTTP']
  }]
});

/**
 * toJSON implementation
 */
DroneSchema.options.toJSON = {
  transform: doc => doc.toApi()
};

/**
 * Methods
 */
DroneSchema.method({});

DroneSchema.methods.toApi = function toApi() {
  return {
    name: `${this.info.city}/${this.info.country}`,
    timezone: this.info.timezone,
    location: this.info.location,
    pingAt: this.lastPingAt
  };
};

DroneSchema.methods.toWorker = function toWorker() {
  return { id: this._id, basePath: this.basePath };
};

/**
 * Statics
 */
DroneSchema.statics = {
  getByType(type) {
    return this.find({ support: type })
      .exec();
  },
  getRandomByType(type) {
    return this.aggregate([
      { $match: { support: type } },
      { $sample: { size: 1 } }
    ]).exec();
  },
  updateById(idDrone, data) {
    return this.update({ _id: idDrone }, { $set: data }).exec();
  },
  list() {
    return this.find({})
      .exec();
  }
};

/**
 * @typedef Drone
 */
module.exports = mongoose.model('Drone', DroneSchema);
