var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    ObjectId = mongodb.ObjectID;

/**
 * Find all child for specified parents
 * 
 * @param treeCollection
 *            collection of mongodb
 * @param parents
 *            filer parents object
 * @param callback
 */
function findChildsByParents(treeCollection, parents, callback) {
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
					parentId : {$in:[1,2,3]}
				};
			}
		}
	} else {
		childsFilter = {
			parentId : null
		};
	}

	treeCollection.find(childsFilter).toArray(function(err, childs) {
		if (err) {
			return callback(err);
		}
		
		console.log("retrieved childs:");
		console.log(childs);
		callback(null, childs);
	});
}

function feedRootNodes(treeCollection, callback) {	
}
function feedChildNodes(treeCollection, node, callback) {	
}
function feedTreeScopeNodes(treeCollection, node, callback) {	
}

exports.findChildsByParents = findChildsByParents;
