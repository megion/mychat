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
	treeService.copyTo(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err, topCreatedItem) {
		if (err)
			return next(err);
		
		treeService.feedTreeScopeNodes(pageCollection, topCreatedItem._id.toString(), function(err, treeScopeNodes) {
			if (err)
				return next(err);
			var result = {
				topCreatedId: topCreatedItem._id.toString(),
				treeScopeNodes: treeScopeNodes
			};
			res.json(result);
		});
	});
});
router.post('/copyOver', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.copyOver(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err, topCreatedItem) {
		if (err) {
			return next(err);
		}
		
		treeService.feedTreeScopeNodes(pageCollection, topCreatedItem._id.toString(), function(err, treeScopeNodes) {
			if (err) {
				return next(err);
			}
			var result = {
				topCreatedId: topCreatedItem._id.toString(),
				treeScopeNodes: treeScopeNodes
			};
			res.json(result);
		});
	});
});

router.post('/copyUnder', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.copyUnder(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err, topCreatedItem) {
		if (err) {
			return next(err);
		}
		
		treeService.feedTreeScopeNodes(pageCollection, topCreatedItem._id.toString(), function(err, treeScopeNodes) {
			if (err) {
				return next(err);
			}
			var result = {
				topCreatedId: topCreatedItem._id.toString(),
				treeScopeNodes: treeScopeNodes
			};
			res.json(result);
		});
	});
});

router.post('/removeNode', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.removeNode(req.param("id"), pageCollection, function(err, parentId) {
		if (err) {
			return next(err);
		}
	
		if (parentId) {
			var pId = parentId.toString();
			treeService.feedTreeScopeNodes(pageCollection, pId, function(err, treeScopeNodes) {
				if (err) {
					return next(err);
				}
				
				var result = {
					treeScopeNodes: treeScopeNodes
				};
				res.json(result);
			});
		} else {
			treeService.feedRootNodes(pageCollection, function(err, rootNodes) {
				if (err)
					return next(err);
				
				var result = {
					treeScopeNodes: rootNodes
				};
				res.json(result);
			});
		}
		
	});
});

module.exports = router;
