FilmController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'filmDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('film', itemId);

		if (!Films.findOne(itemId)) {
			return s;
		}
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Films.findOne(itemId);
	}
});
