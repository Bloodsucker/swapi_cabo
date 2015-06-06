Template.filmLineCatalog.onCreated(function() {
	var self = this;

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			self.subscribe("film", itemId);
		});
	});
});

Template.filmLineCatalog.helpers({
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