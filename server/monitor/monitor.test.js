const request = require('supertest-as-promised');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const moment = require('moment-timezone');
const nock = require('nock');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

const Monitor = mongoose.model('Monitor');
const Alert = mongoose.model('Alert');
const Drone = mongoose.model('Drone');

chai.config.includeStack = true;

describe('## Monitor APIs', () => {
  const credentials = {
    username: `statustick_${Math.random()}`,
    password: 'password'
  };

  const nameRequiredMonitor = {
    code: 'VALID',
    type: 'HTTP',
    url: 'http://validurl.com'
  };

  const invalidUrlMonitor = {
    name: 'VALID-MONITOR',
    code: 'VALID',
    type: 'HTTP',
    url: 'invalidurl.com'
  };

  const invalidCodeMonitor = {
    name: 'VALID-MONITOR',
    code: 'NOTVALID',
    type: 'HTTP',
    url: 'http://validurl.com'
  };

  const validMonitor = {
    name: 'VALID-MONITOR',
    code: 'VALID',
    type: 'HTTP',
    url: 'http://validurl.com'
  };

  const validContact = {
    type: 'SLACK',
    name: 'SLACK-TEST',
    url: 'http://slack.com'
  };

  const invalidIdContact = 'INVALID-ID';

  const params = {
    jwtToken: null,
    monitor: null,
    contact: null
  };

  before(() => request(app)
    .post('/auth/register')
    .send(credentials)
    .then((res) => {
      params.jwtToken = `Bearer ${res.body.accounts[0].token}`;
    }));

  describe('# POST /monitors', () => {
    it('should return name is required', (done) => {
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(nameRequiredMonitor)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"name" is required');
          done();
        })
        .catch(done);
    });

    it('should return invalid url', (done) => {
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(invalidUrlMonitor)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"url" must be a valid uri with a scheme matching the http|https pattern');
          done();
        })
        .catch(done);
    });

    it('should return invalid code', (done) => {
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(invalidCodeMonitor)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"code" length must be less than or equal to 5 characters long');
          done();
        })
        .catch(done);
    });

    it('should create a monitor', (done) => {
      request(app)
        .post('/monitors')
        .set('Authorization', params.jwtToken)
        .send(validMonitor)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitor');
          params.monitor = res.body.monitor;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /monitors', () => {
    it('should contains created monitor', (done) => {
      request(app)
        .get('/monitors')
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitors');
          expect(res.body.monitors).to.deep.include(params.monitor);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /monitors/:idMonitor', () => {
    it('should return created monitor', (done) => {
      request(app)
        .get(`/monitors/${params.monitor.id}`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitor');
          expect(res.body.monitor).to.deep.include(params.monitor);
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /monitors/:idMonitor', () => {
    it('should update monitor', (done) => {
      request(app)
        .put(`/monitors/${params.monitor.id}`)
        .set('Authorization', params.jwtToken)
        .send({ name: 'UPDATED-NAME' })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitor');
          expect(res.body.monitor).to.have.property('name');
          expect(res.body.monitor.name).to.be.equal('UPDATED-NAME');
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /monitors/:idMonitor/contacts', () => {
    before(() => request(app)
      .post('/contacts')
      .set('Authorization', params.jwtToken)
      .send(validContact)
      .expect(httpStatus.OK)
      .then((res) => {
        params.contact = res.body.contact;
      }));
    it('should return Bad Request', (done) => {
      request(app)
        .post(`/monitors/${params.monitor.id}/contacts`)
        .set('Authorization', params.jwtToken)
        .send({ idContact: invalidIdContact })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal(`"idContact" with value "${invalidIdContact}" fails to match the required pattern: /^[0-9a-fA-F]{24}$/`);
          done();
        })
        .catch(done);
    });

    it('should return Not Found', (done) => {
      request(app)
        .post(`/monitors/${params.monitor.id}/contacts`)
        .set('Authorization', params.jwtToken)
        .send({ idContact: 'aaaaabbbbbcccccdddddcccc' })
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
    it('should contains contact', (done) => {
      request(app)
        .post(`/monitors/${params.monitor.id}/contacts`)
        .set('Authorization', params.jwtToken)
        .send({ idContact: params.contact.id })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitor');
          expect(res.body.monitor).to.have.property('contacts');
          expect(res.body.monitor.contacts).to.deep.include(params.contact);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /monitors/:idMonitor/contacts', () => {
    it('should remove contact', (done) => {
      request(app)
        .delete(`/monitors/${params.monitor.id}/contacts`)
        .set('Authorization', params.jwtToken)
        .send({ idContact: params.contact.id })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.success).to.equal(true);
          done();
        })
        .catch(done);
    });
    it('should not contains contact', (done) => {
      request(app)
        .get(`/monitors/${params.monitor.id}`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('monitor');
          expect(res.body.monitor).to.have.property('contacts');
          expect(res.body.monitor.contacts).to.not.include(params.contact);
          done();
        })
        .catch(done);
    });
  });

  describe('# POST /monitors/test', () => {
    before((done) => {
      Drone.remove()
        .then(() => {
          nock('http://drone.statustick.com')
            .post('/http')
            .reply(200, {
              success: true,
              data: {
                code: 200,
                text: 'OK',
                time: 100,
                drone: {
                  location: [180, 180],
                  name: 'Rivendell/Middle Earth'
                }
              }
            });
          done();
        });
    });
    it('should throw exception error.drone.not_implemented', (done) => {
      request(app)
        .post('/monitors/test')
        .set('Authorization', params.jwtToken)
        .send({ type: 'HTTP', url: 'http://statustick.com' })
        .expect(httpStatus.SERVICE_UNAVAILABLE)
        .then((res) => {
          expect(res.body.code).to.equal('error.drone.not_implemented');
          done();
        })
        .catch(done);
    });
    it('should return test result', (done) => {
      new Drone({
        basePath: 'http://drone.statustick.com',
        support: ['HTTP'],
        info: {
          city: 'Rivendell',
          country: 'Middle Earth',
          location: [180, 180]
        }
      }).save(() => {
        request(app)
          .post('/monitors/test')
          .set('Authorization', params.jwtToken)
          .send({ type: 'HTTP', url: 'http://statustick.com' })
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body.success).to.equal(true);
            expect(res.body.data.code).to.equal(200);
            expect(res.body.data.text).to.equal('OK');
            done();
          })
          .catch(done);
      });
    });
  });
});

