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

Meteor.publish('person', function (personId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.people + personId + '?' + SWAPI.format;

	var person = HTTP.get(url).data;

	var personId = Fetcher.getPeopleId(person.url);
	self.added('people', personId, person);

	self.ready();
});

Meteor.publish('film', function (filmId) {
	var self = this;

	var url = SWAPI.baseUrl + SWAPI.films + filmId + '?' + SWAPI.format;

	console.log(url);

	var film = HTTP.get(url).data;

	var filmId = Fetcher.getFilmId(film.url);
	self.added('films', filmId, film);

	self.ready();
});