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

var globalCounter;
var MAX_LEVEL = 4;
function createTreePages(callback) {
	globalCounter = 0;
	createSiblingChildPages(null, 0, callback);
}

function createChildrenPage(parent, level, position, callback) {
	if (level == MAX_LEVEL) {
		return;
	}

	var name = parent ? (parent.name + "_" + position) : ("name_" + position);
	var title = parent ? (parent.title + "_" + position)
			: ("title_" + position);
	pageService.createPage(name, title, parent ? parent._id : null, function(
			err, childPage) {
		if (err) {
			console.error("childPage not created: " + name);
			console.error('Error:', err);
			return callback(err);
		}

		globalCounter++;
		if (globalCounter == treeCount(MAX_LEVEL)) {
			console.log("Finish. All pages created");
			return callback(null);
		}
		createSiblingChildPages(childPage, level + 1, callback);
	});
}

/**
 * Создать дочерние узлы
 */
function createSiblingChildPages(parent, level, callback) {
	for (var p = 0; p < MAX_LEVEL; p++) {
		createChildrenPage(parent, level, p, callback);
	}
}

/**
 * 
 * @param n
 * @returns количество элементов в дереве
 */
function treeCount(n) {
	var result = n;
	var x = n;
	for (var i = 1; i < n; i++) {
		x = x * n;
		result = result + x;
	}
	return result;
}

function close(callback) {
	console.log("Close connection")
	mongodb.closeConnection(callback);
}
