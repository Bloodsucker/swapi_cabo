Template.filmLineCatalog.onCreated(function() {
	var self = this;

	self.autorun(function() {
		var filmUrls = Template.currentData();

		filmUrls.forEach(function(filmUrl) {
			var filmId = Fetcher.getFilmId(filmUrl);
			console.log(filmId);
			self.subscribe("film", filmId);
		});
	});
});

Template.filmLineCatalog.helpers({
	films: function() {
		var filmUrls = Template.currentData();

		var filmIds = [];
		filmUrls.forEach(function(filmUrl) {
			var filmId = Fetcher.getFilmId(filmUrl);
			filmIds.push(filmId);
		});

		return Films.find({
			_id: {
				$in: filmIds
			}
		});
	}
});