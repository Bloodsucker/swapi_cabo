Template.filmLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("filmLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getFilm(itemId, function () {
				Session.set("filmLinedCatalog_loaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("filmLinedCatalog_loaded", true);
	});
});

Template.filmLinedCatalog.helpers({
	loaded: function () {
		return Session.equals("filmLinedCatalog_loaded", true);
	},
	items: function() {
		var itemUrls = Template.currentData();

		var itemIds = [];
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			itemIds.push(itemId);
		});

		return Films.find({
			_id: {
				$in: itemIds
			}
		});
	}
});