// переопределить TreetableControl
function PageTreetableControl() {
	tabaga.TreetableControl.apply(this, arguments);
}

PageTreetableControl.prototype = Object.create(tabaga.TreetableControl.prototype);

/*PageTreeControl.prototype.appendNewNode = function(parentUl, newNode) {
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
};*/

PageTreetableControl.prototype.loadChildNodes = function(nodeEl) {
	megion.showLoadingStatus(true);
	var self = this;
	var nodeId = nodeEl.nodeModel.id;
	$.ajax({
		url : "pages/page",
		dataType : "json",
		data : {
			"nodeId" : nodeId
		},
		success : function(loadedData) {
			// loaded data is array
			self.updateLoadedNode(nodeEl.nodeModel, loadedData[0]);
			megion.showLoadingStatus(false);
		},
		error: function (request, status, error) {
			megion.showLoadingStatus(false);
			console.error("Error status: " + status + " text: "+ request.responseText)
	    }
	});
};

PageTreetableControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed, updateCloseState) {
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
			// find nodeEl by node Id. Before update nodeModel may be null.
			var nodeModel = self.allNodesMap[nodeId];
			var nodeEl = nodeModel.nodeEl
			
			self.openNode(nodeEl, setClosed);
			megion.showLoadingStatus(false);
		},
		error: function (request, status, error) {
			megion.showLoadingStatus(false);
			console.error("Error status: " + status + " text: "+ request.responseText);
	    }
	});
};