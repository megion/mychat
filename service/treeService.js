var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    ObjectId = mongodb.ObjectID;

var log = require('lib/log')(module);

var MAX_LEVEL = 3;

/**
 * Find all child for specified parents
 * 
 * @param treeCollection
 *            collection of mongodb
 * @param parents
 *            filer parents object
 * @param callback
 */
function findChildrenByParents(treeCollection, parents, callback) {
	var childsFilter;
	if (parents) {
		if (Array.isArray(parents)) {
			// массив
			if (parents.length == 0) {
				childsFilter = {
					parentId : null
				};
			} else {
				var ids = [];
				for (var i = 0; i < parents.length; i++) {
					ids[i] = ObjectId(parents[i]._id);
				}
				childsFilter = {
					parentId : {$in:ids}
				};
			}
		}
	} else {
		childsFilter = {
			parentId : null
		};
	}

	treeCollection.find(childsFilter).toArray(function(err, children) {
		if (err) {
			return callback(err);
		}
		
		log.info("retrieved children: " + children);
		callback(null, children);
	});
}

/**
 * Connect children of its parent
 * @param treeNodes array tree nodes which contains parents
 * @param excludeParentId - parent id for exclude node.parentId for connection
 */
function connectChildrenToParent(treeNodes, excludeParentId) {
	var nodesMap = {};
	// fill nodes map
	for(var i = 0; i < treeNodes.length; i++) {
		nodesMap[node._id] = node;
	}
	
	// connect children to parent 
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		if (node.parentId && 
				!(excludeParentId && (node.parentId==excludeParentId))) {
			var parent = nodesMap[node.parentId];
			if (parent) {
				if (!parent.children) {
					parent.children = [];
				}
				parent.children.push(node);
			} else {
				// array treeNodes have not valid state
				log.error("Tree node not found by id: " + node.parentId + ". Skip this node");
			}
		}
	}
}

function buildTreeByParents(treeCollection, parents, level, allNodes, callback) {
	findChildrenByParents(treeCollection, parents, function(err, children) {
		if (err) {
			return callback(err);
		}
		
		if (children && (children.length > 0)) {
			var nodes = parents.concat(children)
			level++;
			if (level == MAX_LEVEL) {
				return callback(null, nodes);
			}
			buildTreeByParents(treeCollection, children, level, nodes, callback);
		} else {
			// no more children. Finalize build tree.
			// mark parents no children
			for (var i = 0; i < parents.length; i++) {
				parents[i].noChildren = true;
			}
			callback(null, allNodes);
		}
		
	});
}

function feedRootNodes(treeCollection, callback) {
	findChildsByParents(treeCollection, null, function(err, rootNodes) {
		if (err) {
			return callback(err);
		}
		
		buildTreeByParents(treeCollection, rootNodes, 1, [], function(err, treeNodes) {
			if (err) {
				return callback(err);
			}
			
			connectChildrenToParent(treeNodes, null);
			callback(null, rootNodes);
		});
	});
}
function feedChildNodes(treeCollection, node, callback) {	
}
function feedTreeScopeNodes(treeCollection, node, callback) {	
}

exports.findChildrenByParents = findChildrenByParents;
