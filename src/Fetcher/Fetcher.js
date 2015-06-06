Fetcher.getPeoples = function(page, onComplete) {
	page = page || 1;

	var url = SWAPI.baseUrl + SWAPI.people + '?' + SWAPI.format + '&page=' + page;

	console.log(url);

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		onComplete(res.data);
	});
}

Fetcher.getPeopleId = function (urlStr) {
	return parseInt( urlStr.match(/\d+/)[0] );
}