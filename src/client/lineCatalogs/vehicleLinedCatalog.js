Template.vehicleLinedCatalog.onRendered(function() {
	var self = this;

	Session.set("vehicleLinedCatalog_loaded", false);

	self.autorun(function() {
		var itemUrls = Template.currentData();

		var itemsToLoad = 0;
		itemUrls.forEach(function(itemUrl) {
			var itemId = Fetcher.getId(itemUrl);
			Fetcher.getVehicle(itemId, function () {
				Session.set("vehicleLinedCatalog_loaded", true);
			
				itemsToLoad++;
				if (itemsToLoad === itemUrls.length) Session.set("vehicleLinedCatalog_AllLoaded", true);
			});
		});

		if (!itemUrls.length)
			Session.set("vehicleLinedCatalog_loaded", true);
	});
});

Template.vehicleLinedCatalog.helpers({
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

		return Vehicles.find({
			_id: {
				$in: itemIds
			}
		});
	}
});

Template.vehicleLinedCatalog.onCreated(function () {
	ug.startTimer('vehicleLinedCatalogTimer');
	this.autorun(function() {
		if (Session.get('vehicleLinedCatalog_AllLoaded')) {
			ug.endTimer('vehicleLinedCatalogTimer');
		}
	});
});

Template.vehicleLinedCatalog.events({
	'click .item a': function () {
		ug.event('click', 'vehicleLinedCatalog_anchor', this._id);
	}
});