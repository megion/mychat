function eachSeries(arr, iteratorFn, callback) {
	var acyncProcessStorage = {
		count: 0,
		results: {}
	};
	
	iterateOneSeries(objects, acyncProcessStorage, iteratorFn, callback);
}

function iterateOneSeries(objects, acyncProcessStorage, iteratorFn, callback) {
	if (acyncProcessStorage.count>=(objects.length)) {
		// finish
		return callback(null, acyncProcessStorage.results);
	}
	
	iteratorFn(objects[acyncProcessStorage.count], acyncProcessStorage.results, function(err, result, successResultFn) {
		if (err) {
			return callback(err);
		}
		
		successResultFn(result, acyncProcessStorage.results);
		
		acyncProcessStorage.count++;
		iterateOneSeries(objects, acyncProcessStorage, eachFn, callback);
	});
}

exports.eachSeries = eachSeries;
