var User = require('models/user').User;
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

/**
 * Авторизация совмещенная с регистрацией.
 * Если пользователь найден по имени тогда проверка пароля,
 * если не найден тогда регистрация нового пользователя  
 * @param username
 * @param password
 * @param callback
 */
function authorize(username, password, callback) {
	async.waterfall([ function(callback) {
		User.findOne({
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
			var user = new User({
				username : username,
				password : password
			});
			user.save(function(err) {
				if (err)
					return callback(err);
				callback(null, user);
			});
		}
	} ], callback);
}

exports.setPassword = setPassword;
exports.authorize = authorize;
