StarshipController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'starshipDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('startship', itemId);

		if (!Starship.findOne(itemId)) {
			return s;
		}
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Starship.findOne(itemId);
	}
});