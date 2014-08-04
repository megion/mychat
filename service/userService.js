var User = require('models/user').User;
var mongodb = require('lib/mongodb');
var async = require('async');
var crypto = require('crypto');
var AuthError = require('error').AuthError;

function encryptPassword(user, password) {
	return crypto.createHmac('sha1', user.salt).update(password).digest('hex');
}

function setPassword(user, password) {
	user.salt = Math.random() + '';
	user.hashedPassword = encryptPassword(user, password);
}

function checkPassword(user, password) {
	return encryptPassword(user, password) === user.hashedPassword;
}

function getUsersCollection() {
	return mongodb.getDb().collection("users");
}

function createUser(username, password, callback) {
	var user = new User(username);
	setPassword(user, password);
	var usersCollection = getUsersCollection();
	usersCollection.insert(user, function(err, results){
		if (err) {
			return callback(err);
		}
	
		user._plainPassword = password;
		callback(null, user);
	});
}

/**
 * Авторизация совмещенная с регистрацией.
 * Если пользователь найден по имени тогда проверка пароля,
 * если не найден тогда регистрация нового пользователя  
 * @param username
 * @param password
 * @param callback
 */
function authorize(username, password, callback) {
	var usersCollection = getUsersCollection();
	async.waterfall([ function(callback) {
		usersCollection.findOne({
			username : username
		}, callback);
	}, function(user, callback) {
		if (user) {
			if (checkPassword(user, password)) {
				callback(null, user);
			} else {
				callback(new AuthError("Пароль неверен"));
			}
		} else {
			createUser(username, password, callback);
		}
	} ], callback);
}

exports.setPassword = setPassword;
exports.authorize = authorize;
exports.createUser = createUser;
exports.getUsersCollection = getUsersCollection;
