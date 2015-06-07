PersonController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'personDetail',
	action: function () {
		var self = this;

		var itemId = parseInt(this.params.itemId);

		Tracker.autorun(function (c) {
			var item = People.findOne(itemId);
			if (item) {
				Session.set('breadcum_catalog', 'People');
				Session.set('breadcum_detail', item.name);

				self.render();
				c.stop();
			} else {
				self.render('simpleLoader');
			}
		});

		Fetcher.getPerson(itemId, function () {
			self.render();
		});
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return People.findOne(itemId);
	}
});
