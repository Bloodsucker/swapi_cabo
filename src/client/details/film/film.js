FilmController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'filmDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.filmId);
		var s = Meteor.subscribe('film', itemId);

		if (!Film.findOne(itemId)) {
			return s;
		}
	},
	data: function() {
		var itemId = parseInt(this.params.filmId);
		return Film.findOne(itemId);
	}
});

Template.filmDetail.helpers({
});