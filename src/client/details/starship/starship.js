StarshipController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'starshipDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('starship', itemId);

		if (!Starships.findOne(itemId)) {
			return s;
		}
	},

	action: function () {
		var itemId = parseInt(this.params.itemId);

		Session.set('breadcum_catalog', 'Starships');
		Session.set('breadcum_detail', Starships.findOne(itemId).name);

		this.render();
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Starships.findOne(itemId);
	}
});