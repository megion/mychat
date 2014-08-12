var Page = require('models/page').Page, mongodb = require('lib/mongodb'), async = require('async'), ObjectId = require('mongodb').ObjectID;

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
					ids[i] = new ObjectId(parents[i]._id);
				}
				childsFilter = {
					parentId : {
						$in : ids
					}
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
 * 
 * @param treeNodes
 *            array tree nodes which contains parents
 * @param topNodeIdsSet -
 *            object contains id of top nodes for exclude node.parentId for
 *            connection
 */
function connectChildrenToParent(treeNodes, topNodeIdsSet) {
	var nodesMap = {};
	// fill nodes map
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		nodesMap[node._id.toString()] = node;
	}

	// connect children to parent
	var topNodes = [];
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		if (topNodeIdsSet[node._id.toString()]) {
			topNodes.push(node);
		} else {
			var parentId = node.parentId.toString();
			var parent = nodesMap[parentId];
			if (parent) {
				if (!parent.children) {
					parent.children = [];
				}
				parent.children.push(node);
			} else {
				// array treeNodes have not valid state
				log.error("Tree node not found by id: " + parentId
						+ ". Skip this node");
			}
		}
	}
	
	// finish processing nodes - sort and set flags
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		
		// ...
	}
	
	return topNodes;
}

function buildTreeByParents(treeCollection, parents, level, allNodes, callback) {
	findChildrenByParents(treeCollection, parents,
			function(err, children) {
				if (err) {
					return callback(err);
				}

				if (children && (children.length > 0)) {
					var nodes = allNodes.concat(children)
					level++;
					// set current level
					setLevel(children, level);
					if (level == MAX_LEVEL) {
						return callback(null, nodes);
					}
					buildTreeByParents(treeCollection, children, level, nodes,
							callback);
				} else {
					// no more children. Finalize build tree.
					callback(null, allNodes);
				}

			});
}

function transformToIdsSet(nodes) {
	var idsSet = {};
	for (var i = 0; i < nodes.length; i++) {
		idsSet[nodes[i]._id.toString()] = true;
	}
	return idsSet; 
}

function setLevel(nodes, level) {
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].level = level;
	}
}

function feedRootNodes(treeCollection, callback) {
	findChildrenByParents(treeCollection, null, function(err, rootNodes) {
		if (err) {
			return callback(err);
		}

		// set current level
		var level = 1;
		setLevel(rootNodes, level);
		buildTreeByParents(treeCollection, rootNodes, level, rootNodes, function(err,
				treeNodes) {
			if (err) {
				return callback(err);
			}

			var topNodes = connectChildrenToParent(treeNodes, transformToIdsSet(rootNodes));
			callback(null, topNodes);
		});
	});
}
function feedChildNodes(treeCollection, node, callback) {
}
function feedTreeScopeNodes(treeCollection, node, callback) {
}

exports.findChildrenByParents = findChildrenByParents;
exports.feedRootNodes = feedRootNodes;
