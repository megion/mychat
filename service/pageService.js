var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    treeService = require('service/treeService'),
    ObjectId = require('mongodb').ObjectID;

function getCollection() {
	return mongodb.getDb().collection("pages");
}

function createPage(name, title, parentId, order, callback) {
	var page = new Page(name, title, parentId, order);
	var collection = getCollection();
	collection.insert(page, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, page);
	});
}

function copyTo(srcId, destId, callback) {
	var collection = getCollection();
	
	collection.findOne({
		_id : new ObjectId(srcId)
	}, function(err, srcPage){
		if (err) {
			return callback(err);
		}
		
		treeService.findChildrenByParentIds(collection, destId, function(err, destChildren) {
			if (err) {
				return callback(err);
			}
			
			var maxOrder = 0;
			for (var i = 0; i < destChildren.length; i++) {
				var child = destChildren[i];
				if (maxOrder < child.order) {
					maxOrder = child.order;
				}
			}
			
			//createPage(name, title, parentId, order, callback)
		});
		
	});

	var collection = getCollection();
	collection.insert(page, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, page);
	});
}

exports.createPage = createPage;
exports.getCollection = getCollection;
