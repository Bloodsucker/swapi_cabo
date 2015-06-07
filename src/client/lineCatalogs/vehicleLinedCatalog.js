Template.vehicleLinedCatalog.onRendered(function() {
	var self = this;

	Session.set("vehicleLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getVehicle(itemId, function () {
				Session.set("vehicleLinedCatalog_loaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("vehicleLinedCatalog_loaded", true);
	});
});

Template.vehicleLinedCatalog.helpers({
	loaded: function () {
		return Session.equals("vehicleLinedCatalog_loaded", true);
	},
	items: function() {
		var itemUrls = Template.currentData();

		var itemIds = [];
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			itemIds.push(itemId);
		});

		return Vehicles.find({
			_id: {
				$in: itemIds
			}
		});
	}
});