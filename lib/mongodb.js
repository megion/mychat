var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    Server = mongodb.Server

var config = require('config');

// set up the connection to db
var mongoclient = new MongoClient(
		new Server(config.get('mongodb:server:host'), config.get('mongodb:server:port'), config.get('mongodb:server:options')),
		config.get('mongodb:optios'));

var db;
function openConnection(callback) {
	mongoclient.open(function(err, mongoclient) {
		if(err) {
			callback(err, null);
		}
		
		var db = mongoclient.db(config.get('mongodb:db'));
		callback(null, db);
	});
	
	db.open(function(err, p_db) {
		if(err) {
			callback(err, null);
		}
		
		callback(null, p_db);
	});
}

function getDb() {
	return db;
}

exports.mongoclient = mongoclient;
exports.openConnection = openConnection;
exports.getDb = getDb;
