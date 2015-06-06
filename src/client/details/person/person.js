PersonController = RouteController.extend({
	layoutTemplate: 'detailLayout',
	template: 'personDetail',
	waitOn: function() {
		var itemId = parseInt(this.params.itemId);

		var s = Meteor.subscribe('person', itemId);

		if (!People.findOne(itemId)) {
			return s;
		}
	},

	action: function () {
		var itemId = parseInt(this.params.itemId);

		Session.set('breadcum_catalog', 'People');
		Session.set('breadcum_detail', People.findOne(itemId).name);

		this.render();
	},
	data: function() {
		var itemId = parseInt(this.params.itemId);
		return People.findOne(itemId);
	}
});

Template.personDetail.helpers({
	debug: function () {
		console.log(this);
	}
});