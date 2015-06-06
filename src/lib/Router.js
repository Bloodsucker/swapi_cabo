Router.route('/', function () {
	this.redirect('people');
});

Router.route('/people', {
	name: "people",
	controller: 'PeopleController'
});
