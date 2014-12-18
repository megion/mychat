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
	treeService.feedTreeScopeNodes(pageCollection, [req.param("nodeId")], function(err, treeScopeNodes) {
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
		
		var treeScopeIds = [topCreatedItem._id.toString(), req.param("srcId")];
		if (req.param("selectedId")) {
			treeScopeIds.push(req.param("selectedId"));
		}
		treeService.feedTreeScopeNodes(pageCollection, treeScopeIds, function(err, treeScopeNodes) {
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
router.post('/moveTo', function(req, res, next) {
	var pageCollection = pageService.getCollection();
	treeService.moveTo(req.param("srcId"), req.param("destId"), pageCollection, pageService.createCopyItems, function(err, oldSrcItemParentId) {
		if (err)
			return next(err);
		
		var treeScopeIds = [req.param("srcId")];
		if (oldSrcItemParentId) {
			treeScopeIds.push(oldSrcItemParentId.toString());
		}
		if (req.param("selectedId")) {
			treeScopeIds.push(req.param("selectedId"));
		}
		treeService.feedTreeScopeNodes(pageCollection, treeScopeIds, function(err, treeScopeNodes) {
			if (err)
				return next(err);
			var result = {
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
		
		var treeScopeIds = [topCreatedItem._id.toString(), req.param("srcId")];
		if (req.param("selectedId")) {
			treeScopeIds.push(req.param("selectedId"));
		}
		
		treeService.feedTreeScopeNodes(pageCollection, treeScopeIds, function(err, treeScopeNodes) {
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
		
		var treeScopeIds = [topCreatedItem._id.toString(), req.param("srcId")];
		if (req.param("selectedId")) {
			treeScopeIds.push(req.param("selectedId"));
		}
		
		treeService.feedTreeScopeNodes(pageCollection, treeScopeIds, function(err, treeScopeNodes) {
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
		
		var treeScopeIds = [];
		if (req.param("selectedId") && req.param("id")!=req.param("selectedId")) {
			treeScopeIds.push(req.param("selectedId"));
		}
		if (parentId) {
			treeScopeIds.push(parentId.toString());
		}
	
		if (treeScopeIds.length==0) {
			treeService.feedRootNodes(pageCollection, function(err, rootNodes) {
				if (err)
					return next(err);
				
				var result = {
					treeScopeNodes: rootNodes
				};
				res.json(result);
			});
		} else {
			treeService.feedTreeScopeNodes(pageCollection, treeScopeIds, function(err, treeScopeNodes) {
				if (err) {
					return next(err);
				}
				
				var result = {
					treeScopeNodes: treeScopeNodes
				};
				res.json(result);
			});
		}
		
	});
});

module.exports = router;
