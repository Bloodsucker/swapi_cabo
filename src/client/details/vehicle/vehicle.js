VehicleController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'vehicleDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('vehicle', itemId);

		if (!Vehicle.findOne(itemId)) {
			return s;
		}
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Vehicle.findOne(itemId);
	}
});

Template.filmDetail.helpers({
});