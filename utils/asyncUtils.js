function eachSeries(arr, iteratorFn, eachResultFn, callback) {
	iterateOneSeries(arr, 0, iteratorFn, eachResultFn, callback);
}

function iterateOneSeries(arr, count, iteratorFn, eachResultFn, callback) {
	if (count>=(arr.length)) {
		// finish
		return callback(null);
	}
	
	iteratorFn(arr[count], function(err) {
		if (err) {
			return callback(err);
		}
		
		var args = Array.prototype.slice.call(arguments, 1);
        if (args.length <= 1) {
            args = args[0];
        }
		eachResultFn.apply(null, args);
		count++;
		iterateOneSeries(arr, count, iteratorFn, eachResultFn, callback);
	});
}

exports.eachSeries = eachSeries;
