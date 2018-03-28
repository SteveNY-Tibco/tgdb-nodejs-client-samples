"use strict;"

var lineBreak = '\r\n';

app.controller('GraphController', function($location, $scope, $window, $http) {
	//console.log('Initialized : GraphController');
	var ctrl = this;

	this.activeTab = 1;
	this.currentMode = 0;
	this.currentEntityKey = 1;

	this.fromNode = null;
	this.toNode = null;

	this.selectTab = function(selectedTab) {
		this.activeTab = selectedTab;
		if(this.currentMode===1&&this.activeTab!==3) {
			this.selectMode(1);
		}
   		$scope.availableNodes = ctrl.nodes.get();
	};

	this.isActive = function(targetTab) {
		return this.activeTab === targetTab;
	};

	this.selectMode = function(selectedMode) {
		this.currentMode = selectedMode;
		$scope.availableNodes = ctrl.nodes.get();
		$scope.availableEdges = ctrl.edges.get();
		$window.document.getElementById("node-attributes").value = '';
		$window.document.getElementById("edge-attributes").value = '';
		//console.log('Current Mode : ' + this.currentMode);
	};

	this.isCurrentMode = function(targetMode) {
		return (this.currentMode === targetMode);
	};

	this.submit = function() {
		//console.log('Submit get called : ');
	};

	this.selectEntity = function(entityType) {
		this.currentEntityKey = $window.document.getElementById(entityType + "-select").value;
		//console.log(entityType + ' ---- ' + this.currentEntityKey);
		$window.document.getElementById(entityType + "-key").value = this.currentEntityKey;
		$window.document.getElementById(entityType + "-attributes").value = this.getAttributes(entityType);
		if(entityType==='edge') {
			$window.document.getElementById('from-node-name').value = ctrl.nodes.get(ctrl.edges.get(this.currentEntityKey).from).label;
			$window.document.getElementById('to-node-name').value = ctrl.nodes.get(ctrl.edges.get(this.currentEntityKey).to).label;
		}
	};

	this.getAttributes = function(entityType) {
		var attrString = '';
    	var entity = null;
    	if(entityType==='node') {
        	entity = ctrl.nodes.get(this.currentEntityKey);
    	} else {
        	entity = ctrl.edges.get(this.currentEntityKey);    		
    	}
    	for(var key in entity) {
    		
    		if(key!=='id' && key!=='from' && key!=='to'){
    			attrString += key + ' : ' + entity[key] + lineBreak;
    		}
    	}
    	return attrString;
	};
	
	this.loadSampleScript = function () {
		$window.document.getElementById("script-editor").value = defaultScript;
	};
	
    /* ------- Initialize network begin -------- */
	this.graphData = {};
	this.nodes = new $window.vis.DataSet();
	this.edges = new $window.vis.DataSet();
    var container = $window.document.getElementById('network');
    var serviceURL = 'http://' + $location.host() + ':' + $location.port();
    
    $http.get(serviceURL + '/graph/load', {
    		params:{
    			'types[]': ['testnode'], 
    		    'keys[]': [{'name' : 'name', 'value' : 'john doe'}],
    			'properties' : {
   				 	"fetchsize":500, 
   				 	"traversaldepth":5,
   				 	"edgelimit":8
    			}
    		}
    }).success(function onSuccess(response){
   		//console.log(response);
   		
   		if(response) {
   	   		ctrl.graphData = angular.fromJson(response).testnode;
   		}
   		
   		if(ctrl.graphData) {
   	   		var i;
   	   		var node = null;
   	   		for(i=0; i<ctrl.graphData.nodes.length; i++) {
   	   	   		node = {};
   	   			node.id = ctrl.graphData.nodes[i]._id;
   	   			node.label = ctrl.graphData.nodes[i].attributes.name;
   	   			for(var key in ctrl.graphData.nodes[i].attributes) {
   	   				if(key!=='name') {
   	   					node[key] = ctrl.graphData.nodes[i].attributes[key];
   	   				}
   	   			}
   	   			ctrl.nodes.add(node);
   	   		}

   	   		var edge = null;
   	   		for(i=0; i<ctrl.graphData.edges.length; i++) {
   	   			edge = {};
   	   			edge.id = ctrl.graphData.edges[i]._id;
   	   			edge.label = ctrl.graphData.edges[i].attributes.name;
   	   			edge.from = ctrl.graphData.edges[i].from;
   	   			edge.to = ctrl.graphData.edges[i].to;
   	   			for(var key in ctrl.graphData.edges[i].attributes) {
   	   				edge[key] = ctrl.graphData.edges[i].attributes[key];
   	   			}
   	   	   		ctrl.edges.add(edge);
   	   		}

/*
   	   		ctrl.graphData.nodes.forEach(function(node) {
   	   	   		node = {};
   	   			node.id = node._id;
   	   			node.label = node.attributes.name;
   	   			Object.keys(node.attributes).forEach(function(key) {
   	   				if(key!=='name') {
   	   					node[key] = node.attributes[key];
   	   				}
   	   			});
   	   			ctrl.nodes.add(node);
   	   		});

   	   		var edge = null;
   	   		ctrl.graphData.edges.forEach(function(edge) {
   	   			edge = {};
   	   			edge.id = edge._id;
   	   			edge.from = edge.from;
   	   			edge.to = edge.to;
   	   			Object.keys(edge.attributes).forEah(function(key) {
   	   				edge[key] = edge.attributes[key];
   	   			});
   	   	   		ctrl.edges.add(edge);
   	   		});
*/

   		}

		$scope.availableNodes = ctrl.nodes.get();
		$scope.availableEdges = ctrl.edges.get();

    	var data = {
    		nodes: ctrl.nodes,
    		edges: ctrl.edges
    	};
    	var options = {
			nodes: {
				borderWidth: 3
			},
    		edges: {
    			font: {
    				strokeWidth: 6,
    			},
    			width: 3
    		}
    	};
    	ctrl.network = new $window.vis.Network(container, data, options);
    	
    	/*-- This is for modify on click, begin --*/
    	ctrl.network.on("click", function (params) {
    		if (params.nodes.length == 1 && document.getElementById('node-select') != null) {
    			var selectedNodeId = params.nodes[0];
    			var selectedNode = ctrl.nodes.get(selectedNodeId);
    			var attrString = '';
    			document.getElementById('node-select').value=selectedNodeId;
    			document.getElementById('node-key').value=selectedNodeId;
    	    	for(var key in selectedNode) {
    	    		if(key!=='id'){
    	    			attrString += key + ' : ' + selectedNode[key] + lineBreak;
    	    		}
    	    	}
    			document.getElementById('node-attributes').value=attrString;
    		}
    		else if (params.edges.length == 1 && document.getElementById('edge-select') != null) {
    			var selectedEdgeId = params.edges[0];
    			var selectedEdge = ctrl.edges.get(selectedEdgeId);
    			var attrString = '';
    			document.getElementById('edge-select').value=selectedEdgeId;
    			document.getElementById('edge-key').value=selectedEdgeId;
    			document.getElementById('from-node-name').value = ctrl.nodes.get(selectedEdge.from).label;
    	    	document.getElementById('to-node-name').value = ctrl.nodes.get(selectedEdge.to).label;
    	    	for(var key in selectedEdge) {
    	    		if(key!=='id' && key!=='from' && key!=='to'){
    	    			attrString += key + ' : ' + selectedEdge[key] + lineBreak;
    	    		}
    	    	}
    			document.getElementById('edge-attributes').value=attrString;
    		}
    	});
    	/*-- This is for modify on click, end --*/
    	
/*    	ctrl.network.on("doubleClick", function (params) {
            params.event = "[original event]";
            var graphDelta = new Graph();
            var targetNodeIds = params.nodes;
            var isNodeOnClick = (1===targetNodeIds.length);
            var targetNode = null;
            var nodeRefMap = {};
            for(var i in targetNodeIds) {
            	targetNode = new Node(targetNodeIds[i]);
            	if(!isNodeOnClick) {
            		targetNode.updateDB =false;
            	}
            	nodeRefMap[targetNodeIds[i]] = targetNode;
            	printEntiry(targetNode);
            	graphDelta.nodes.push(targetNode);
            }

            var targetEdgeIds = params.edges;
            var targetEdge = null;
            for(var j in targetEdgeIds) {
            	targetEdge = new Edge(targetEdgeIds[j]);
            	var vedge = ctrl.edges.get(targetEdgeIds[j]);
            	var refNode = new Node(vedge.from);
            	if(!nodeRefMap[vedge.from]) {
            		refNode = new Node(vedge.from);
            		refNode.updateDB = false;
            		graphDelta.nodes.push(refNode);
            	}

            	if(!nodeRefMap[vedge.to]) {
            		refNode = new Node(vedge.to);
            		refNode.updateDB = false;
            		graphDelta.nodes.push(refNode);
            	}
               	
            	targetEdge.from = vedge.from;
            	targetEdge.to = vedge.to;
            	graphDelta.edges.push(targetEdge);
            }
        	ctrl.postData('/graph/delete', graphDelta, function(data){
                try {
                	var dbnodes = data.nodes;
                	for(var index in dbnodes) {
                		printEntiry(dbnodes[index]);
                		ctrl.nodes.remove({id:dbnodes[index]._id});
                	}
                	
                	var dbedges = data.edges;
                	for(var index in dbedges) {
                		printEntiry(dbedges[index]);
                		ctrl.edges.remove({id:dbedges[index]._id});
                	}
                }
                catch (err) {
                	$window.alert(err);
                }
        	});    
            console.log(params);
        });*/
    }).error(function onError(){
    	console.log("AJAX failed!");
    });
    /* ------- Initialize network done -------- */

    this.addNode = function() {
    	var graphDelta = new Graph();
    	var node = new Node((new Date).getTime());
    	node.attributes.label = $window.document.getElementById('node-name').value;
    	parseAttribute($window.document.getElementById('node-attributes').value, node);
    	
    	graphDelta.nodes.push(node);
    	this.postData('/graph/insert', graphDelta, function(data){
            ctrl.nodes.add(buildVsNode(data.nodes[0]));
    		$scope.availableNodes = ctrl.nodes.get();
    	});
    };

    /* CT: Delete Node function called for Delete button -- begin */
    this.deleteNode = function() {
        var graphDelta = new Graph();
        var isNodeOnClick = true;
        var nodeRefMap = {};
        var targetNodeId = $window.document.getElementById('node-select').value;
    	var targetNode = new Node(targetNodeId);
    	if(!isNodeOnClick) {
    		targetNode.updateDB =false;
    	}
    	nodeRefMap[targetNodeId] = targetNode;
    	printEntiry(targetNode);
    	graphDelta.nodes.push(targetNode);

        var targetEdgeIds = ctrl.edges.getIds();
        var targetEdge = null;
        for(var j in targetEdgeIds) {
        	var vedge = ctrl.edges.get(targetEdgeIds[j]);
        	if (vedge.from == targetNodeId || vedge.to == targetNodeId) {
	        	var refNode = new Node(vedge.from);
	        	if(!nodeRefMap[vedge.from]) {
	        		refNode = new Node(vedge.from);
	        		refNode.updateDB = false;
	        		graphDelta.nodes.push(refNode);
	        	}
	
	        	if(!nodeRefMap[vedge.to]) {
	        		refNode = new Node(vedge.to);
	        		refNode.updateDB = false;
	        		graphDelta.nodes.push(refNode);
	        	}
	           	
	        	targetEdge = new Edge(targetEdgeIds[j]);
	        	targetEdge.from = vedge.from;
	        	targetEdge.to = vedge.to;
	        	graphDelta.edges.push(targetEdge);
        	}
        }
    	ctrl.postData('/graph/delete', graphDelta, function(data){
            try {
            	var dbnodes = data.nodes;
            	for(var index in dbnodes) {
            		printEntiry(dbnodes[index]);
            		ctrl.nodes.remove({id:dbnodes[index]._id});
            	}
        		$scope.availableNodes = ctrl.nodes.get();

            	var dbedges = data.edges;
            	for(var index in dbedges) {
            		printEntiry(dbedges[index]);
            		ctrl.edges.remove({id:dbedges[index]._id});
            	}
            }
            catch (err) {
            	$window.alert(err);
            }
    	});
    }
    /* CT: Delete Node function called for Delete button -- end */
    
    this.updateNode = function() {
    	var graphDelta = new Graph();
    	var node = new Node($window.document.getElementById('node-key').value);
    	node.attributes.label = ctrl.nodes.get(node._id).label;
    	parseAttribute($window.document.getElementById('node-attributes').value, node);
    	printEntiry(node);
    	graphDelta.nodes.push(node);
    	this.postData('/graph/update', graphDelta, function(data){
        	printEntiry(data.nodes[0]);
            ctrl.nodes.update(buildVsNode(data.nodes[0]));
    	});
    };

    this.addEdge = function () {
    	var graphDelta = new Graph();
		var fromId = $window.document.getElementById('from-node-select').value;
		var toId = $window.document.getElementById('to-node-select').value;
    	
    	var vnode = ctrl.nodes.get(fromId);
    	var fromNode = new Node(fromId);
    	fromNode.updateDB = false;

    	for(var key in vnode) {
    		if(key!=='id') {
    			fromNode.attributes[key] = vnode[key];
    		}
    	}
    	
    	vnode = ctrl.nodes.get(toId);
    	var toNode = new Node(toId);
    	toNode.updateDB = false;
    	for(var key in vnode) {
    		if(key!=='id'){
    			toNode.attributes[key] = vnode[key];
    		}
    	}
    	
    	var edge = new Edge(
    		(new Date).getTime(),
    		fromNode._id,
    		toNode._id
    	);
    	fromNode.edges.push(edge._id);
    	toNode.edges.push(edge._id);
    	edge.attributes.label = $window.document.getElementById('edge-name').value;
    	parseAttribute($window.document.getElementById('edge-attributes').value, edge);
    	
    	graphDelta.nodes.push(fromNode);
    	graphDelta.nodes.push(toNode);
    	graphDelta.edges.push(edge);
    	this.postData('/graph/insert', graphDelta, function(data){
    		ctrl.edges.add(buildVsEdge(data.edges[0]));
    	});
    };
    
    /* CT: Delete Edge function called for Delete button */
    this.deleteEdge = function () {
        var graphDelta = new Graph();
        var targetNodeIds = null;
        var targetNode = null;
        var nodeRefMap = {};

        var targetEdge = null;
    	targetEdge = new Edge($window.document.getElementById('edge-select').value);
    	var vedge = ctrl.edges.get($window.document.getElementById('edge-select').value);
    	var refNode = new Node(vedge.from);
    	if(!nodeRefMap[vedge.from]) {
    		refNode = new Node(vedge.from);
    		refNode.updateDB = false;
    		graphDelta.nodes.push(refNode);
    	}

    	if(!nodeRefMap[vedge.to]) {
    		refNode = new Node(vedge.to);
    		refNode.updateDB = false;
    		graphDelta.nodes.push(refNode);
    	}
       	
    	targetEdge.from = vedge.from;
    	targetEdge.to = vedge.to;
    	graphDelta.edges.push(targetEdge);

    	ctrl.postData('/graph/delete', graphDelta, function(data){
            try {
            	var dbnodes = data.nodes;
            	for(var index in dbnodes) {
            		printEntiry(dbnodes[index]);
            		ctrl.nodes.remove({id:dbnodes[index]._id});
            	}
            	
            	var dbedges = data.edges;
            	for(var index in dbedges) {
            		printEntiry(dbedges[index]);
            		ctrl.edges.remove({id:dbedges[index]._id});
            	}
            }
            catch (err) {
            	$window.alert(err);
            }
    	});
    }
    /* CT: Delete Edge function called for Delete button -- end */
    
    this.updateEdge = function () {
    	var graphDelta = new Graph();

    	var edgeId = $window.document.getElementById('edge-key').value;
		var fromId = ctrl.edges.get(edgeId).from;
		var toId = ctrl.edges.get(edgeId).to;
    	
    	var vnode = ctrl.nodes.get(fromId);
    	var fromNode = new Node(fromId);
    	fromNode.updateDB = false;

    	for(var key in vnode) {
    		if(key!=='id') {
    			fromNode.attributes[key] = vnode[key];
    		}
    	}
    	
    	vnode = ctrl.nodes.get(toId);
    	var toNode = new Node(toId);
    	toNode.updateDB = false;
    	for(var key in vnode) {
    		if(key!=='id'){
    			toNode.attributes[key] = vnode[key];
    		}
    	}
    	
    	var edge = new Edge(
    		edgeId,
    		fromNode._id,
    		toNode._id
    	);
    	fromNode.edges.push(edge._id);
    	toNode.edges.push(edge._id);
    	edge.attributes.label = ctrl.edges.get(edge._id).label;
    	parseAttribute($window.document.getElementById('edge-attributes').value, edge);
    	
    	graphDelta.nodes.push(fromNode);
    	graphDelta.nodes.push(toNode);
    	graphDelta.edges.push(edge);
    	this.postData('/graph/update', graphDelta, function(data){
    		ctrl.edges.update(buildVsEdge(data.edges[0]));
    	});
    };
    
    this.executeScript = function () {
    	this.postData('/graph/execute/post', {script:$window.document.getElementById("script-editor").value}, function(data){
            try {
            	var graph = data.testnode;
            	var dbnodes = graph.nodes;
            	var vnodes = [];
            	for(var i in dbnodes) {
            		vnodes.push(buildVisNode(dbnodes[i], ctrl.nodes.get(dbnodes[i]._id)));
            	}
            	
            	var dbedges = graph.edges;
            	var vedges = [];
            	for(var i in dbedges) {
            		vedges.push(buildVisEdge(dbedges[i], ctrl.edges.get(dbedges[i]._id)));
            	}
            	
            	ctrl.nodes.update(vnodes); 
            	ctrl.edges.update(vedges); 
            }
            catch (err) {
            	//console.log(err.stack);
            	$window.alert(err);
            }
    	});
    };
    
    this.postData = function (uri, graphDelta, draw) {
        $http.post(serviceURL + uri, graphDelta)
        .success(function (data, status, headers, config) {
            draw(data);
        })
        .error(function (data, status, header, config) {
        	$window.alert('HTTP post fail, status : ' + status);
        });
    };
});

