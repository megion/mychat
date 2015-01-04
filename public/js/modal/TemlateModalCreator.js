megion.TemplateModalCreator = function(templateId) {
	this.templateId = templateId;
	this.compiledTemplate = Hogan.compile(document.getElementById(this.templateId).innerHTML);
}

megion.TemplateModalCreator.prototype = Object.create(tabaga.ModalCreator.prototype);

megion.TemplateModalCreator.prototype.onCreate = function(modalWindow, data) {
	var renderedTemplate = this.compiledTemplate.render(data);
	modalWindow.innerHTML = renderedTemplate;
	modalWindow.context = data;
};

megion.TemplateModalCreator.prototype.onDestroy = function(modalWindow) {
	delete modalWindow.context;
};


