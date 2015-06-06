VehicleController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'vehicleDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);
		var s = Meteor.subscribe('vehicle', itemId);

		if (!Vehicles.findOne(itemId)) {
			return s;
		}
	},

	action: function () {
		var itemId = parseInt(this.params.itemId);

		Session.set('breadcum_catalog', 'Vehicles');
		Session.set('breadcum_detail', Vehicles.findOne(itemId).name);

		this.render();
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Vehicles.findOne(itemId);
	}
});

Template.filmDetail.helpers({
});