function parseAttribute(textInArea, entity) {
	var attribStrArray = null;
	var attrb = null;
	//console.log(textInArea);
	if(textInArea) {
		attribStrArray = textInArea.split('\n');
		for(var index in attribStrArray) {
	    	//console.log(attribStrArray[index]);
			attrb = attribStrArray[index].split(':');
			if(attrb.length===2) {
				entity.attributes[attrb[0].trim()] = attrb[1].trim();
    	    	//console.log(attrb[0].trim() + ' : ' + attrb[1].trim());
			}
		}
	}
	
	printEntiry(entity.attributes);
}

function buildVisNode(dbnode, vnode) {
	if(!vnode) {
		vnode = {};
	}
	Object.keys(vnode).forEach(function(key) {
		if(!dbnode.attributes[key]) {
			delete vnode[key];
		}
	});
	
	vnode.id = dbnode._id;
	vnode.key = dbnode._id;
	vnode.label = dbnode.attributes.name;

	Object.keys(dbnode.attributes).forEach(function(key) {
		vnode[key]=dbnode.attributes[key];
	});
	printEntiry(vnode);

	return vnode;
}

function buildVisEdge(dbedge, vedge) {
	if(!vedge) {
		vedge = {};
	}
	Object.keys(vedge).forEach(function(key) {
		if(key!=='from'&&key!=='to') {
			if(!dbedge.attributes[key]) {
				delete vedge[key];
			}
		}
	});
	
	vedge.id = dbedge._id;
	vedge.from = dbedge.from;
	vedge.to = dbedge.to;
	vedge.label = dbedge.attributes.name;
	Object.keys(dbedge.attributes).forEach(function(key) {
		vedge[key]=dbedge.attributes[key];
	});
	printEntiry(vedge);

	return vedge;
}

