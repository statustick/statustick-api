const Joi = require('joi');
const pkg = require('../package.json');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

const ALERT_STATUS_CODES = '204,205,206,303,400,401,403,404,405,406,408,410,413,444,429,494,495,496,499,500,501,502,503,504,505,506,507,508,509,510,511,521,522,523,524,520,598,599';

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test'])
    .default('development'),
  PORT: Joi.number()
    .default(8080),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  MONGO_URI: Joi.string().required()
    .description('Mongo DB URI'),
  REDIS_URI: Joi.string().required()
    .description('Redis URI'),
  DEFAULT_ALERT_STATUS_CODES: Joi.string()
    .description('Default alert status codes')
    .default(ALERT_STATUS_CODES),
  USER_AGENT: Joi.string()
    .description('Webhook User Agent')
    .default(`${pkg.name}/${pkg.version}`),
  SLACK_BOT_NAME: Joi.string()
    .description('Slack notification bot name')
    .default('StatusTick BOT'),
  SLACK_BOT_ICON: Joi.string()
    .description('Slack notification bot icon')
    .default(':robot_face:'),
  ALERT_REPEAT_TIME: Joi.number()
    .description('Alert repeating time in minutes')
    .default(5),
  DEFAULT_DRONE: Joi.string()
    .description('Default drone path to check monitors')
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  mongo: {
    uri: envVars.MONGO_URI + ((envVars.NODE_ENV === 'test') ? '_test' : '')
  },
  redis: envVars.REDIS_URI + ((envVars.NODE_ENV === 'test') ? '/9' : ''),
  alertStatusCodes: envVars.DEFAULT_ALERT_STATUS_CODES.split(','),
  userAgent: envVars.USER_AGENT,
  slackName: envVars.SLACK_BOT_NAME,
  slackIcon: envVars.SLACK_BOT_ICON,
  alertRepeatTime: envVars.ALERT_REPEAT_TIME,
  defaultDronePath: envVars.DEFAULT_DRONE
};

module.exports = config;
