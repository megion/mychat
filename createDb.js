var mongodb = require('lib/mongodb');
var async = require('async');
var userService = require('service/userService');
var pageService = require('service/pageService');

async.series([ open, dropDatabase, createUsers, createTreePages, close ], function(err) {
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
	createSiblingChildPages(null, 0, 4, callback);
}

function createChildrenPage(parent, level, position, maxLevel, callback) {
	if (level == maxLevel) {
		return callback(null);
	}

	pageService.createPage("name_" + level + "_" + position, "title_" + level
			+ "_" + position, parent ? parent._id : null, function(err,
			childPage) {
		if (err) {
			console.error('Error:', err);
			return callback(err);
		}
		console.log("New page created: " + childPage);
		createSiblingChildPages(childPage, level+1, maxLevel, callback);
	});
}

/**
 * Создать дочерние узлы
 */
function createSiblingChildPages(parent, level, maxLevel, callback) {
	for (var p = 0; p < maxLevel; p++) {
		createChildrenPage(parent, level, p, maxLevel, callback);
	}
}

function close(callback) {
	mongodb.closeConnection(callback);
}
