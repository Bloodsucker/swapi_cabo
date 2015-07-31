Template.starshipsLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("starshipsLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		var itemsToLoad = 0;
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getStarship(itemId, function () {
				Session.set("starshipsLinedCatalog_loaded", true);

				itemsToLoad++;
				if (itemsToLoad === itemUrls.length) Session.set("starshipsLinedCatalog_AllLoaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("starshipsLinedCatalog_loaded", true);
	});
});

Template.starshipsLinedCatalog.helpers({
	loaded: function () {
		return Session.equals("starshipsLinedCatalog_loaded", true);
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

Template.starshipsLinedCatalog.onCreated(function () {
	ug.startTimer('starshipsLinedCatalogTimer');
	this.autorun(function() {
		if (Session.get('starshipsLinedCatalog_AllLoaded')) {
			ug.endTimer('starshipsLinedCatalogTimer');
		}
	});
});

Template.starshipsLinedCatalog.events({
	'click .item a': function () {
		ug.event('click', 'starshipsLinedCatalog_anchor', this._id);
	}
});