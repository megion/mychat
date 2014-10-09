function PageDropTarget(element) {
	tabaga.DropTarget.apply(this, arguments);
}

// наследование таким образом не работает в IE8
// (можно использовать собственную универсальную функцию)
// переопределим tabaga.DropTarget
PageDropTarget.prototype = Object.create(tabaga.DropTarget.prototype);
// переопределить accept
PageDropTarget.prototype.accept = function(dragObject) {
	console.log("DropTarget: " + this + " accept DragObject: " + dragObject
			+ " state: " + this.state);
	tabaga.DropTarget.prototype.accept.apply(this, arguments);
	//tabaga.dragMaster.makeUnDraggable(nl.nodeSpan);
};

// переопределить TreeControl
function PageTreeControl() {
	tabaga.TreeControl.apply(this, arguments);
}
// переопределим tabaga.PopupMenu
function PageNodeContextMenu() {
	tabaga.PopupMenu.apply(this, arguments);
}

PageNodeContextMenu.prototype = Object.create(tabaga.PopupMenu.prototype);
PageNodeContextMenu.prototype.onCreate = function(containerMenu) {
	console.log("Create menu under container: " + containerMenu);

	var nodeLi = this.element;
	var treeControl = nodeLi.treeControl;
	treeControl.setSelectionTreeNode(nodeLi);

	var ulContainer = megion.createSimpleTextContextMenu([ {
		title : "Delete",
		onclick : function(e) {
		}
	}, {
		title : "Move",
		onclick : function(e) {
		}
	}, {
		title : "Copy",
		onclick : function(e) {
			tabaga.stopEventPropagation(e);
			
			//var nodeLi = this;
			console.log("nodeLi " + nodeLi);
			//tabaga.dragMaster.makeDraggable(nodeLi.nodeSpan);
			//treeControl.processAllNodes(function(nl){
				
			//});
			
			var dragObject = new tabaga.DragObject(nodeLi.nodeSpan);
			dragObject.setScrollManager(new tabaga.DragScrollManager(
					jQuery("#parentTreePages")[0]));
			
			//tabaga.fireEvent(nodeLi.nodeSpan, "mousedown");
			//tabaga.fireEvent(nodeLi.nodeSpan, "mousemove");
			
			tabaga.popupMaster.closeContext();
			
			e = tabaga.fixEvent(e);
			tabaga.dragMaster.emulateDragStart(e.pageX, e.pageY, nodeLi.nodeSpan);
			
			return false;
		}
	} ]);
	containerMenu.appendChild(ulContainer);
};

PageTreeControl.prototype = Object.create(tabaga.TreeControl.prototype);

PageTreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newNodeLi = tabaga.TreeControl.prototype.appendNewNode.apply(this,
			arguments);

	tabaga.popupMaster.makeContextable(newNodeLi);
	var menu = new PageNodeContextMenu(newNodeLi/*, jQuery("#parentTreePages")[0]*/);

	newNodeLi.onclick = function(event) {
		console.log("Onclick node: " + this);
		// call default onclick
		return tabaga.onClickTreeNode.apply(this, arguments);
	}

	
	new PageDropTarget(newNodeLi.nodeSpan);
	tabaga.dragMaster.makeDraggable(newNodeLi.nodeSpan);
	new tabaga.DragObject(newNodeLi.nodeSpan);
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
			self.updateExistNode(nodeLi, loadedData[0]);
			megion.showLoadingStatus(false);
		}
	});
};

PageTreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed) {
	megion.showLoadingStatus(true);
	var self = this;
	$.ajax({
		url : "pages/pageTreeScope",
		dataType : "json",
		data : {
			"nodeId" : nodeId
		},
		success : function(loadedData) {
			self.updateExistUlNodesContainer(self.treeUl,
					loadedData);
			// find Li by node Id. Before update nodeModel may be null.
			var nodeModel = self.allNodesMap[nodeId];
			var nodeLi = nodeModel.nodeLi
			
			self.openNode(nodeLi, setClosed);
			
			megion.showLoadingStatus(false);
		}
	});
};
