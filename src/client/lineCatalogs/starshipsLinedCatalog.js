Template.starshipsLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("vehicleLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getStarship(itemId, function () {
				Session.set("vehicleLinedCatalog_loaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("vehicleLinedCatalog_loaded", true);
	});
});

Template.starshipsLinedCatalog.helpers({
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

		return Starships.find({
			_id: {
				$in: itemIds
			}
		});
	}
});