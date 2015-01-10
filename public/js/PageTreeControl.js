// переопределить TreeControl
function PageTreeControl() {
	tabaga.TreeControl.apply(this, arguments);
}

PageTreeControl.prototype = Object.create(tabaga.TreeControl.prototype);

PageTreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newNodeLi = tabaga.TreeControl.prototype.appendNewNode.apply(this,
			arguments);

	tabaga.popupMaster.makeContextable(newNodeLi);
	var menu = new PageNodeContextMenu(newNodeLi);

	newNodeLi.onclick = function(event) {
		tabaga.stopEventPropagation(event);
		if (window.disableClickOnTreeNode) {
			window.disableClickOnTreeNode = false;
			return false;
		} else {
		    // call default onclick
		    return tabaga.AbstractTreeControl.onClickTreeNode.apply(this, arguments);
		}
	}

	var dropTarget = new PageDropTarget(newNodeLi.nodeSpan);
	dropTarget.nodeLi = newNodeLi;
	return newNodeLi;
};

PageTreeControl.prototype.init = function(rootNodes) {
	tabaga.TreeControl.prototype.init.apply(this,
			arguments);
	
	tabaga.popupMaster.makeContextable(this.treeEl);
	var menu = new PageTreeContextMenu(this.treeEl);
};

PageTreeControl.prototype.loadChildNodes = function(nodeLi) {
	megion.showLoadingStatus(true);
	var self = this;
	var nodeId = nodeLi.nodeModel.id;
	$.ajax({
		url : "pages/page",
		dataType : "json",
		data : {
			"nodeId" : nodeId
		},
		success : function(loadedData) {
			// loaded data is array
			self.updateExistNode(nodeLi, loadedData[0], false);
			megion.showLoadingStatus(false);
		},
		error: function (request, status, error) {
			megion.showLoadingStatus(false);
			console.error("Error status: " + status + " text: "+ request.responseText)
	    }
	});
};

PageTreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed, updateCloseState) {
	megion.showLoadingStatus(true);
	var self = this;
	$.ajax({
		url : "pages/pageTreeScope",
		dataType : "json",
		data : {
			"nodeId" : nodeId
		},
		success : function(loadedData) {
			self.updateRootNodes(loadedData, updateCloseState);
			// find Li by node Id. Before update nodeModel may be null.
			var nodeModel = self.allNodesMap[nodeId];
			var nodeLi = nodeModel.nodeEl
			
			self.openNode(nodeLi, setClosed);
			megion.showLoadingStatus(false);
		},
		error: function (request, status, error) {
			megion.showLoadingStatus(false);
			console.error("Error status: " + status + " text: "+ request.responseText);
	    }
	});
};