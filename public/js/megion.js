// объект пространства имен вспомогательных функций 
var megion = {};

/**
 * Показать индикатор запроса к серверу
 */
megion.showLoadingStatus = function(visible) {
	var statusDiv = document.getElementById('loadingStatus');
	if (statusDiv) {
		if (visible) {
			statusDiv.style.display = "inline";
		} else {
			setTimeout(function() {
				statusDiv.style.display = "none";
			}, 1000);
		}
		
	}
};
