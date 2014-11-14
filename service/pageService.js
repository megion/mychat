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

/**
 * Create copy srcItems in parentId
 * @param srcItems
 * @param parentId 
 * @param order
 * @param callback
 */
function createCopyItems(srcItems, parentId, startOrder, callback) { 
	var pages = [];
	for (var i = 0; i < srcItems.length; i++) {
		var item = srcItems[i];
		pages.push(new Page(item.name, item.title, parentId, startOrder + i));
	}
	var collection = getCollection();
	collection.insert(pages, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, results);
	});
}

exports.createPage = createPage;
exports.createCopyItems = createCopyItems;
exports.getCollection = getCollection;
