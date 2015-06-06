Template.personLinedCatalog.onCreated(function() {
	var self = this;

	self.autorun(function() {
		var itemUrls = Template.currentData();

		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			self.subscribe("person", itemId);
		});
	});
});

Template.personLinedCatalog.helpers({
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