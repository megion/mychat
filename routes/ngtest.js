var router = require('express').Router();
var HttpError = require('error').HttpError;
var ObjectID = require('mongodb').ObjectID;
var log = require('lib/log')(module);
var Page = require('models/page').Page;

var pageService = require('service/pageService');
var treeService = require('service/treeService');

router.get('/', function(req, res, next) {
	res.render('ang/test1', {});
});
router.get('/test2', function(req, res, next) {
	res.render('ang/test2', {});
});

module.exports = router;
