const Account = require('../account/account.model');
const Monitor = require('../monitor/monitor.model');
const Alert = require('../alert/alert.model');


function info(req, res) {
  const { account } = req;
  let monitors;
  Monitor.getByAccount(account._id)
    .then((monitorList) => {
      monitors = monitorList.map(monitor => monitor.toPage());
      return Promise.all(monitorList.map(monitor => Alert.hasActiveAlert(monitor._id)));
    })
    .then((alertResults) => {
      monitors.map((monitor, index) => {
        const newMonitor = monitor;
        newMonitor.hasAlert = alertResults[index];
        return newMonitor;
      });

      res.json({
        success: true,
        account: {
          name: account.name,
          timezone: account.timezone
        },
        monitors
      });
    });
}

function alerts(req, res) {
  const { account } = req;
  Monitor.getIdList(account)
    .then((idList) => {
      Alert.groupByDate(idList.map(id => id._id))
        .then((results) => {
          res.json({ success: true, results });
        });
    });
}

function validate(req, res, next) {
  Account.getByKey(req.params.key)
    .then((account) => {
      req.account = account;
      next();
      return null;
    })
    .catch(e => next(e));
}


module.exports = { info, alerts, validate };
