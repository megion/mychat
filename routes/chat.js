var router = require('express').Router();
var checkAuth = require('middleware/checkAuth');

router.get("/", checkAuth, function(req, res) {
  res.render('chat');
});

module.exports = router;