const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
const app = require('../../index');

const Contact = require('./contact.model');

chai.config.includeStack = true;

describe('## Contact APIs', () => {
  const credentials = {
    username: `statustick_${Math.random()}`,
    password: 'password'
  };

  const invalidTypeContact = {
    type: 'INVALID',
    name: 'INVALID-TYPE',
    url: 'http://statustick.com'
  };

  const invalidUrlContact = {
    type: 'WEBHOOK',
    name: 'INVALID-URL',
    url: 'invalidurl.com'
  };

  const validSlackContact = {
    type: 'SLACK',
    name: 'SLACK-TEST',
    url: 'http://slack.com'
  };

  const params = { jwtToken: null, contact: null };

  before(() => request(app)
    .post('/auth/register')
    .send(credentials)
    .then((res) => {
      params.jwtToken = `Bearer ${res.body.accounts[0].token}`;
    }));


  describe('# POST /contacts', () => {
    it('should return name and type is required', (done) => {
      request(app)
        .post('/contacts')
        .set('Authorization', params.jwtToken)
        .send({})
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"name" is required and "type" is required');
          done();
        })
        .catch(done);
    });

    it('should return invalid type', (done) => {
      request(app)
        .post('/contacts')
        .set('Authorization', params.jwtToken)
        .send(invalidTypeContact)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"type" must be one of [WEBHOOK, SLACK]');
          done();
        })
        .catch(done);
    });

    it('should return invalid url', (done) => {
      request(app)
        .post('/contacts')
        .set('Authorization', params.jwtToken)
        .send(invalidUrlContact)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('"url" must be a valid uri with a scheme matching the http|https pattern');
          done();
        })
        .catch(done);
    });

    it('should create a contact', (done) => {
      request(app)
        .post('/contacts')
        .set('Authorization', params.jwtToken)
        .send(validSlackContact)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('contact');
          expect(res.body.contact).to.have.property('id');
          expect(res.body.contact).to.have.property('createdAt');
          expect(res.body.contact).to.have.property('params');
          expect(res.body.contact.name).to.equal(validSlackContact.name);
          expect(res.body.contact.type).to.equal(validSlackContact.type);
          expect(res.body.contact.params.url).to.equal(validSlackContact.url);

          params.contact = res.body.contact;
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /contacts', () => {
    it('should contains created contact', (done) => {
      request(app)
        .get('/contacts')
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('contacts');
          expect(res.body.contacts).to.deep.include(params.contact);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /contacts/:idContact', () => {
    it('should return contact detail', (done) => {
      request(app)
        .get(`/contacts/${params.contact.id}`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('contact');
          expect(res.body.contact).to.deep.include(params.contact);
          done();
        })
        .catch(done);
    });
  });

  describe('# DELETE /contacts/:idContact', () => {
    it('should delete contact', (done) => {
      request(app)
        .delete(`/contacts/${params.contact.id}`)
        .set('Authorization', params.jwtToken)
        .expect(httpStatus.OK)
        .then(() => Contact.get(params.contact.id))
        .catch((error) => {
          expect(error.message).to.be.equal('No such contact exists!');
          done();
        });
    });
  });
});
