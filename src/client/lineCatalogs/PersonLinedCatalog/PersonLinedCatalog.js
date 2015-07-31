Template.personLinedCatalog.onCreated(function() {
	var self = this;

	Session.set("personLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		var itemsToLoad = 0;
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getPerson(itemId, function () {
				Session.set("personLinedCatalog_loaded", true);

				itemsToLoad++;
				if (itemsToLoad === itemUrls.length) Session.set("personLinedCatalog_AllLoaded", true);
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

Template.personLinedCatalog.onCreated(function () {
	ug.startTimer('personLinedCatalogTimer');
	this.autorun(function() {
		if (Session.get('personLinedCatalog_AllLoaded')) {
			ug.endTimer('personLinedCatalogTimer');
		}
	});
});

Template.personLinedCatalog.events({
	'click .item a': function () {
		ug.event('click', 'personLinedCatalog_anchor', this._id);
	}
});