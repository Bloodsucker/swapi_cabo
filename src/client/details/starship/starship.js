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
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Starships.findOne(itemId);
	}
});