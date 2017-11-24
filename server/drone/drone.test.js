const request = require('supertest-as-promised');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

const Drone = mongoose.model('Drone');

chai.config.includeStack = true;

describe('## Drone APIs', () => {
  before(() => Drone.remove());
  describe('# GET /drones', () => {
    before((done) => {
      new Drone({
        info: {
          city: 'City',
          country: 'Country'
        },
        basePath: 'http://statustick.com'
      })
        .save(() => done());
    });
    it('should return drone list', (done) => {
      request(app)
        .get('/drones')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('drones');
          done();
        })
        .catch(done);
    });
  });
});
