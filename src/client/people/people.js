PeopleController = RouteController.extend({
	layoutTemplate: 'normalLayout',
	template: 'peopleCatalog',
	waitOn: function () {
		return [
			Meteor.subscribe('people')
		];
	},

	data: function () {
		return People.find();
	}
});