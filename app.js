var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorhandler = require('errorhandler');
var config = require('config');
var log = require('lib/log')(module);
var HttpError = require('error').HttpError;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
http.createServer(app).listen(config.get("port"), function() {
	log.info("Express server listening on port: " + config.get("port"));
});

// view engine setup
app.engine('ejs', require('ejs-locals')); // layout partial block
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (app.get('env') == 'development') {
	app.use(logger('dev'));
	app.use(errorhandler());
} else {
	app.use(logger('default'));
}

app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('middleware/sendHttpError'));

app.use('/', routes);
app.use('/users', users);

app.use(function(err, req, res, next) {
	if (typeof err == 'number') { // next(404);
		err = new HttpError(err);
	}

	if (err instanceof HttpError) {
		res.sendHttpError(err);
	} else {
		
		if (app.get('env') == 'development') {
			var handler = errorhandler();
			handler(err, req, res, next);
		} else {
			log.error(err);
			err = new HttpError(500);
			res.sendHttpError(err);
		}
	}
});

