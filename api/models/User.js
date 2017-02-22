const crypto = require('crypto');
/**
 * User.js
 *
 * @description :: Users of the API must exist and authenticate to use the API
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id : {
      type: 'integer',
      primaryKey: true,
      autoIncrement: true
    },
    name : {
      type: 'string',
      size: 128
    },
    username: {
      type: 'string',
      size: 128,
      minLength: 5
    },
    passports: {
      collection: 'passport',
      via: 'user'
    },
    email: {
      type: 'string',
      size: 255,
      minLength: 6,
      unique: true
    },
    /**
     * Give the user a gravatar - for funzies
     * @returns {string}
     */
    getGravatarUrl: function () {
      var md5 = crypto.createHash('md5');
      md5.update(this.email || '');
      return 'https://gravatar.com/avatar/'+ md5.digest('hex');
    },
    /**
     * Remove sensitive data and append the gravatar URL when stringifying
     * @returns {*}
     */
    toJSON: function () {
      var user = this.toObject();
      delete user.password;
      user.gravatarUrl = this.getGravatarUrl();
      return user;
    }
  },

  beforeCreate: function (user, next) {

    if (!user.username || !user.username.trim())
      user.username = user.email;

    user.created_at = new Date();

    next();
  },
};

