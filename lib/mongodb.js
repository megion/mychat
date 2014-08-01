var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    Server = mongodb.Server,
    Db = mongodb.Db;

var config = require('config');

// set up the connection to db
var db = new Db(config.get('mongodb:db'),
		new Server(config.get('mongodb:server:host'), config.get('mongodb:server:port'), config.get('mongodb:server:options')));

exports.db = db;
