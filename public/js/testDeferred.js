var promises_ary = [];

var rand = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

var promise;

function testPromise(index) {
	var dfd = new $.Deferred();

	setTimeout(function() {
		console.log(index);
		return dfd.resolve();
	}, rand(1, 5) * 1000);

	return dfd.promise();
}

/*for (var i = 0; i < 3; i++) {
	var ind = i;
	if (promise) {
		promise = promise.then(function() {
			return testPromise(ind);
		});
	} else {
		promise = testPromise(ind);
	}

	promises_ary.push(promise);
}*/


testPromise(1).then(function() {
	var pr = testPromise(2);
	return pr;
}).then(function() {
	var pr = testPromise(3);
	return pr;
}).then(function() {
	var pr = testPromise(4);
	return pr;
}).then(function() {
	var pr = testPromise(5);
	return pr;
}).done(function() {
	console.log('Promises Ary is Done');
});

/*$.when.apply($, promises_ary).done(function() {
	return console.log('Promises Ary is Done');
});*/

$.ajax('http://echo.jsontest.com/id/1').then(function() {
	console.log('OK 1');
	return $.ajax('http://echo.jsontest.com/id/2');
}).then(function() {
	console.log('OK 2');
	return $.ajax('http://echo.jsontest_fail.com/id/3');
}).then(function() {
	console.log('OK 3');
	return $.ajax('http://echo.jsontest.com/id/4');
}).then(function() {
	console.log('OK 4');
}).fail(function() {
	console.log('error');
});