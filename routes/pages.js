var router = require('express').Router();
var HttpError = require('error').HttpError;
var ObjectID = require('mongodb').ObjectID;
var log = require('lib/log')(module);

var pageService = require('service/pageService');
var treeService = require('service/treeService');

/* GET pages listing. */
router.get('/', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.feedRootNodes(pageCollection, function(err, rootNodes) {
		if (err)
			return next(err);
		res.json(rootNodes);
	});
});

module.exports = router;
