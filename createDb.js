var mongodb = require('lib/mongodb');
var async = require('async');
var userService = require('service/userService');
var pageService = require('service/pageService');

async.series([ open, dropDatabase, createUsers, createTreePages, close ],
		function(err) {
			console.log(arguments);
			process.exit(err ? 255 : 0);
		});

function open(callback) {
	mongodb.openConnection(callback);
}

function dropDatabase(callback) {
	var db = mongodb.getDb();
	db.dropDatabase(callback);
}

function createUsers(callback) {
	var users = [ {
		username : 'Вася',
		password : 'supervasya'
	}, {
		username : 'Петя',
		password : '123'
	}, {
		username : 'admin',
		password : 'thetruehero'
	} ];

	async.each(users, function(userData, callback) {
		userService.createUser(userData.username, userData.password, callback)
	}, callback);
}

function createTreePages(callback) {
	createSiblingChildPages(null, 0, 0, 4, callback);
}

function createChildrenPage(parent, level, localPosition, parentPosition, maxLevel, callback) {
	if (level == maxLevel) {
		return;
	}

	var name = parent ? (parent.name + "_" + localPosition) : ("name_" + localPosition);
	var title = parent ? (parent.title + "_" + localPosition) : ("title_" + localPosition);
	pageService.createPage(name, title, parent ? parent._id : null, function(
			err, childPage) {
		if (err) {
			console.error("childPage not created: " + name);
			console.error('Error:', err);
			return callback(err);
		}
		
		var childPosition;
		if (parentPosition==0) {
			childPosition = localPosition + 1;
		} else {
			childPosition = parentPosition * (localPosition + 1);
		}
		console.log("childPosition: " + childPosition);
		console.log("New page created: " + childPage.name);
		if (childPosition >= (maxLevel * maxLevel * maxLevel * maxLevel)) {
			// mark finish
			console.log("Finish. All pages created");
			return callback(null);
		}
		
		createSiblingChildPages(childPage, level + 1, childPosition, maxLevel, callback);
	});
}

/**
 * Создать дочерние узлы
 */
function createSiblingChildPages(parent, level, parentPosition, maxLevel, callback) {
	for (var p = 0; p < maxLevel; p++) {
		createChildrenPage(parent, level, p, parentPosition, maxLevel, callback);
	}
}

function close(callback) {
	console.log("Close connection")
	mongodb.closeConnection(callback);
}
