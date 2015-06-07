PeopleController = RouteController.extend({
	layoutTemplate: 'normalLayout',
	template: 'peopleCatalog',

	action: function () {
		var self = this;

		Session.set('breadcum_catalog', 'People');
		Session.set('breadcum_detail', null);

		Fetcher.getPeoples(1, function () {
			self.render();
		});

		self.render('simpleLoader');

	},

	data: function () {
		return People.find();
	}
});