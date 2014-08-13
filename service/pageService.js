var Page = require('models/page').Page,
    mongodb = require('lib/mongodb'),
    async = require('async');

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

exports.createPage = createPage;
exports.getCollection = getCollection;
