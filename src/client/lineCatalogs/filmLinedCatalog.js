Template.filmLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("filmLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		var itemsToLoad = 0;
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getFilm(itemId, function () {
				Session.set("filmLinedCatalog_loaded", true);

				itemsToLoad++;
				if (itemsToLoad === itemUrls.length) Session.set("filmLinedCatalog_AllLoaded", true);
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

Template.filmLinedCatalog.onCreated(function () {
	ug.startTimer('filmLinedCatalogTimer');
	this.autorun(function() {
		if (Session.get('filmLinedCatalog_AllLoaded')) {
			ug.endTimer('filmLinedCatalogTimer');
		}
	});
});

Template.filmLinedCatalog.events({
	'click .item a': function () {
		ug.event('click', 'filmLinedCatalog_anchor', this._id);
	}
});