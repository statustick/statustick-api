const request = require('supertest-as-promised');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

const Metric = mongoose.model('Metric');

chai.config.includeStack = true;

describe('## Metric APIs', () => {
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
    monitor: null
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
      Metric.remove();
    }));

  describe('# GET /metrics/:idMonitor/:metric', () => {
    before(() => Metric.set(params.monitor.id, 'response_time', 123));
    it('should return created metric', (done) => {
      request(app)
        .get(`/metrics/${params.monitor.id}/response_time`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('metrics');
          expect(res.body.metrics).to.have.lengthOf(1);
          expect(res.body.metrics[0].value).to.have.equal(123);
          done();
        })
        .catch(done);
    });
  });
});
