var mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    Server = mongodb.Server,
    ObjectId = mongodb.ObjectID;

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
		// save link on connection pool
		db = mongoclient.db(config.get('mongodb:db'));
		callback(null, db);
	});
}
function getDb() {
	return db;
}

function closeConnection(callback) {	
	mongoclient.close(function(err, result) {
		if(err) {
			callback(err, null);
		}
		callback(null, result);
	});
}

function findById(id, collection, callback) {	
	collection.findOne({"_id": ObjectId(id)}, callback);
}

exports.mongoclient = mongoclient;
exports.openConnection = openConnection;
exports.getDb = getDb;
exports.closeConnection = closeConnection;
exports.findById = findById;
