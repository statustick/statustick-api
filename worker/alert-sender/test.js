require('../util/db');
const Promise = require('bluebird');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const nock = require('nock');
const Contact = require('../../server/contact/contact.model');
const Monitor = require('../../server/monitor/monitor.model');
const worker = require('../../config/worker');
const alertSender = require('./index');

const { expect } = chai;

const params = { monitor: null, job: null };

chai.config.includeStack = true;

before((done) => {
  worker.singleAlert.empty().then(() => done());
});

describe('## Alert Sender Worker', () => {
  before((done) => {
    nock('http://hook.statustick.com')
      .post('/')
      .reply(200);
    Promise.all([
      new Contact({ type: 'WEBHOOK' }).save(),
      new Contact({ type: 'WEBHOOK' }).save(),
      new Contact({ type: 'WEBHOOK' }).save(),
      new Contact({ type: 'WEBHOOK' }).save(),
      new Contact({ type: 'WEBHOOK' }).save()
    ]).then(results => new Monitor({ code: 'TEST', contacts: results }).save())
      .then((result) => {
        params.monitor = result;
        done();
      });
  });
  describe('# Process Alert', () => {
    it('should distribute alert to each contact', (done) => {
      const job = {
        data: {
          monitor: params.monitor,
          alert: {}
        }
      };

      alertSender.processAlert(job, (result) => {
        expect(result instanceof Error).to.be.equal(false);
        expect(result.success).to.equal(true);

        worker.singleAlert.counts()
          .then((counts) => {
            expect(counts.waiting).to.be.equal(5);
            done();
          });
      });
    });
    describe('# Process Single Alert', () => {
      before(() => {
        const contact = new Contact({ type: 'WEBHOOK', params: { url: 'http://error.statustick.com' } });
        params.job = {
          data: {
            monitor: params.monitor,
            alert: {},
            contact
          }
        };
      });
      it('should return error on not working webhook', (done) => {
        alertSender.processSingleAlert(params.job, (result) => {
          expect(result instanceof Error).to.be.equal(true);
          done();
        });
      });

      it('should return success on working webhook', (done) => {
        params.job.data.contact.params.url = 'http://hook.statustick.com';
        alertSender.processSingleAlert(params.job, (result) => {
          expect(result instanceof Error).to.be.equal(false);
          expect(result.success).to.equal(true);
          done();
        });
      });
    });
  });
});


after((done) => {
  Monitor.remove();
  Contact.remove();
  worker.singleAlert.empty().then(() => done());
});