function printEntiry(entity) {
	console.log('********** An Entity **********');
	Object.keys(entity).forEach(function(key) {
		console.log(key + ' - ' + entity[key]);
	});
}

var defaultScript = 
' var gof = conn.getGraphObjectFactory();\r\n\r\n' +
' conn.getGraphMetadata(true, function(metadata) {\r\n\r\n' +   
'    console.log("Start transaction 1");\r\n' +
'    console.log("Create node1");\r\n' +
'\r\n'+
'    var testNodeType = metadata.getNodeType("testnode");\r\n'+
'\r\n' +
'    var node1 = gof.createNode(testNodeType);\r\n' +
'    node1.setAttribute("name", "john doe");\r\n' +
'    node1.setAttribute("multiple", 7);\r\n' +
'    node1.setAttribute("rate", 3.3);\r\n' +
'    node1.setAttribute("nickname", "超人");\r\n' +    
'    conn.insertEntity(node1);\r\n\r\n' +
'\r\n' +
'    console.log("Create node2");\r\n' +
'    var node2 = gof.createNode(testNodeType);\r\n' +
'    node2.setAttribute("name", "julie");\r\n' +
'    node2.setAttribute("factor", 3.3);\r\n' +
'    conn.insertEntity(node2);\r\n\r\n' +
'\r\n' +
'    console.log("Create node3");\r\n' +
'    var node3 = gof.createNode(testNodeType);\r\n' +
'    node3.setAttribute("name", "margo");\r\n' +
'    node3.setAttribute("factor", 2.3);\r\n' +
'    conn.insertEntity(node3);\r\n\r\n' +
'\r\n' +
'    console.log("Create edge1");\r\n' +
'    var edge1 = gof.createBidirectionalEdge(node1, node2);\r\n' +
'    edge1.setAttribute("name", "spouse");\r\n' +
'    conn.insertEntity(edge1);\r\n\r\n' +
'\r\n' +
'    console.log("Create edge2");\r\n' +
'    var edge2 = gof.createDirectedEdge(node1, node3);\r\n' +
'    edge2.setAttribute("name", "daughter");\r\n' +
'    conn.insertEntity(edge2);\r\n\r\n' +
'\r\n' +
'    console.log("Commit transaction 1");\r\n\r\n' +
'\r\n' +
'    conn.commit(function(changedEntities) {\r\n' +
'       toUI(changedEntities);\r\n' +
'       console.log("Callback done .......... ");\r\n' +
'    });\r\n\r\n' +
'});';