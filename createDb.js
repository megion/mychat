var mongodb = require('lib/mongodb');
var async = require('async');
var userService = require('service/userService');

async.series([ open, dropDatabase, createUsers, close ], function(err) {
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

function close(callback) {
	mongodb.closeConnection(callback);
}
