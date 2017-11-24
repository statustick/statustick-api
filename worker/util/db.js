const Promise = require('bluebird');
const mongoose = require('mongoose');
const config = require('../../config/config');
const util = require('util');

const debug = require('debug')('statustick-api:worker-db');

mongoose.Promise = Promise;
const mongoUri = config.mongo.uri;
mongoose.connect(mongoUri, {
  useMongoClient: true,
  poolSize: 5
});

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

module.exports = mongoose;
