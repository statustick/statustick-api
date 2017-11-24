const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const Alert = require('./alert.model');
const app = require('../../index');

chai.config.includeStack = true;

describe('## Alert APIs', () => {
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

  const params = { jwtToken: null, monitor: null };

  before(() => request(app)
    .post('/auth/register')
    .send(credentials)
    .then((res) => {
      params.jwtToken = `Bearer ${res.body.accounts[0].token}`;
    }));
  before(() => request(app)
    .post('/monitors')
    .set('Authorization', params.jwtToken)
    .send(validMonitor)
    .expect(httpStatus.OK)
    .then((res) => {
      params.monitor = res.body.monitor;
    }));

  describe('# GET /monitors/:idMonitor/alerts', () => {
    it('should get empty alerts', (done) => {
      request(app)
        .get(`/monitors/${params.monitor.id}/alerts`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('alerts');
          expect(res.body.alerts).to.be.an('array').to.have.lengthOf(0);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /monitors/:idMonitor/alerts', () => {
    before(() => {
      new Alert({ monitor: { _id: params.monitor.id } }).save();
    });
    it('should get contact on monitor', (done) => {
      request(app)
        .get(`/monitors/${params.monitor.id}/alerts`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('alerts');
          expect(res.body.alerts).to.be.an('array').to.have.lengthOf(1);
          done();
        })
        .catch(done);
    });
  });
});
