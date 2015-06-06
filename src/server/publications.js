Meteor.publish('people', function (page) {
	var self = this;

	page = page || 1;

	var url = SWAPI.baseUrl + SWAPI.people + '?' + SWAPI.format + '&page=' + page;

	var people = HTTP.get(url).data;

	people.results.forEach(function(person) {
		var personId = Fetcher.getPeopleId(person.url);
		self.added('people', personId, person);
	});

	self.ready();
});

Meteor.publish('person', function (filmId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.people + filmId + '?' + SWAPI.format;

	console.log(url);

	var item = HTTP.get(url).data;

	var itemId = Fetcher.getId(item.url);
	self.added('people', itemId, item);

	self.ready();
});

Meteor.publish('film', function (filmId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.films + filmId + '?' + SWAPI.format;

	console.log(url)

	var item = HTTP.get(url).data;

	var itemId = Fetcher.getId(item.url);
	self.added('films', itemId, item);

	self.ready();
});

Meteor.publish('vehicle', function (filmId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.vehicles + filmId + '?' + SWAPI.format;

	var item = HTTP.get(url).data;

	var itemId = Fetcher.getId(item.url);
	self.added('vehicles', itemId, item);

	self.ready();
});

Meteor.publish('starship', function (filmId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.starships + filmId + '?' + SWAPI.format;

	var item = HTTP.get(url).data;

	var itemId = Fetcher.getId(item.url);
	self.added('starships', itemId, item);

	self.ready();
});