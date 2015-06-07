Fetcher.getPeoples = function(page, onComplete) {
	page = page || 1;

	var url = SWAPI.baseUrl + SWAPI.people + '?' + SWAPI.format + '&page=' + page;

	HTTP.get(url, function(err, r) {
		if (err) throw err;

		var people = r.data;

		people.results.forEach(function(person) {
			var personId = Fetcher.getId(person.url);
			People.upsert(personId, person);
		});

		typeof onComplete === "function" && onComplete(people);
	});
}

Fetcher.getPerson = function(itemId, onComplete) {
	var url = SWAPI.baseUrl + SWAPI.people + itemId + '/?' + SWAPI.format;

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		var item = res.data;

		var itemId = Fetcher.getId(item.url);
		People.upsert(itemId, item);

		typeof onComplete === "function" && onComplete(item);
	});
}

Fetcher.getFilm = function(itemId, onComplete) {
	var url = SWAPI.baseUrl + SWAPI.films + itemId + '/?' + SWAPI.format;

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		var item = res.data;

		var itemId = Fetcher.getId(item.url);
		Films.upsert(itemId, item);

		typeof onComplete === "function" && onComplete(item);
	});
}

Fetcher.getVehicle = function(itemId, onComplete) {
	var url = SWAPI.baseUrl + SWAPI.vehicles + itemId + '/?' + SWAPI.format;

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		var item = res.data;

		var itemId = Fetcher.getId(item.url);
		Vehicles.upsert(itemId, item);

		typeof onComplete === "function" && onComplete(item);
	});
}

Fetcher.getStarship = function(itemId, onComplete) {
	var url = SWAPI.baseUrl + SWAPI.starships + itemId + '/?' + SWAPI.format;

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		var item = res.data;

		var itemId = Fetcher.getId(item.url);
		Starships.upsert(itemId, item);

		typeof onComplete === "function" && onComplete(item);
	});
}

Fetcher.getPlanet = function(itemId, onComplete) {
	var url = SWAPI.baseUrl + SWAPI.planets + itemId + '/?' + SWAPI.format;

	HTTP.get(url, function(err, res) {
		if (err) throw err;

		var item = res.data;

		var itemId = Fetcher.getId(item.url);
		Planets.upsert(itemId, item);

		typeof onComplete === "function" && onComplete(item);
	});
}

Fetcher.getId = function(urlStr) {
	return parseInt(urlStr.match(/\d+/)[0]);
}