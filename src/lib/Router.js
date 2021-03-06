Router.route('/', function () {
	this.redirect('people');
});

Router.route('/people', {
	name: "people",
	controller: 'PeopleController'
});

Router.route('/people/:itemId', {
	name: "person",
	controller: 'PersonController'
});

Router.route('/films/:itemId', {
	name: "film",
	controller: 'FilmController'
});

Router.route('/vehicles/:itemId', {
	name: "vehicle",
	controller: 'VehicleController'
});

Router.route('/starships/:itemId', {
	name: "starship",
	controller: 'StarshipController'
});

Router.route('/planets/:itemId', {
	name: "planet",
	controller: 'PlanetController'
});

Router.onAfterAction(function () {
	ug.transition();
});