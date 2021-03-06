// объект пространства имен вспомогательных функций 
var megion = {};

/**
 * Показать индикатор запроса к серверу
 */
megion.loadingCount = 0;
megion.showLoadingStatus = function(visible) {
	var statusDiv = document.getElementById('loadingStatus');
	if (statusDiv) {
		if (visible) {
			statusDiv.style.display = "inline";
			megion.loadingCount++;
		} else {
			megion.loadingCount--;
			setTimeout(function() {
				if (megion.loadingCount==0) {
					statusDiv.style.display = "none";
				}
			}, 1000);
		}
		
	}
};

megion.createSimpleTextContextMenu = function(menuItems) {
	var ulContainer = document.createElement("ul");
	ulContainer.className = "simpleContextMenu";
	for (var i = 0; i < menuItems.length; i++) {
		var menuItem = menuItems[i];
		
		var itemLi = document.createElement("li");
		ulContainer.appendChild(itemLi);
		
		var itemA = document.createElement("a");
		itemLi.appendChild(itemA);
		
		var itemSpan = document.createElement("span")
		itemSpan.appendChild(document.createTextNode(menuItem.title));
		itemA.appendChild(itemSpan);
		
		itemA.onclick = menuItem.onclick;
	}
	return ulContainer;
};

megion.showError = function(container, errorMessage) {
	container.className = 'error';
	var msgElem = document.createElement('span');
	msgElem.className = "error-message";
	msgElem.innerHTML = errorMessage;
	container.appendChild(msgElem);
};

megion.resetError = function(container) {
	container.className = '';
	if (container.lastChild.className == "error-message") {
		container.removeChild(container.lastChild);
	}
};
