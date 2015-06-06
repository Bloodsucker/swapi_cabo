Router.route('/', function () {
	this.redirect('people');
});

Router.route('/people', {
	name: "people",
	controller: 'PeopleController'
});

Router.route('/people/:personId', {
	name: "person",
	controller: 'PersonController'
});