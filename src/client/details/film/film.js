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

	action: function () {
		var itemId = parseInt(this.params.itemId);

		Session.set('breadcum_catalog', 'Films');
		Session.set('breadcum_detail', Films.findOne(itemId).title);

		this.render();
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Films.findOne(itemId);
	}
});
