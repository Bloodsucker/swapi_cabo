PeopleController = RouteController.extend({
	layoutTemplate: 'normalLayout',
	template: 'peopleCatalog',
	action: function () {
		var self = this;

		Fetcher.getPeoples(1, function (people) {
			Session.set('people', people);

			people.results.forEach(function (person) {
				var personId = Fetcher.getPeopleId(person.url);
				Session.set('people_' + personId);
			});

			self.render();
		});
	},

	data: function () {
		return Session.get('people');
	}
});