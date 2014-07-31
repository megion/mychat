var path = require('path');
var util = require('util');
var http = require('http');

// ошибки для выдачи посетителю
function HttpError(status, message) {
	Error.apply(this, arguments);
	Error.captureStackTrace(this, HttpError);

	this.status = status;
	this.message = message || http.STATUS_CODES[status] || "Error";
}

util.inherits(HttpError, Error);
HttpError.prototype.name = 'HttpError';
exports.HttpError = HttpError;

// user authorization error
function AuthError(message) {
	Error.apply(this, arguments);
	Error.captureStackTrace(this, AuthError);

	this.message = message;
}

util.inherits(AuthError, Error);
AuthError.prototype.name = 'AuthError';
exports.AuthError = AuthError;
