var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    ObjectId = require('mongodb').ObjectID;

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
	var parentIds;
	if (parents) {
		if (Array.isArray(parents)) {
			parentIds = [];
			for (var i = 0; i < parents.length; i++) {
				parentIds[i] = new ObjectId(parents[i]._id);
			}
		} else {
			parentIds = new ObjectId(parents._id);
		}
	} else {
		parentIds = null;
	}

	findChildrenByParentIds(treeCollection, parentIds, callback);
}

function findChildrenByParentIds(treeCollection, parentIds, callback) {
	var childsFilter;
	if (parentIds) {
		if (Array.isArray(parentIds)) {
			// array values
			childsFilter = {
				parentId : {
					$in : parentIds
				}
			};
		} else {
			// single value
			childsFilter = {
				parentId : parentIds
			};
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
		callback(null, children);
	});
}

function findAllParents(treeCollection, node, allParents, callback) {
	if (!node.parentId) {
		// finish search
		return callback(null, allParents);
	}

	treeCollection.findOne({
		_id : new ObjectId(node.parentId)
	}, function(err, parent) {
		if (err) {
			return callback(err);
		}

		if (!parent) {
			throw new Error("Tree node not found by id: " + node.parentId);
		}
		allParents.push(parent);
		findAllParents(treeCollection, parent, allParents, callback);
	});
}

function transformToIdsSet(nodes) {
	var idsSet = {};
	if (Array.isArray(nodes)) {
		for (var i = 0; i < nodes.length; i++) {
			idsSet[nodes[i]._id.toString()] = true;
		}
	} else {
		idsSet[nodes._id.toString()] = true;
	}
	return idsSet;
}

function setLevel(nodes, level) {
	if (Array.isArray(nodes)) {
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].level = level;
		}
	} else {
		nodes.level = level;
	}
}

/**
 * Remove redundant nodes from nodes array. If for the one Id of node present
 * several nodes then node have lowest level will be apply to result array. Such
 * algorithm to make a right conclusion about the necessity of loading the site
 * from the server.
 */
function normolizeTreeNodes(nodes) {
	var nodesMap = {};
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var id = node._id.toString()
		var exNode = nodesMap[id];
		if (exNode) {
			if (node.level < exNode.level) {
				nodesMap[id] = node;
			}
		} else {
			nodesMap[id] = node;
		}
	}

	var normNodes = [];
	for ( var key in nodesMap) {
		normNodes.push(nodesMap[key]);
	}
	return normNodes;
}

/**
 * Function build tree for specified treeNodes.
 * Process building are several operations: 
 * 1) connect children of its parent,
 * 2) sort children using order
 * 3) initialize properties (needLoad, fakeNode).
 * 
 * Function return top nodes array.
 * 
 * @param treeNodes
 *            array tree nodes
 * @param topNodeIdsSet -
 *            object contains id of top nodes for exclude node.parentId for
 *            connection
 */
function processBuildTree(treeNodes, topNodeIdsSet) {
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
				throw new Error("Tree node not found by id: " + parentId
						+ ". Skip this node");
			}
		}
	}
	
	topNodes.sort(compareNode);

	// finish processing nodes - sort and set flags
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		// sorting
		if (node.children && !node.childrenIsSorted) {
			node.children.sort(compareNode);
			node.childrenIsSorted = true;
		}

		if (node.level >= MAX_LEVEL) {
			node.fakeNode = true;
		}
		// set need loading flag
		if ((node.level == (MAX_LEVEL - 1)) && node.children) {
			node.needLoad = true;
		}
	}

	// remove redundant info
	for (var i = 0; i < treeNodes.length; i++) {
		var node = treeNodes[i];
		
		// rename property _id to id
		node.id = node._id.toString();
		delete node._id;
		
		delete node.childrenIsSorted;
		delete node.level;
	}

	return topNodes;
}

function compareNode(nodeA, nodeB) {
	return nodeA.order - nodeB.order;
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
/**
 * Get tree nodes for specified parents limits by MAX_LEVEL.
 */
function getTreeNodesByParents(treeCollection, parents, callback) {
	// set current level to 1
	var level = 1;
	setLevel(parents, level);
	buildTreeByParents(treeCollection, parents, level, parents, callback);
}

function buildTreeScope(treeCollection, node, allNodes, callback) {
	if (!node.parentId) {
		// finish search
		return callback(null, allNodes, node);
	}

	treeCollection.findOne({
		_id : new ObjectId(node.parentId)
	}, function(err, parent) {
		if (err) {
			return callback(err);
		}

		if (!parent) {
			throw new Error("Tree node not found by id: " + node.parentId);
		}

		getTreeNodesByParents(treeCollection, [parent], function(err, treeNodes) {
			if (err) {
				return callback(err);
			}
			var nodes = allNodes.concat(treeNodes);
			buildTreeScope(treeCollection, parent, nodes, callback);
		});
	});
}

function feedRootNodes(treeCollection, callback) {
	findChildrenByParentIds(treeCollection, null, function(err, rootNodes) {
		if (err) {
			return callback(err);
		}

		getTreeNodesByParents(treeCollection, rootNodes, function(err, treeNodes) {
			if (err) {
				return callback(err);
			}

			var topNodes = processBuildTree(treeNodes,
					transformToIdsSet(rootNodes));
			callback(null, topNodes);
		});
	});
}
function feedChildNodes(treeCollection, nodeId, callback) {
	treeCollection.findOne({
		_id : new ObjectId(nodeId)
	}, function(err, node) {
		if (err) {
			return callback(err);
		}
		
		if (!node) {
			throw new Error("Tree node not found by id: " + nodeId);
		}
		
		getTreeNodesByParents(treeCollection, [node], function(err, treeNodes) {
			if (err) {
				return callback(err);
			}

			var topNodes = processBuildTree(treeNodes,
					transformToIdsSet(node));
			callback(null, topNodes);
		});
	});
}

/**
 * Up to the all parents for specified node and build tree for each parent. Also
 * add to the tree of the all roots nodes. Id is need for recover tree node
 * information. Fore example request to open any tree node
 */
function feedTreeScopeNodes(treeCollection, nodeId, callback) {
	treeCollection.findOne({
		_id : new ObjectId(nodeId)
	}, function(err, node) {
		if (err) {
			return callback(err);
		}
		
		getTreeNodesByParents(treeCollection, [node], function(err, treeNodes) {
			if (err) {
				return callback(err);
			}
			// build tree for all parents
			buildTreeScope(treeCollection, node, treeNodes, function(
					err, allNodes, topNode) {
				if (err) {
					return callback(err);
				}
				
				// find roots nodes for including to the results 
				findChildrenByParentIds(treeCollection, null, function(err, rootNodes) {
					if (err) {
						return callback(err);
					}
					
					getTreeNodesByParents(treeCollection, rootNodes, function(err, treeNodes) {
						if (err) {
							return callback(err);
						}
						
						allNodes = allNodes.concat(treeNodes);
						var normNodes = normolizeTreeNodes(allNodes);

						var topNodes = processBuildTree(normNodes,
								transformToIdsSet(rootNodes));
						callback(null, topNodes);
					});
				});
			});
		});
	});
}

exports.feedRootNodes = feedRootNodes;
exports.feedChildNodes = feedChildNodes;
exports.feedTreeScopeNodes = feedTreeScopeNodes;
