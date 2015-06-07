Template.personLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("personLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getPerson(itemId, function () {
				Session.set("personLinedCatalog_loaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("personLinedCatalog_loaded", true);
	});
});

Template.personLinedCatalog.helpers({
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
		
		return People.find({
			_id: {
				$in: itemIds
			}
		});
	}
});