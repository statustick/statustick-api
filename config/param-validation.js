const config = require('./config');
const BaseJoi = require('joi');
const JoiTimezone = require('joi-timezone');

const Joi = BaseJoi.extend(JoiTimezone);

module.exports = {
  auth: {
    register: {
      body: {
        username: Joi.string().min(2).required(),
        password: Joi.string().min(6).required()
      }
    },
    login: {
      body: {
        username: Joi.string().min(2).required(),
        password: Joi.string().min(6).required()
      }
    }
  },
  user: {
    update: {
      body: {
        username: Joi.string().min(2),
        password: Joi.string().min(6)
      }
    }
  },
  account: {
    create: {
      body: {
        name: Joi.string().required(),
        key: Joi.string(),
        timezone: Joi.string().timezone()
      }
    },
    update: {
      body: {
        name: Joi.string(),
        key: Joi.string(),
        timezone: Joi.string().timezone()
      }
    }
  },
  contact: {
    create: {
      body: {
        name: Joi.string().required(),
        type: Joi.string().required().valid(['WEBHOOK', 'SLACK']),
        active: Joi.boolean(),
        url: Joi.string().uri({ scheme: ['http', 'https'] })
          .when('type', {
            is: 'WEBHOOK',
            then: Joi.required(),
            otherwise: Joi.optional()
          })
          .when('type', {
            is: 'SLACK',
            then: Joi.required(),
            otherwise: Joi.optional()
          })
      }
    }
  },
  monitor: {
    detail: {
      params: {
        idMonitor: Joi.string().required()
      }
    },
    test: {
      body: {
        type: Joi.string().required().valid(['HTTP', 'TEST']),
        url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
        authUsername: Joi.string(),
        authPassword: Joi.string(),
        delay: Joi.number().integer().min(1).max(60),
        timeout: Joi.number().integer().min(1).max(60),
        followRedirect: Joi.boolean()
      }
    },
    create: {
      body: {
        name: Joi.string().required(),
        code: Joi.string().min(2).max(5).required(),
        active: Joi.boolean().default(true),
        type: Joi.string().required().valid(['HTTP']),
        url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
        authUsername: Joi.string(),
        authPassword: Joi.string(),
        delay: Joi.number().integer().min(1).max(60),
        confirmation: Joi.number().integer().min(1).max(5),
        check: Joi.valid(['1min', '5min', '15min', '30min', '1hour', '3hour', '6hour', '12hour', '24hour']),
        timeout: Joi.number().integer().min(1).max(60),
        customHeader: Joi.string(),
        userAgent: Joi.string(),
        followRedirect: Joi.boolean(),
        statusCodes: Joi.array().default(config.alertStatusCodes)
      }
    },
    update: {
      params: {
        idMonitor: Joi.string().required()
      },
      body: {
        name: Joi.string(),
        code: Joi.string().min(2).max(5),
        active: Joi.boolean(),
        authUsername: Joi.string(),
        authPassword: Joi.string(),
        delay: Joi.number().integer().min(1).max(60),
        confirmation: Joi.number().integer().min(1).max(5),
        check: Joi.valid(['1min', '5min', '15min', '30min', '1hour', '3hour', '6hour', '12hour', '24hour']),
        timeout: Joi.number().integer().min(1).max(60),
        customHeader: Joi.string(),
        userAgent: Joi.string(),
        followRedirect: Joi.boolean(),
        statusCodes: Joi.array()
      }
    },
    contact: {
      params: {
        idMonitor: Joi.string().required()
      },
      body: {
        idContact: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
      }
    }
  },
  task: {
    list: {
      params: {
        idMonitor: Joi.string().required()
      },
      query: {
        limit: Joi.number().integer().min(1),
        skip: Joi.number().integer().min(0),
        from: Joi.date().when('to', {
          is: Joi.exist(),
          then: Joi.date().max(Joi.ref('to')),
        }),
        to: Joi.date(),
        status: Joi.valid(['SUCCESS', 'FAIL']),
      }
    }
  },
  metric: {
    list: {
      params: {
        idMonitor: Joi.string().required()
      },
      query: {
        from: Joi.date().when('to', {
          is: Joi.exist(),
          then: Joi.date().max(Joi.ref('to')),
        }),
        to: Joi.date()
      }
    }
  }
};
