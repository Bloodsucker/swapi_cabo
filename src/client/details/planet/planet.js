PlanetController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'planetDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('planet', itemId);

		if (!Planets.findOne(itemId)) {
			return s;
		}
	},

	action: function () {
		var itemId = parseInt(this.params.itemId);

		Session.set('breadcum_catalog', 'Planets');
		Session.set('breadcum_detail', Planets.findOne(itemId).title);

		this.render();
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Planets.findOne(itemId);
	}
});
