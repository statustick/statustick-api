const mongoose = require('mongoose');
const moment = require('moment-timezone');

mongoose.Promise = Promise;

/**
 * Metric Schema
 */
const MetricSchema = new mongoose.Schema({
  _id: String,
  date: {
    type: Date,
    default: Date.now
  },
  monitor: {
    type: String
  },
  t: {
    type: String
  },
  v: [mongoose.Schema.Types.Mixed]
}, { _id: false, versionKey: false });

/**
 * Methods
 */
MetricSchema.method({});
/**
 * Statics
 */
MetricSchema.statics = {

  set(idMonitor, metric, value) {
    const now = moment().tz('UTC');
    const inc = {};
    inc[`v.${now.hour()}.${now.minute()}.total`] = 1;
    inc[`v.${now.hour()}.${now.minute()}.sum`] = value;

    const id = `${idMonitor}:${metric}:${now.format('DDMMYYYY')}`;

    const data = {};
    data.t = metric;
    data.monitor = idMonitor;
    data.date = now.startOf('day');


    return this.update({ _id: id }, { $set: data, $inc: inc }, { upsert: true }, (err) => {
      if (err) throw err;
    });
  },
  list(idMonitor, metric, from, to) {
    const dates = [];

    const currDate = from.startOf('day');
    const lastDate = to.add(1, 'days').startOf('day');

    while (currDate.add(1, 'days').diff(lastDate) < 0) {
      dates.push(currDate.clone());
    }
    const idList = [];
    dates.forEach(date => idList.push(`${idMonitor}:${metric}:${date.format('DDMMYYYY')}`));

    return new Promise((resolve, reject) => {
      this.aggregate([
        { $match: { _id: { $in: idList } } },
        {
          $addFields: {
            hours: { $objectToArray: '$v' }
          }
        },
        { $unwind: '$hours' },
        {
          $addFields: {
            hour: '$hours.k',
            minutes: { $objectToArray: '$hours.v' }
          }
        },
        { $unwind: '$minutes' },
        {
          $project: {
            _id: false,
            date: '$date',
            hour: '$hour',
            minute: '$minutes.k',
            value: { $divide: ['$minutes.v.sum', '$minutes.v.total'] }
          }
        }
      ])
        .exec((err, results) => {
          if (err) reject(err);
          resolve(results.map(result => ({
            timestamp: moment(result.date).add(result.hour, 'hours').add(result.minute, 'minutes').unix(),
            value: result.value
          })));
        });
    });
  }
};

/**
 * @typedef Metric
 */
module.exports = mongoose.model('Metric', MetricSchema);
