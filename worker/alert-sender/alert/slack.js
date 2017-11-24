const axios = require('axios');
const alertUtil = require('./util');
const config = require('../../../config/config');
const debug = require('debug')('statustick-api:alert-sender:slack');


const parse = (alert, monitor) => {
  const alertColor = (alert.isActive) ? '#ff6961' : '#77dd77';

  let informationField;
  if (alert.isActive) {
    informationField = {
      title: 'Detected',
      value: alertUtil.getFormattedDate(alert.createdAt, monitor.account.timezone)
    };
  } else {
    informationField = {
      title: 'Resolved',
      value: alertUtil.getFormattedDate(alert.closedAt, monitor.account.timezone)
    };
  }

  return {
    username: config.slackName,
    icon_emoji: config.slackIcon,
    attachments: [
      {
        color: alertColor,
        title: 'View your alert',
        title_link: 'http://google.com/',
        text: alertUtil.getAlertTitle(alert, monitor),
        fields: [
          {
            title: 'Issue Number',
            value: alertUtil.getIssueCode(alert, monitor)
          },
          informationField
        ],
        footer: 'Statustick API',
        footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png'
      }
    ]
  };
};


module.exports = {
  send: (alert, monitor, contact) => axios({
    url: contact.params.url,
    method: 'POST',
    data: parse(alert, monitor)
  })
    .then(() => true)
    .catch(e => debug(e))
};
