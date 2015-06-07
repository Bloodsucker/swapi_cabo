StarshipController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'starshipDetail',
	action: function () {
		var self = this;

		var itemId = parseInt(this.params.itemId);

		Tracker.autorun(function (c) {
			var item = Starships.findOne(itemId);
			if (item) {
				Session.set('breadcum_catalog', 'Starships');
				Session.set('breadcum_detail', item.title);

				self.render();
				c.stop();
			} else {
				self.render('simpleLoader');
			}
		});

		Fetcher.getStarship(itemId, function () {
			self.render();
		});
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Starships.findOne(itemId);
	}
});