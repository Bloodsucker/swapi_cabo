Template.planetLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("planetLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getPlanet(itemId, function () {
				Session.set("planetLinedCatalog_loaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("planetLinedCatalog_loaded", true);
	});
});

Template.planetLinedCatalog.helpers({
	loaded: function () {
		return Session.equals("planetLinedCatalog_loaded", true);
	},
	items: function() {
		var itemUrls = Template.currentData();

		var itemIds = [];
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			itemIds.push(itemId);
		});
		
		return Planets.find({
			_id: {
				$in: itemIds
			}
		});
	}
});