describe('## Monitor Model', () => {
  describe('# Monitor pre-save hook', () => {
    it('Should remove duplicate contact IDs', (done) => {
      const contactIDs = ['59fa257c8b94f41a2796c822', '59fa257c8b94f41a2796c822', '59fa257d8b94f41a2796c827', '59fa257c8b94f41a2796c822', '59fa27f0e3ca5c1be020091b'];
      new Monitor({
        code: 'AAA',
        contacts: contactIDs
      }).save()
        .then((savedMonitor) => {
          expect(savedMonitor.contacts.length).to.equal(3);
          done();
        });
    });

    it('Should replace any non-word character in code', (done) => {
      new Monitor({
        code: 'A*A= a-'
      }).save()
        .then((savedMonitor) => {
          expect(savedMonitor.code).to.equal('AAA');
          done();
        });
    });
  });
  describe('# Monitor shouldTrigger function', () => {
    it('Should trigger alert when time is passed', (done) => {
      let monitor;
      new Monitor({
        delay: 1,
        code: `${Math.random()}`
      })
        .save((savedMonitor) => {
          monitor = savedMonitor;
          return new Alert({
            isActive: true
          }).save();
        })
        .then((savedAlert) => {
          const alert = savedAlert;
          alert.createdAt = moment().subtract(3, 'minutes').toDate();
          const result = new Monitor(monitor).shouldTrigger(alert);
          expect(result).to.be.equal(true); // eslint-disable-line no-unused-expressions
          done();
        }).catch(e => done(e));
    });
    it('Should repeat trigger alert when repeat time is passed', (done) => {
      let monitor;
      new Monitor({
        delay: 1,
        code: `${Math.random()}`
      })
        .save((savedMonitor) => {
          monitor = savedMonitor;
          return new Alert({
            isActive: true
          }).save();
        })
        .then((savedAlert) => {
          const alert = savedAlert;
          alert.lastTriggerAt = moment().subtract(6, 'minutes').toDate();
          const result = new Monitor(monitor).shouldTrigger(alert);
          expect(result).to.be.equal(true); // eslint-disable-line no-unused-expressions
          done();
        }).catch(e => done(e));
    });
  });
});
