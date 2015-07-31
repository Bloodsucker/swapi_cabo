Template.planetLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("planetLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		var itemsToLoad = 0;
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getPlanet(itemId, function () {
				Session.set("planetLinedCatalog_loaded", true);

				itemsToLoad++;
				if (itemsToLoad === itemUrls.length) Session.set("planetLinedCatalog_AllLoaded", true);
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

Template.planetLinedCatalog.onCreated(function () {
	ug.startTimer('planetLinedCatalogTimer');
	this.autorun(function() {
		if (Session.get('planetLinedCatalog_AllLoaded')) {
			ug.endTimer('planetLinedCatalogTimer');
		}
	});
});

Template.planetLinedCatalog.events({
	'click .item a': function () {
		ug.event('click', 'planetLinedCatalog_anchor', this._id);
	}
});