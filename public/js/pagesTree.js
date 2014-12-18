var pagetree = {
	TREE_NODE_CONTEXT_OPENED: 'cm-opened'	
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

// переопределить TreeControl
function PageTreeControl() {
	tabaga.TreeControl.apply(this, arguments);
}
// переопределим tabaga.PopupMenu
function PageNodeContextMenu() {
	tabaga.PopupMenu.apply(this, arguments);
}

function onClickCopyMove(e, copyMove, nodeLi) {
	tabaga.stopEventPropagation(e);
	tabaga.popupMaster.closeContext();
	
	var dragObject = new tabaga.DragObject(nodeLi.nodeSpan);
	dragObject.nodeLi = nodeLi;
	//dragObject.setScrollManager(new tabaga.DragScrollManager(
	//jQuery("#parentTreePages")[0]));
	
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
	    if (targetTreeControl.currentSelectedNodeLi) {
	    	sendData.selectedId = targetTreeControl.currentSelectedNodeLi.nodeModel.id;
	    }
		$.ajax({
			url : actionUrl,
			type: "POST",
			dataType : "json",
			data : sendData,
			success : function(data) {
				targetTreeControl.updateExistUlNodesContainer(targetTreeControl.treeUl,
						data.treeScopeNodes, true);
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
			if (treeControl.currentSelectedNodeLi) {
			    sendData.selectedId = treeControl.currentSelectedNodeLi.nodeModel.id;
			}
			$.ajax({
				url : "pages/removeNode",
				type: "POST",
				dataType : "json",
				data : sendData,
				success : function(data) {
					treeControl.updateExistUlNodesContainer(treeControl.treeUl,
							data.treeScopeNodes, true);
					
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
	} ]);
	containerMenu.appendChild(ulContainer);
};

PageTreeControl.prototype = Object.create(tabaga.TreeControl.prototype);

PageTreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newNodeLi = tabaga.TreeControl.prototype.appendNewNode.apply(this,
			arguments);
	//newNodeLi.nodeSpan.innerHTML = newNodeLi.nodeSpan.innerHTML + " order "+ newNodeLi.nodeModel.order;

	tabaga.popupMaster.makeContextable(newNodeLi);
	var menu = new PageNodeContextMenu(newNodeLi/*, jQuery("#parentTreePages")[0]*/);

	newNodeLi.onclick = function(event) {
		tabaga.stopEventPropagation(event);
		if (window.disableClickOnTreeNode) {
			window.disableClickOnTreeNode = false;
			return false;
		} else {
		    // call default onclick
		    return tabaga.TreeControl.onClickTreeNode.apply(this, arguments);
		}
	}

	var dropTarget = new PageDropTarget(newNodeLi.nodeSpan);
	dropTarget.nodeLi = newNodeLi;
	return newNodeLi;
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
			self.updateExistUlNodesContainer(self.treeUl,
					loadedData, updateCloseState);
			// find Li by node Id. Before update nodeModel may be null.
			var nodeModel = self.allNodesMap[nodeId];
			var nodeLi = nodeModel.nodeLi
			
			self.openNode(nodeLi, setClosed);
			megion.showLoadingStatus(false);
		},
		error: function (request, status, error) {
			megion.showLoadingStatus(false);
			console.error("Error status: " + status + " text: "+ request.responseText)
	    }
	});
};
