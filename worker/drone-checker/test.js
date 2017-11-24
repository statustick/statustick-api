const chai = require('chai'); // eslint-disable-line import/newline-after-import
const nock = require('nock');
const mongoose = require('mongoose');

const { expect } = chai;
const Drone = require('../../server/drone/drone.model');
const worker = require('./index');

chai.config.includeStack = true;

const basePath1 = 'http://drone-service-1.com';
const basePath2 = 'http://drone-service-2.com';

const drone1 = new Drone({ basePath: basePath1 });
const drone2 = new Drone({ basePath: basePath2 });

const droneInfo = {
  success: true,
  info: {
    city: 'Istanbul',
    country: 'Turkey',
    ip: '123.123.123.123',
    timezone: 'Europe/Istanbul',
    location: {
      lat: 41,
      lon: 29
    }
  },
  support: [
    'HTTP'
  ],
};

before((done) => {
  Drone.remove()
    .then(() => done());
});

after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

describe('## Drone Checker Worker', () => {
  before(() => {
    nock(basePath1)
      .get('/check')
      .reply(200, droneInfo);
    nock(basePath2)
      .get('/check')
      .reply(200, droneInfo);
  });
  describe('# GET Drone Info', () => {
    it('should throw connection refused error', (done) => {
      worker.getDroneInfo({})
        .catch((err) => {
          expect(err.code).to.be.equal('ECONNREFUSED');
          done();
        });
    });
    it('should return success drone info', (done) => {
      worker.getDroneInfo(drone1)
        .then((data) => {
          expect(data).to.have.property('success');
          expect(data).to.have.property('info');
          expect(data.info).to.be.an('object');
          expect(data.support).to.be.an('array');
          done();
        })
        .catch(done);
    });
  });

  describe('# Update Drone Info', () => {
    let droneObject;
    const latitude = Math.floor((Math.random() * 360) + 1) - 180;
    const longitude = Math.floor((Math.random() * 360) + 1) - 180;
    before((done) => {
      new Drone(drone1).save()
        .then((savedDrone) => {
          droneObject = savedDrone;
          done();
        })
        .catch(done);
    });
    it('should throw error undefined location', (done) => {
      worker.updateDrone(droneObject, {})
        .catch((err) => {
          expect(err.message).to.be.equal('Cannot read property \'location\' of undefined');
          done();
        });
    });
    it('should throw Drone not found error', (done) => {
      worker.updateDrone({}, droneInfo)
        .catch((err) => {
          expect(err.message).to.be.equal('Drone not found');
          done();
        });
    });
    it('should update drone info successfully', (done) => {
      droneInfo.info.location.lat = latitude;
      droneInfo.info.location.lon = longitude;

      worker.updateDrone(droneObject, droneInfo)
        .then(() => Drone.findOne({ _id: droneObject._id }))
        .then((savedDrone) => {
          expect(savedDrone.info.location[0]).to.equal(longitude);
          expect(savedDrone.info.location[1]).to.equal(latitude);
          done();
        })
        .catch(done);
    });
  });

  describe('# Process queue', () => {
    const jobData = {};
    before((done) => {
      Drone.remove()
        .then(() => new Drone(drone2).save()
          .then((savedDrone) => {
            jobData.data = savedDrone;
            done();
          }))
        .catch(done);
    });
    it('should throw error', (done) => {
      worker.process({ data: {} }, (result) => {
        expect(result instanceof Error).to.be.equal(true);
        done();
      });
    });
    it('should process queue', (done) => {
      worker.process(jobData, (result) => {
        expect(result.success).to.equal(true);
        expect(result instanceof Error).to.be.equal(false);
        done();
      });
    });
  });
});
