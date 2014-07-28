var router = require('express').Router();

router.post("/", function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
