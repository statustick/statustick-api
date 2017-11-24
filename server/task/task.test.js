const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

const Task = mongoose.model('Task');

chai.config.includeStack = true;

describe('## Monitor APIs', () => {
  const credentials = {
    username: `statustick_${Math.random()}`,
    password: 'password'
  };

  const validMonitor = {
    name: 'VALID-MONITOR',
    code: 'VALID',
    type: 'HTTP',
    url: 'http://validurl.com'
  };

  const params = {
    jwtToken: null,
    account: null,
    monitor: null,
    task: null
  };

  before(() => request(app)
    .post('/auth/register')
    .send(credentials)
    .then((res) => {
      params.jwtToken = `Bearer ${res.body.accounts[0].token}`;
      params.account = res.body.accounts[0]; // eslint-disable-line prefer-destructuring
    })
    .then(() => (
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(validMonitor)
    ))
    .then((res) => {
      params.monitor = res.body.monitor;
    })
    .then(() => (
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(validMonitor)
    )));

  describe('# GET /monitors/:idMonitor/tasks', () => {
    before((done) => {
      new Task({
        account: params.account.id,
        status: 'SUCCESS',
        monitor: params.monitor.id,
        responses: []
      })
        .save()
        .then(() => done());
    });
    it('should get task list', (done) => {
      request(app)
        .get(`/monitors/${params.monitor.id}/tasks`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('tasks');
          expect(res.body.tasks).to.not.be.empty; // eslint-disable-line no-unused-expressions
          expect(res.body.tasks).to.have.lengthOf(1);
          done();
        })
        .catch(done);
    });
  });
});
