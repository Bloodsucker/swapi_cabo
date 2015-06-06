PersonController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'personDetail',
	waitOn: function() {
		var s = Meteor.subscribe('person', this.params.personId);

		if (!People.findOne(parseInt(this.params.personId))) {
			return s;
		}
	},
	data: function() {
		return People.findOne(parseInt(this.params.personId));
	}
});

Template.personDetail.helpers({
	debug: function() {
		console.log(People.findOne(1));
	}
});