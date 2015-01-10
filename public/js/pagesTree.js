var pagetree = {
	TREE_NODE_CONTEXT_OPENED: 'cm-opened',
	TREE_CONTEXT_OPENED: 'cm-tree-opened'
};

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

var createPageModalCreator = new megion.TemplateModalCreator("changePageModal-template");

function onClickCopyMove(e, copyMove, nodeLi) {
	tabaga.stopEventPropagation(e);
	tabaga.popupMaster.closeContext();
	
	var dragObject = new tabaga.DragObject(nodeLi.nodeSpan);
	dragObject.nodeLi = nodeLi;
	
	var onDragSuccessFn = dragObject.onDragSuccess;
	dragObject.onDragSuccess = function(dropTarget) {
		// call super
		onDragSuccessFn.apply(this, arguments);	
		// copy ...
		var answer = confirm("Copy/Move page '" + nodeLi.nodeModel.title + "'?")
		if (!answer) {
		    //console.log("No Copy page");
		    return;
		}
		
		//console.log("Copy: DropTarget: " + dropTarget + " accept DragObject: " + this
			//	+ " state: " + dropTarget.state);
		
		megion.showLoadingStatus(true);
		var srcId = this.nodeLi.nodeModel.id;
		var destId = dropTarget.nodeLi.nodeModel.id;
		//console.log("srcId: " + srcId + ", destId: " + destId);
		var targetTreeControl = dropTarget.nodeLi.treeControl;
		var actionUrl;
	    if (dropTarget.state==tabaga.DropTarget.INTO) {
	    	actionUrl = "pages/" + copyMove + "To";
	    } else if (dropTarget.state==tabaga.DropTarget.OVER) {
	    	actionUrl = "pages/" + copyMove + "Over";
	    } else if (dropTarget.state==tabaga.DropTarget.UNDER) {
	    	actionUrl = "pages/" + copyMove + "Under";
	    } else {
	    	console.log("dropTarget.state " + dropTarget.state + " not supported");
	    	return;
	    }
	    var sendData = {
			"srcId" : srcId,
			"destId" : destId
		};
	    if (targetTreeControl.currentSelectedNodeEl) {
	    	sendData.selectedId = targetTreeControl.currentSelectedNodeEl.nodeModel.id;
	    }
		$.ajax({
			url : actionUrl,
			type: "POST",
			dataType : "json",
			data : sendData,
			success : function(data) {
				targetTreeControl.updateRootNodes(data.treeScopeNodes, true);
				megion.showLoadingStatus(false);
			},
			error: function (request, status, error) {
				megion.showLoadingStatus(false);
				console.error("Error status: " + status + " text: "+ request.responseText)
		    }
		});
	}
	
	var onDragFailFn = dragObject.onDragFail;
	dragObject.onDragFail = function() {
		// call super
		onDragFailFn.apply(this, arguments);
		window.disableClickOnTreeNode = false;
	}
	
	tabaga.dragMaster.emulateDragStart(nodeLi.nodeSpan, {x: 0, y: -15});
	window.disableClickOnTreeNode = true;
	return false;
}

//переопределим tabaga.PopupMenu
function PageNodeContextMenu() {
	tabaga.PopupMenu.apply(this, arguments);
}

PageNodeContextMenu.prototype = Object.create(tabaga.PopupMenu.prototype);
PageNodeContextMenu.prototype.onRemove = function(containerMenu) {
	var nodeLi = this.element;
	var nodeSpan = nodeLi.nodeSpan;
	tabaga.removeClass(nodeSpan, pagetree.TREE_NODE_CONTEXT_OPENED);
}
PageNodeContextMenu.prototype.onCreate = function(containerMenu) {
	var nodeLi = this.element;
	var treeControl = nodeLi.treeControl;
	//treeControl.setSelectionTreeNode(nodeLi);
	var nodeSpan = nodeLi.nodeSpan;
	tabaga.addClass(nodeSpan, pagetree.TREE_NODE_CONTEXT_OPENED);

	var ulContainer = megion.createSimpleTextContextMenu([ {
		title : "Delete",
		onclick : function(e) {
			tabaga.stopEventPropagation(e);
			tabaga.popupMaster.closeContext();
			
			var answer = confirm("Delete page '" + nodeLi.nodeModel.title + "'?")
			if (!answer) {
			    console.log("No Delete page");
			    return;
			}
			
			megion.showLoadingStatus(true);
			var sendData = {
				"id" : nodeLi.nodeModel.id
			};
			if (treeControl.currentSelectedNodeEl) {
			    sendData.selectedId = treeControl.currentSelectedNodeEl.nodeModel.id;
			}
			$.ajax({
				url : "pages/removeNode",
				type: "POST",
				dataType : "json",
				data : sendData,
				success : function(data) {
					treeControl.updateRootNodes(data.treeScopeNodes, true);
					megion.showLoadingStatus(false);
				},
				error: function (request, status, error) {
					megion.showLoadingStatus(false);
					console.error("Error status: " + status + " text: "+ request.responseText)
			    }
			});
		}
	}, {
		title : "Move",
		onclick : function(e) {
			onClickCopyMove(e, 'move', nodeLi);
			return false;
		}
	}, {
		title : "Copy",
		onclick : function(e) {
			onClickCopyMove(e, 'copy', nodeLi);
			return false;
		}
	}, {
		title : "Change",
		onclick : function(e) {
			tabaga.stopEventPropagation(e);
			tabaga.popupMaster.closeContext();
			
			tabaga.modalMaster.openModal(createPageModalCreator,
					{title: "Change page", page: nodeLi.nodeModel, treeControl: nodeLi.treeControl, create: false});
			return false;
		}
	}, {
		title : "Create new",
		onclick : function(e) {
			tabaga.stopEventPropagation(e);
			tabaga.popupMaster.closeContext();
			
			tabaga.modalMaster.openModal(createPageModalCreator,
					{title: "Create new page", page: {}, treeControl: nodeLi.treeControl, parentId: nodeLi.nodeModel.id, create: true});
			return false;
		}
	} ]);
	containerMenu.appendChild(ulContainer);
};

//переопределим tabaga.PopupMenu
function PageTreeContextMenu() {
	tabaga.PopupMenu.apply(this, arguments);
}

PageTreeContextMenu.prototype = Object.create(tabaga.PopupMenu.prototype);
PageTreeContextMenu.prototype.onRemove = function(containerMenu) {
	var treeUl = this.element;
	tabaga.removeClass(treeUl, pagetree.TREE_CONTEXT_OPENED);
}
PageTreeContextMenu.prototype.onCreate = function(containerMenu) {
	var treeUl = this.element;
	tabaga.addClass(treeUl, pagetree.TREE_CONTEXT_OPENED);
	
	var ulContainer = megion.createSimpleTextContextMenu([ {
		title : "Create new root",
		onclick : function(e) {
			tabaga.stopEventPropagation(e);
			tabaga.popupMaster.closeContext();
			
			tabaga.modalMaster.openModal(createPageModalCreator,
					{title: "Create new root page", page: {}, treeControl: treeUl.treeControl, create: true});
			return false;
		}
	} ]);
	containerMenu.appendChild(ulContainer);
}

