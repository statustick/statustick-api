const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

chai.config.includeStack = true;

describe('## Misc', () => {
  describe('# GET /health-check', () => {
    it('should return OK', (done) => {
      request(app)
        .get('/health-check')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.text).to.equal('OK');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /protected', () => {
    it('should return 401 status', (done) => {
      request(app)
        .get('/protected')
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body.message).to.equal('Unauthorized');
          done();
        })
        .catch(done);
    });
  });

  describe('# Error Handling', () => {
    it('should handle express validation error - username is required', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          password: '12345678'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"username" is required');
          done();
        })
        .catch(done);
    });
  });
});
