const Contact = require('./contact.model');
const Monitor = require('../monitor/monitor.model');

function detail(req, res) {
  res.json({ success: true, contact: req.contact });
}

function list(req, res, next) {
  Contact.getByAccount(req.auth.account.id)
    .then(contacts => res.json({ success: true, contacts }))
    .catch(e => next(e));
}

function create(req, res, next) {
  new Contact({
    account: req.auth.account.id,
    name: req.body.name,
    type: req.body.type,
    params: {
      url: req.body.url
    }
  }).save()
    .then(savedContact => res.json({ success: true, contact: savedContact }))
    .catch(e => next(e));
}

function remove(req, res, next) {
  const { contact } = req;
  Monitor.getByContact(contact.id)
    .then((monitors) => {
      monitors.forEach((monitor) => {
        const contacts = monitor.contacts.filter(idContact => contact.id !== idContact.toString());
        Monitor.updateById(monitor._id, { contacts });
      });
    })
    .then(() => contact.remove())
    .then(() => res.json({ success: true }))
    .catch(e => next(e));
}

function validate(req, res, next) {
  Contact.getByIdAndAccount(req.params.idContact, req.auth.account.id)
    .then((contact) => {
      req.contact = contact;
      next();
      return null;
    })
    .catch(e => next(e));
}

module.exports = {
  detail,
  list,
  create,
  remove,
  validate
};
