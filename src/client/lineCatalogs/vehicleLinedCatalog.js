Template.vehicleLinedCatalog.onCreated(function() {
	var self = this;

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			self.subscribe("vehicle", itemId);
		});
	});
});

Template.vehicleLinedCatalog.helpers({
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