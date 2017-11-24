const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

chai.config.includeStack = true;

describe('## Account APIs', () => {
  const credentials = {
    username: `statustick_${Math.random()}`,
    password: 'password'
  };

  const validAccount = {
    name: 'My Account',
    timezone: 'Europe/Istanbul'
  };

  const params = { jwtToken: null, account: null };

  before(() => request(app)
    .post('/auth/register')
    .send(credentials)
    .then((res) => {
      [params.account] = res.body.accounts;
      params.jwtToken = `Bearer ${params.account.token}`;
      delete params.account.token;
    }));

  describe('# GET /accounts', () => {
    it('should contains created account on register', (done) => {
      request(app)
        .get('/accounts')
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('accounts');
          expect(res.body.accounts).to.deep.include(params.account);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /accounts', () => {
    it('should create a new account', (done) => {
      request(app)
        .post('/accounts')
        .set('Authorization', params.jwtToken)
        .send(validAccount)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('account');
          params.account = res.body.account;
          done();
        })
        .catch(done);
    });
    it('should create a new account', (done) => {
      request(app)
        .post('/accounts')
        .set('Authorization', params.jwtToken)
        .send(validAccount)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('account');
          params.account = res.body.account;
          done();
        })
        .catch(done);
    });
    // TODO Update Account
  });
});
