FilmController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'filmDetail',
	action: function () {
		var self = this;

		var itemId = parseInt(this.params.itemId);

		Tracker.autorun(function (c) {
			var item = Films.findOne(itemId);
			if (item) {
				Session.set('breadcum_catalog', 'Films');
				Session.set('breadcum_detail', item.title);

				self.render();
				c.stop();
			} else {
				self.render('simpleLoader');
			}
		});

		Fetcher.getFilm(itemId, function () {
			self.render();
		});
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return Films.findOne(itemId);
	}
});
