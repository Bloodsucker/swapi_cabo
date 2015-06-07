VehicleController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'vehicleDetail',
	action: function () {
		var self = this;

		var itemId = parseInt(this.params.itemId);

		Tracker.autorun(function (c) {
			var item = Vehicles.findOne(itemId);
			if (item) {
				Session.set('breadcum_catalog', 'Vehicles');
				Session.set('breadcum_detail', item.name);

				self.render();
				c.stop();
			} else {
				self.render('simpleLoader');
			}
		});

		Fetcher.getVehicle(itemId, function () {
			self.render();
		});
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Vehicles.findOne(itemId);
	}
});