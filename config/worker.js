const Queue = require('bull');
const config = require('./config');

const queueConfig = {
  removeOnComplete: true,
  removeOnFail: true
};

const createQueue = (queueName) => {
  const queue = new Queue(queueName, { redis: config.redis });
  switch (queueName) {
    case 'task-runner':
    case 'drone-checker':
    case 'alert-sender':
    case 'alert-sender-single':
      break;
    default:
      throw new Error('Invalid Argument');
  }

  return {
    add: data => queue.add(data, queueConfig),
    process: (job, done) => queue.process(job, done),
    counts: () => queue.getJobCounts(),
    empty: () => queue.empty()
  };
};

module.exports = {
  task: createQueue('task-runner'),
  drone: createQueue('drone-checker'),
  alert: createQueue('alert-sender'),
  singleAlert: createQueue('alert-sender-single')
};

