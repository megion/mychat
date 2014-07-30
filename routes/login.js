var router = require('express').Router();

var User = require('models/user').User;
var HttpError = require('error').HttpError;
var AuthError = require('models/user').AuthError;
var async = require('async');

router.get("/", function(req, res) {
  res.render('login');
});

router.post("/", function(req, res, next) {
  console.log("req.body.username: " + req.body.username);
  var username = req.body.username;
  var password = req.body.password;

  User.authorize(username, password, function(err, user) {
    if (err) {
      if (err instanceof AuthError) {
        return next(new HttpError(403, err.message));
      } else {
        return next(err);
      }
    }

    req.session.user = user._id;
    res.send({});

  });

});

module.exports = router;