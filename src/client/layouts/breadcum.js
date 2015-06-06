Template.breadcum.helpers({
	catalog: function () {
		return Session.get('breadcum_catalog');
		var gallery = Session.get('breadcum_catalog');
	},
	detail: function (argument) {
		return Session.get('breadcum_detail');
	}
});