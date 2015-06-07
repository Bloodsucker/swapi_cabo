PlanetController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'planetDetail',
	action: function () {
		var self = this;

		var itemId = parseInt(this.params.itemId);

		Tracker.autorun(function (c) {
			var item = Planets.findOne(itemId);
			if (item) {
				Session.set('breadcum_catalog', 'Planets');
				Session.set('breadcum_detail', item.title);

				self.render();
				c.stop();
			} else {
				self.render('simpleLoader');
			}
		});

		Fetcher.getPlanet(itemId, function () {
			self.render();
		});
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Planets.findOne(itemId);
	}
});
