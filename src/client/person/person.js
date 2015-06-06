PersonController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'personDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.personId);

		var s = Meteor.subscribe('person', itemId);

		if (!People.findOne(itemId)) {
			return s;
		}
	},
	data: function() {
		var itemId = parseInt(this.params.personId);
		return People.findOne(itemId);
	}
});

Template.personDetail.helpers({
	debug: function () {
		console.log(this);
	}
});