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
		
		res.render('treePages', { treeJson: rootNodes });
		//res.json(rootNodes);
	});
});

router.get('/page', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.feedChildNodes(pageCollection, req.param("nodeId"), function(err, childNodes) {
		if (err)
			return next(err);
		res.json(childNodes);
	});
});

router.get('/pageTreeScope', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.feedTreeScopeNodes(pageCollection, req.param("nodeId"), function(err, treeScopeNodes) {
		if (err)
			return next(err);
		res.json(treeScopeNodes);
	});
});

router.post('/copyTo', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.copyTo(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err) {
		if (err)
			return next(err);
		
		treeService.feedTreeScopeNodes(pageCollection, req.param("destId"), function(err, treeScopeNodes) {
			if (err)
				return next(err);
			res.json(treeScopeNodes);
		});
	});
});
router.post('/copyOver', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.copyOver(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err) {
		if (err)
			return next(err);
		
		treeService.feedTreeScopeNodes(pageCollection, req.param("destId"), function(err, treeScopeNodes) {
			if (err)
				return next(err);
			res.json(treeScopeNodes);
		});
	});
});

module.exports = router;
