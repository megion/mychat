megion.TemplateModalCreator = function(templateId, data) {
	this.templateId = templateId;
	this.data = data;
}

megion.TemplateModalCreator.prototype = Object.create(tabaga.ModalCreator.prototype);

megion.TemplateModalCreator.prototype.onCreate = function(modalWindow) {
	var tmpl = document.getElementById(this.templateId).innerHTML;
	var result = _.template(tmpl, this.data);
	modalWindow.appendChild(result);
};

megion.TemplateModalCreator.prototype.onDestroy = function(modalWindow) {
};


