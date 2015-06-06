PeopleController = RouteController.extend({
	layoutTemplate: 'normalLayout',
	template: 'peopleCatalog',
	waitOn: function () {
		return [
			Meteor.subscribe('people')
		];
	},

	action: function () {
		Session.set('breadcum_catalog', 'People');
		Session.set('breadcum_detail', null);

		this.render();
	},

	data: function () {
		return People.find();
	}
});