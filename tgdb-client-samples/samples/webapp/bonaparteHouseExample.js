"use strict;"

var lineBreak = '\r\n';
var LENGTH_MAIN = 350,
LENGTH_SERVER = 150,
LENGTH_SUB = 50,
WIDTH_SCALE = 10,
FONT = '60px verdana black',
GREEN = 'green',
RED = '#C5000B',
ORANGE = 'orange',
DARKRED = 'darkred',
DARKORANGE = 'darkorange',
GODENROD = 'goldenrod',
DARKGREEN = 'darkgreen',
TEAL = 'teal',
DARKBLUE = 'darkblue',
VIOLET = 'violet',
PINK = 'pink',
GRAY = 'gray',
BLACK = '#2B1B17';

function edgeColor(relType) {
	var color = BLACK;
	var opacity = 1.0;
    if (relType==='spouse') {
		color = DARKRED;
	} else if (relType==='child') {
		color = DARKGREEN;
	}
	
	return {color:color, opacity:opacity};
}

function getAttributes(entity) {
	var attrString = '';
	for(var key in entity) {
		if(key!=='label' && 
		   key!=='title' && 
		   key!=='color'){
			attrString += key + ' : ' + entity[key] + lineBreak;
		}
	}
	return attrString;
}

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
}

var properties = {
		fetchsize:100, 
		traversaldepth:4,
		edgelimit:3
	};

function search(http, serviceURL, memberName, traversaldepth, callback) {
	http.get(serviceURL + '/rest/api/tgdb/load', {
		params:{
			'types': "['houseMemberType']",
			'keys' : "[{'name' : 'memberName', 'value' : "+memberName+"}]",
			'properties' : "{'fetchsize':500, 'traversaldepth':"+traversaldepth+",'edgelimit':8}"
		}
	}).success(function onSuccess(response){
		console.log(response);
		callback(angular.fromJson(response).houseMemberType);
	}).error(function onError(){
    	console.log("AJAX failed!");
    });
}

function query(http, serviceURL, queryString, traversaldepth, callback) {
	http.get(serviceURL + '/rest/api/tgdb/query', {
		params:{
			'type': 'houseMemberType',
			'queryString' : queryString,
			'properties' : "{'fetchsize':500, 'traversaldepth':"+traversaldepth+",'edgelimit':8}"
		}
	}).success(function onSuccess(response){
		callback(angular.fromJson(response).houseMemberType);
	}).error(function onError(){
    	console.log("AJAX failed!");
    });
}

function House(ctrl, window, containerId) {
	var me = this;
    this.network = null;
	this.container = window.document.getElementById(containerId);

	this.data = {
		nodes : new window.vis.DataSet(),
		edges : new window.vis.DataSet()
    };
	
    this.buildOptions = function(hierarchical){
    	var options = {
    		interaction: {hover:true},
    	    layout: {
    	        hierarchical: {
    	            sortMethod: 'directed'
    	        }
    	    },
    	    edges: {
    	    	smooth: true,
    	    	arrows: {to : true },
    	    	font: {
    	    		strokeWidth: 6,
    	    	},
    	    	width: 3
    	    }
    	};
    	
    	if(!hierarchical) {
    		delete options.layout;
    	}
    	
    	return options;
    };
	
	this.buildNetwork = function (graph, hierarchical) {	
		if(!graph) {
			console.log('No data comes back ...');
			return;
		}
		
		if(this.network) {
			this.data.nodes.clear();
			this.data.edges.clear();
			this.network.destroy();
		}

		var nodes = this.data.nodes;
   		var edges = this.data.edges;
   		
   		if(graph) {
   	   		var i;
   	   		var node = null;
   	   		graph.nodes.forEach(function(aNode) {
   	   	   		node = {};
   	   			node.id = aNode.id;
   	   			//console.log('-------> node : ' + node.id);
   	   			node.label = aNode.attributes.memberName;
   	   			node.title = aNode.attributes.memberName;
   	   			Object.keys(aNode.attributes).forEach(function(key) {
   	   				node[key] = aNode.attributes[key];
   	   			});
   	   			nodes.add(node);
   	   		});

   	   		var edge = null;
   	   		graph.edges.forEach(function(anEdge) {
   	   			edge = {};
   	   			edge.id = anEdge.id;
   	   			//console.log('-------> edge : ' + edge.id);
   	   			edge.from = anEdge.from;
   	   			edge.to = anEdge.to;
   	   			Object.keys(anEdge.attributes).forEach(function(key) {
   	   				edge[key] = anEdge.attributes[key];
   	   			});
   	   			edge.color = edgeColor(edge.relType);
   	   			edge.title = edge.relType;
   	   	   		edges.add(edge);
   	   		});
   		}
    	
		console.log('Rebuild house network.');
	    this.network = new window.vis.Network(this.container, this.data, this.buildOptions(hierarchical));
    	
    	/*-- This is for modify on click, begin --*/
    	this.network.on("click", function (params) {    		
			var attrString = '';
   			var selectedEntity = null;
    		if (params.nodes.length === 1) {
    			selectedEntity = nodes.get(params.nodes[0]);
        		if(ctrl.isActive(1)) {
        	    	window.document.getElementById('member-name').value=selectedEntity.memberName;
        		}
    		} else if(params.edges.length === 1) {
    			selectedEntity = edges.get(params.edges[0]);
    		} else {
    			return;
    		}
    			
			attrString = getAttributes(selectedEntity);
    		if(ctrl.isActive(1)) {
    			window.document.getElementById('search-entity-attributes').value=attrString;
	    	} else if(ctrl.isActive(2)) {
    			window.document.getElementById('query-entity-attributes').value=attrString;
	    	}
    	});
    	/*-- This is for modify on click, end --*/
        this.network.on("hoverNode", function (params) {
            //console.log('hoverNode Event:', params);
        });
        this.network.on("hoverEdge", function (params) {
            //console.log('hoverEdge Event:', params);
        });
	};
}

app.controller('BonaparteHouseController', function($location, $scope, $window, $http) {
	console.log('Initialized : BonaparteHouseController');
	var ctrl = this;
    var serviceURL = 'http://' + $location.host() + ':' + $location.port();
    
	this.activeTab = 1;
	this.currentEntityKey = 1;
	this.queryString = "@nodetype = 'houseMemberType' and yearBorn > 1700 and yearBorn < 1900;";

	this.house = new House(this, $window, 'network');

    /* ------- Initialize network begin -------- */
	
	search($http, serviceURL, 'Napoleon Bonaparte', 2, function(graph) {
		ctrl.house.buildNetwork(graph, true);
	});

    /* ------- Initialize network done -------- */
	
	this.selectTab = function(selectedTab) {
		this.activeTab = selectedTab;	
		var queryString = $window.document.getElementById('query-expr').value;
		if(this.activeTab===2) {
			if(!queryString||queryString==='') {
				$window.document.getElementById('query-expr').value = this.queryString;
			}
		}
		this.queryString = $window.document.getElementById('query-expr').value;
	};

	this.isActive = function(targetTab) {
		return this.activeTab === targetTab;
	};
	
    this.submitSearch = function() {
    	var ctr = this;
    	var name = $window.document.getElementById('member-name').value;
    	search($http, serviceURL, name, 2, function(graph) {
			ctr.house.buildNetwork(graph, true);
    	});
    };
    
    this.submitQuery = function() {
    	var ctr = this;
    	var queryExpr = $window.document.getElementById('query-expr').value;
    	query($http, serviceURL, queryExpr, 2, function(graph) {
			ctr.house.buildNetwork(graph, false);
    	});
    };
});
