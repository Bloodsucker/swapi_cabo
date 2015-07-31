if (Meteor.isClient) {
	UG = null;

	Meteor.startup(function () {
		ug = new Usaginity();
		ug.entering();
	});
}
