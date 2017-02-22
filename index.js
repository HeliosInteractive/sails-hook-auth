module.exports = function SailsHookAuth(sails) {

  var loader = require('sails-util-mvcsloader')(sails);

  var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  /*
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });*/

  var InternalLocal = new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    },
    function(email, password, next) {

      let user = {};

      if( email.indexOf('@') !== -1 ) user.email = email;
      else user.username = email;


      sails.models.user.findOne()
        .where(user)
        .populate('passports', {protocol : 'local', sort: 'updated_at DESC'})
        .then(user => {

          if( !user )
            return next(null, false, { message: 'Error.Passport.User.Wrong' });

          if( !user.passports.length )
            return next(null, false, { message: 'Error.Passport.Password.NotSet' });

          let local = user.passports[0];
          user.passports = null;
          local.validatePassword(password, function (err, res) {

            if (err)
              return next(err);

            if (!res)
              return next(null, false, { message: 'Error.Passport.Password.Wrong' });

            passport.update({
              user : user.id,
              accessToken : true,
            }, function(err, _user){
              return next(null, Object.assign(user, _user), local);
            });

          });
        }).catch(next);



      /*sails.models.user.findOne({ username: email }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });*/

    });


  return {
    defaults : {
      __configKey__ : {
        _hookTimeout: 30000, // 30 seconds to inject
        strategies : {
          local : InternalLocal
        }
      }
    },
    configure: function(){
/*
      // If SSL is on, use the HTTPS endpoint
      if (sails.config[this.configKey].ssl == true) {
        sails.config[this.configKey].url = "https://" + sails.config[this.configKey].domain;
      }
      // Otherwise use HTTP
      else {
        sails.config[this.configKey].url = "http://" + sails.config[this.configKey].domain;
      }*/
    },
    initialize: function(done) {

      loader.inject(function (err) {

        let strategies = sails.config[this.configKey].strategies;

        // add local strategy
        if( sails.config[this.configKey].strategies.local )
          passport.use(strategies.local);

        return done(err);
      });

    }
  };
}
