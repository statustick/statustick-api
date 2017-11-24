const webhook = require('./webhook');
const slack = require('./slack');

function AlertFactory(type) {
  switch (type) {
    case 'WEBHOOK':
      return webhook;
    case 'SLACK':
      return slack;
    default:
      throw new Error(`Unimplemented type: ${type}`);
  }
}

module.exports = {
  getInstance: AlertFactory
};
