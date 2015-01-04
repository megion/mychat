var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async'),
    treeService = require('service/treeService'),
    ObjectId = require('mongodb').ObjectID;

function getCollection() {
	return mongodb.getDb().collection("pages");
}

function createPageByParams(name, title, parentId, order, callback) {
	var page = new Page(name, title, parentId, order);
	var collection = getCollection();
	collection.insert(page, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, page);
	});
}

function createPage(page, callback) {
	var collection = getCollection();
	collection.insert(page, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, page);
	});
}

function updatePage(page, callback) {
	var collection = getCollection();
	
	// update source item
	collection.updateOne({
		_id : page._id
	},
	{$set: { name: page.name, title: page.title }},
	{upsert:false, w: 1, multi: false},
	function(err, upResult) {
		if (err) {
			return callback(err);
		}
		
		console.log("Update item: " + page._id);
		return callback(null, page);
	});
}

function resolvePageByParams(req) {
	var page = new Page(req.param("name"), req.param("title"), null, null);
	
	if (req.param("id")) {
		page._id = new ObjectId(req.param("id"));
	}
	
	return page;
}

/**
 * Create copy srcItems in parentId
 * @param srcItems
 * @param parentId 
 * @param order
 * @param callback
 */
function createCopyItems(srcItems, parentId, callback) { 
	var pages = [];
	for (var i = 0; i < srcItems.length; i++) {
		var item = srcItems[i];
		pages.push(new Page(item.name, item.title, parentId, item.order));
	}
	var collection = getCollection();
	
	collection.insert(pages, {w: 1}, function(err, results){
		if (err) {
			return callback(err);
		}
		callback(null, results.ops);
	});
}

exports.createPageByParams = createPageByParams;
exports.createPage = createPage;
exports.updatePage = updatePage;
exports.resolvePageByParams = resolvePageByParams;
exports.createCopyItems = createCopyItems;
exports.getCollection = getCollection;
