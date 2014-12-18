var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    ObjectId = require('mongodb').ObjectID,
    asyncUtils = require('utils/asyncUtils');

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

function findAllParentsById(treeCollection, nodeId, allParents, callback) {
	treeCollection.findOne({
		_id : nodeId
	}, function(err, node) {
		if (err) {
			return callback(err);
		}
		
		findAllParents(treeCollection, node, allParents, callback);
	});
}

function findAllParentsMapByNodes(treeCollection, nodes, callback) {
	var allParents = [];
	var allParentsMap = {};

	asyncUtils.eachSeries(nodes,
	// iterator function
	function(node, eachResultCallback) {
		iterateByParents(treeCollection, node, [], {},
		// can next function
		function(node, parents, parentsMap) {
			if (allParentsMap[node._id.toString()]) {
				return false;
			}

			return true;
		}, eachResultCallback);
	},
	// iterator result callback
	function(parents, parentsMap) {
		allParents = allParents.concat(parents);
		for (var i = 0; i < parents.length; i++) {
			var p = parents[i];
			allParentsMap[p._id.toString()] = p;
		}
	},
	// finish iterator result
	function(err) {
		if (err) {
			return callback(err);
		}

		return callback(null, allParents, allParentsMap);
	});
}

function iterateByParents(treeCollection, node, parents, parentsMap, canNextFn, callback) {
	if (!node.parentId) {
		// finish search
		return callback(null, parents, parentsMap);
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
		
		var canNext = canNextFn(parent, parents, parentsMap);
		if (!canNext) {
			return callback(null, parents, parentsMap);
		}
		
		parents.push(parent);
		parentsMap[parent._id.toString()] = parent;
		iterateByParents(treeCollection, parent, parents, parentsMap, canNextFn, callback);
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

/**
 * Fill allNodes array by children of parents tree. Find children has level <= MAX_LEVEL
 */
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

/**
 * Build tree scope by nodes array
 */
function buildTreeScope(treeCollection, nodes, callback) {
	var allNodes = [];
	findAllParentsMapByNodes(treeCollection, nodes, function(err, allParents,
			allParentsMap) {
		if (err) {
			return callback(err);
		}

		asyncUtils.eachSeries(allParents,
		// iterator function
		function(parent, eachResultCallback) {
			getTreeNodesByParents(treeCollection, [ parent ],
					eachResultCallback);
		},
		// iterator result callback
		function(treeNodes) {
			allNodes = allNodes.concat(treeNodes);
		},
		// finish iterator result
		function(err) {
			if (err) {
				return callback(err);
			}

			return callback(null, allNodes);
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
			return callback(new Error("Failed feed child nodes. Tree node not found by id: " + nodeId));
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
function feedTreeScopeNodes(treeCollection, ids, callback) {
	var idsSet = {};
	var nodeIds = [];
	for (var i = 0; i < ids.length; i++) {
		var id = ids[i];
		if (!idsSet[id]) {
			nodeIds.push(new ObjectId(id));
			idsSet[id] = true;
		}
	}
	
	treeCollection.find({
		_id : {
			$in : nodeIds
		}
	}).toArray(function(err, nodes) {
		if (err) {
			return callback(err);
		}
		
		if (!nodes) {
			return callback(new Error("Failed feed tree scope nodes. Tree nodes not found for ids: " + ids));
		}
		if (nodes.length!=nodeIds.length) {
			return callback(new Error("Failed feed tree scope nodes. Some tree nodes not found for ids: " + ids));
		}
		
		// 1. get all tree children nodes for parents [node]
		getTreeNodesByParents(treeCollection, nodes, function(err, treeNodes) {
			if (err) {
				return callback(err);
			}
			// build tree for all parents
			buildTreeScope(treeCollection, nodes, function(
					err, allNodes) {
				if (err) {
					return callback(err);
				}
				
				allNodes = allNodes.concat(treeNodes);
				
				// find roots nodes for including to the results 
				findChildrenByParentIds(treeCollection, null, function(err, rootNodes) {
					if (err) {
						return callback(err);
					}
					
					getTreeNodesByParents(treeCollection, rootNodes, function(err, rootTreeNodes) {
						if (err) {
							return callback(err);
						}
						
						allNodes = allNodes.concat(rootTreeNodes);
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

function printProcess(asyncCount) {
	if (asyncCount>0 && asyncCount % 55 == 0) {
		console.log(".");
	} else {
	    process.stdout.write(".");
	}
}

/**
 * Copy all children from srcItem to destItem
 * @param srcItem
 * @param destItem
 * @param treeCollection
 * @param createTreeItems
 * @param callback
 */
function copyChildren(srcItem, destItem, treeCollection, createCopyItemsFn, processStorage, callback) {
	processStorage.asyncCount++;
	// find all destination child
	printProcess(processStorage.asyncCount);
	findChildrenByParentIds(treeCollection, srcItem._id, function(err, srcChildren) {
		if (err) {
			return callback(err);
		}
		processStorage.asyncCount--;
		printProcess(processStorage.asyncCount);
		
		if (srcChildren.length==0) {
			if (processStorage.asyncCount==0) {
				console.log(".");
				console.log("Finish copy. Top created item: " + processStorage.topCreatedItem._id);
				return callback(null, processStorage.topCreatedItem);
			}
			return;
		}
		
		// create copy of srcChildren
		processStorage.asyncCount++;
		printProcess(processStorage.asyncCount);
		createCopyItemsFn(srcChildren, destItem._id, function(err, createdItems) {
			if (err) {
				return callback(err);
			}
			processStorage.asyncCount--;
			printProcess(processStorage.asyncCount);
			// recursive copy all children of scrChildren
			for (var i = 0; i < srcChildren.length; i++) {
				copyChildren(srcChildren[i], createdItems[i], treeCollection, createCopyItemsFn, processStorage, callback);
			}
		});
	});
}

function removeChildren(item, treeCollection, processStorage, callback) {
	processStorage.asyncCount++;
	printProcess(processStorage.asyncCount);
	// remove item
	treeCollection.remove({_id: item._id}, function(err, numberRemoved) {
		if (err) {
			return callback(err);
		}
		// remove children
		findChildrenByParentIds(treeCollection, item._id, function(err, children) {
			if (err) {
				return callback(err);
			}
			processStorage.asyncCount--;
			printProcess(processStorage.asyncCount);
			
			if (children.length==0) {
				if (processStorage.asyncCount==0) {
					console.log(".");
					console.log("Finish remove");
					return callback(null, processStorage.parentId);
				}
				return;
			}
			
			// recursive remove children
			for (var i = 0; i < children.length; i++) {
				removeChildren(children[i], treeCollection, processStorage, callback);
			}
		});
	});
	
	
}

/**
 * Find siblings by object ID
 */
function findSiblings(objId, treeCollection, callback) {
	// 1. Find source object
	treeCollection.findOne({
		_id : objId
	}, function(err, item) {
		if (err) {
			return callback(err);
		}
		
		findChildrenByParentIds(treeCollection, item._id, function(err, siblings) {
			if (err) {
				return callback(err);
			}
			
			return callback(null, siblings);
		});
	});
}

/**
 * Pass to callback TRUE if source object is one of the parent destination object.
 */
function isSrcParentDest(srcObjId, destObjId, treeCollection, callback) {
	findAllParentsById(treeCollection, destObjId, [], function(err, destParents){
		if (err) {
			return callback(err);
		}
		for (var i = 0; i < destParents.length; i++) {
			var destParent = destParents[i];
			if (destParent._id.equals(srcObjId)) {
				return callback(null, true);
			}
		}
		
		return callback(null, false);
	});
}

function copyTo(srcId, destId, treeCollection, createCopyItemsFn, callback) {
	var destObjId = new ObjectId(destId);
	var srcObjId = new ObjectId(srcId);
	
	isSrcParentDest(srcObjId, destObjId, treeCollection, function(err, srcIsParentDest){
		if (err) {
			return callback(err);
		}
		
		if (srcIsParentDest) {
			return callback(new Error("Restrictions copy source element into its child"));
		}
		
		// find all destination child
		findChildrenByParentIds(treeCollection, destObjId, function(err, destChildren) {
			if (err) {
				return callback(err);
			}
			
			// find max order
			var maxOrder = 0;
			for (var i = 0; i < destChildren.length; i++) {
				var child = destChildren[i];
				if (maxOrder < child.order) {
					maxOrder = child.order;
				}
			}
			maxOrder++;
			
			// 1. Find source object
			treeCollection.findOne({
				_id : srcObjId
			}, function(err, srcItem) {
				if (err) {
					return callback(err);
				}
				
				// create copy
				var processStorage = {
					asyncCount: 0
				};
				srcItem.order = maxOrder;
				createCopyItemsFn([srcItem], destObjId, function(err, createdItems) {
					if (err) {
						return callback(err);
					}
					processStorage.topCreatedItem = createdItems[0];
					copyChildren(srcItem, createdItems[0], treeCollection, createCopyItemsFn, processStorage, callback);
				});
			});
		});
	});
}

function moveTo(srcId, destId, treeCollection, createCopyItemsFn, callback) {
	var destObjId = new ObjectId(destId);
	var srcObjId = new ObjectId(srcId);
	
	isSrcParentDest(srcObjId, destObjId, treeCollection, function(err, srcIsParentDest){
		if (err) {
			return callback(err);
		}
		
		if (srcIsParentDest) {
			return callback(new Error("Restrictions move source element into its child"));
		}
		
		// find all destination child
		findChildrenByParentIds(treeCollection, destObjId, function(err, destChildren) {
			if (err) {
				return callback(err);
			}
			
			// find max order
			var maxOrder = 0;
			for (var i = 0; i < destChildren.length; i++) {
				var child = destChildren[i];
				if (maxOrder < child.order) {
					maxOrder = child.order;
				}
			}
			maxOrder++;
			
			// 1. Find destination object
			treeCollection.findOne({
				_id : destObjId
			}, function(err, destItem) {
				if (err) {
					return callback(err);
				}
				
				if (!destItem) {
					return callback(new Error("Failed move to. Destination tree node not found by id: " + destObjId));
				}
				
				treeCollection.findOne({
					_id : srcObjId
				}, function(err, srcItem) {
					if (err) {
						return callback(err);
					}
					
					if (!srcItem) {
						return callback(new Error("Failed move to. Source tree node not found by id: " + srcObjId));
					}
					
					var oldSrcItemParentId = srcItem.parentId;
					
					// update source item
					treeCollection.updateOne({
						_id : srcObjId
					},
					{$set: { parentId: destObjId, order: maxOrder }},
					{upsert:false, w: 1, multi: false},
					function(err, upResult) {
						if (err) {
							return callback(err);
						}
						
						console.log("Finish move source item: " + srcItem._id);
						return callback(null, oldSrcItemParentId);
					});
				});
			});
		});
	});
}

/**
 * Copy source object as neighbor of the destination object. 
 */
function copyNear(srcId, destId, offsetOrder, treeCollection, createCopyItemsFn, callback) {
	var destObjId = new ObjectId(destId);
	var srcObjId = new ObjectId(srcId);
	
	isSrcParentDest(srcObjId, destObjId, treeCollection, function(err, srcIsParentDest){
		if (err) {
			return callback(err);
		}
		
		if (srcIsParentDest) {
			return callback(new Error("Restrictions copy source element into its child"));
		}
		
		// find dest object
		treeCollection.findOne({
			_id : destObjId
		}, function(err, destItem) {
			if (err) {
				return callback(err);
			}
			
			// update sibling dest where order > dest.order
			var parentObjId;
			if (destItem.parentId) {
				parentObjId = new ObjectId(destItem.parentId);
			} else {
				parentObjId = null;
			}
			
			// update children where order >= destItem.order
			var incOrder = destItem.order + offsetOrder;
			console.log("update children of parent " + parentObjId + " where order >= " + incOrder);
			treeCollection.update({
				parentId : parentObjId,
				order: {$gte: incOrder}
			},
			{$inc: { order: 1 }},
			{multi: true},
			function(err, upResult) {
				if (err) {
					return callback(err);
				}
				
				console.log("upResult.nModified " + upResult.result.nModified);
				
				// 1. Find source object
				treeCollection.findOne({
					_id : srcObjId
				}, function(err, srcItem) {
					if (err) {
						return callback(err);
					}
					
					// create copy of source item
					var processStorage = {
						asyncCount: 0
					};
					srcItem.order = incOrder;
					createCopyItemsFn([srcItem], parentObjId, function(err, createdItems) {
						if (err) {
							return callback(err);
						}
						processStorage.topCreatedItem = createdItems[0];
						copyChildren(srcItem, createdItems[0], treeCollection, createCopyItemsFn, processStorage, callback);
					});
				});
			});
		});
	});
}

function copyOver(srcId, destId, treeCollection, createCopyItemsFn, callback) {
	copyNear(srcId, destId, 0, treeCollection, createCopyItemsFn, callback);
}

function copyUnder(srcId, destId, treeCollection, createCopyItemsFn, callback) {
	copyNear(srcId, destId, 1, treeCollection, createCopyItemsFn, callback);
}

function removeNode(id, treeCollection, callback) {
	var objId = new ObjectId(id);
	
	treeCollection.findOne({
		_id : objId
	}, function(err, item) {
		if (err) {
			return callback(err);
		}
		
		var processStorage = {
			asyncCount: 0,
			parentId: item.parentId
		};
		removeChildren(item, treeCollection, processStorage, callback);
	});
	
}

/* web functions */
exports.feedRootNodes = feedRootNodes;
exports.feedChildNodes = feedChildNodes;
exports.feedTreeScopeNodes = feedTreeScopeNodes;
exports.copyTo = copyTo;
exports.copyOver = copyOver;
exports.copyUnder = copyUnder;
exports.moveTo = moveTo;
exports.removeNode = removeNode;

