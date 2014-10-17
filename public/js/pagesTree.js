function PageDropTarget(element) {
	tabaga.DropTarget.apply(this, arguments);
}

// наследование таким образом не работает в IE8
// (можно использовать собственную универсальную функцию)
// переопределим tabaga.DropTarget
PageDropTarget.prototype = Object.create(tabaga.DropTarget.prototype);
// переопределить accept
PageDropTarget.prototype.accept = function(dragObject) {
	//console.log("DropTarget: " + this + " accept DragObject: " + dragObject
			//+ " state: " + this.state);
	tabaga.DropTarget.prototype.accept.apply(this, arguments);
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
			tabaga.popupMaster.closeContext();
			
			var dragObject = new tabaga.DragObject(nodeLi.nodeSpan);
			dragObject.setScrollManager(new tabaga.DragScrollManager(
			jQuery("#parentTreePages")[0]));
			
			var onDragSuccessFn = dragObject.onDragSuccess;
			dragObject.onDragSuccess = function(dropTarget) {
				// call super
				onDragSuccessFn.apply(this, arguments);
				console.log("Copy: DropTarget: " + dropTarget + " accept DragObject: " + this
						+ " state: " + dropTarget.state);
				// copy ...  
			}
			
			var onDragFailFn = dragObject.onDragFail;
			dragObject.onDragFail = function() {
				// call super
				onDragFailFn.apply(this, arguments);
				window.disableClickOnTreeNode = false;
			}
			
			tabaga.dragMaster.emulateDragStart(nodeLi.nodeSpan, {x: 0, y: -15});
			window.disableClickOnTreeNode = true;
			console.log("Onclick to copy: " + window.disableClickOnTreeNode);
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
		tabaga.stopEventPropagation(event);
		console.log("Onclick node: " + window.disableClickOnTreeNode);
		if (window.disableClickOnTreeNode) {
			window.disableClickOnTreeNode = false;
			return false;
		} else {
		    // call default onclick
			console.log("Onclick node: " + this);
		    return tabaga.onClickTreeNode.apply(this, arguments);
		}
	}

	new PageDropTarget(newNodeLi.nodeSpan);
	
	
	//tabaga.dragMaster.makeDraggable(newNodeLi.nodeSpan);
	
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
