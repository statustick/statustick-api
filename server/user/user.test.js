const mongoose = require('mongoose');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;

const User = mongoose.model('User');

require('../../index');

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

describe('## User Model', () => {
  describe('# User pre-save hook', () => {
    it('Should encrypt plain password', (done) => {
      const credentials = {
        username: `statustick_${Math.random()}`,
        password: `statustick_${Math.random()}`
      };
      new User(credentials).save()
        .then((savedUser) => {
          expect(savedUser.password).to.not.equal(credentials.password);
          done();
        });
    });

    it('Should not match wrong password', (done) => {
      const credentials = {
        username: `statustick_${Math.random()}`,
        password: `statustick_${Math.random()}`
      };
      new User(credentials).save()
        .then(savedUser => savedUser.comparePassword(`statustick_${Math.random()}`))
        .then(() => {
          expect(true).to.be.false; // eslint-disable-line no-unused-expressions
          done();
        })
        .catch(() => {
          done();
        });
    });
    it('Should match correct password', (done) => {
      const credentials = {
        username: `statustick_${Math.random()}`,
        password: `statustick_${Math.random()}`
      };
      new User(credentials).save()
        .then(savedUser => savedUser.comparePassword(credentials.password))
        .then(() => {
          done();
        })
        .catch(() => {
          expect(true).to.be.false; // eslint-disable-line no-unused-expressions
          done();
        });
    });
  });
});
