const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');
const config = require('../../config/config');

chai.config.includeStack = true;

describe('## Auth APIs', () => {
  const validUserCredentials = {
    username: `statustick_${Math.random()}`,
    password: 'password'
  };

  const invalidUserCredentials = {
    username: `statustick_${Math.random()}`,
    password: 'WrongPassword'
  };

  let jwtToken;

  describe('# POST /auth/register', () => {
    it('should register user and get valid JWT Token', (done) => {
      request(app)
        .post('/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('accounts');
          expect(res.body).to.have.property('user');

          jwt.verify(res.body.accounts[0].token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.user.username).to.equal(validUserCredentials.username);
            jwtToken = `Bearer ${res.body.accounts[0].token}`;
            done();
          });
        })
        .catch(done);
    });

    it('should return Conflict on using username', (done) => {
      request(app)
        .post('/auth/register')
        .send(validUserCredentials)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          expect(res.body.message).to.equal('Username already taken');
          expect(res.body.code).to.equal('error.conflict.username');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /auth/login', () => {
    it('should return Authentication error', (done) => {
      request(app)
        .post('/auth/login')
        .send(invalidUserCredentials)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Authentication error');
          expect(res.body.code).to.equal('error.auth.login');
          done();
        })
        .catch(done);
    });

    it('should get valid JWT token', (done) => {
      request(app)
        .post('/auth/login')
        .send(validUserCredentials)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('accounts');
          expect(res.body).to.have.property('user');
          const { token } = res.body.accounts[0];
          jwt.verify(token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.user.username).to.equal(validUserCredentials.username);
            jwtToken = `Bearer ${token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  describe('# GET /auth/profile', () => {
    it('should fail to get profile because of missing Authorization', (done) => {
      request(app)
        .get('/auth/profile')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should fail to get profile because of wrong token', (done) => {
      request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer inValidToken')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should get a profile', (done) => {
      request(app)
        .get('/auth/profile')
        .set('Authorization', jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('user');
          done();
        })
        .catch(done);
    });
  });


  describe('# GET /auth/account', () => {
    it('should fail to get profile because of missing Authorization', (done) => {
      request(app)
        .get('/auth/account')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should fail to get profile because of wrong token', (done) => {
      request(app)
        .get('/auth/account')
        .set('Authorization', 'Bearer inValidToken')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });

    it('should get a profile', (done) => {
      request(app)
        .get('/auth/account')
        .set('Authorization', jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('account');
          done();
        })
        .catch(done);
    });
  });
});
