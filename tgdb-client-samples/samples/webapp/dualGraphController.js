"use strict;"
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

function edgeColorMapping(infscore) {
	var color = BLACK;
	var opacity = 1.0;
	
	console.log("----------->" + infscore);
	
	if(infscore<0.1) {
		color = DARKRED;
	} else if(infscore<0.2) {
		color = DARKORANGE;
	} else if (infscore<0.3) {
		color = GODENROD;
	} else if (infscore<0.4) {
		color = DARKGREEN;
	} else if (infscore<0.5) {
		color = TEAL;
	} else if (infscore<0.6) {
		color = DARKBLUE;
	} else if (infscore<0.7) {
		color = VIOLET;
	} else if (infscore<0.8) {
		color = PINK;
	} else if (infscore<0.9) {
		color = GRAY;
	}
	
	return {color:color, opacity:opacity};
}

function populateVisData (selected, graphData, data) {
	console.log(data);
	console.log(graphData);
	var i;
   	var node = null;
   	if(graphData&&graphData.nodes) {
   		var nodeMap = {};
   	   	for(i=0; i<graphData.nodes.length; i++) {
    	   	node = {};
   	   		node.id = graphData.nodes[i].attributes.symbol;//_id;
   	   		node.label = graphData.nodes[i].attributes.symbol;
   	   		node.font = FONT;
   	   		nodeMap[graphData.nodes[i].id] = node.id;
   	   			
   	   		node.group = (selected.toUpperCase()===graphData.nodes[i].attributes.symbol.toUpperCase())?'main':'other01';
   	   		for(var key in graphData.nodes[i].attributes) {
   	   			node[key] = graphData.nodes[i].attributes[key];
   	   		}
   	   		data.nodes.add(node);
   	   	}
   	}

   	var edge = null;
   	if(graphData&&graphData.edges) {
   	   	for(i=0; i<graphData.edges.length; i++) {
   	   		edge = {};
   	   		edge.id = graphData.edges[i].id;
  	   		console.log('----> node ' + edge.id);
  	   		edge.from = nodeMap[graphData.edges[i].from];
   	   		edge.to = nodeMap[graphData.edges[i].to];
   	   		edge.width = WIDTH_SCALE;
   	   		edge.length = LENGTH_MAIN;
   	   		for(var key in graphData.edges[i].attributes) {
   	   			edge[key] = graphData.edges[i].attributes[key];
   	   			console.log("key : " + key + "value : " + graphData.edges[i].attributes[key]);
   	   		}
  	   		edge.color = edgeColorMapping(edge.infscore);
  	   		edge.title = edge.infscore;
  	   		console.log(edgeColor(edge.infscore));
   	   		data.edges.add(edge);
   	   	}
   	}
    return data;
}

var tgdbOptionESC = {
		fetchsize:100, 
		traversaldepth:3,
		edgelimit:3
	};

function fetchGenes(http, serviceURL, symbol, callback) {
	http.get(serviceURL + '/rest/api/tgdb/load', {
		params:{
			'types': "['mESC', 'hESC']",
			'keys' : "[{'name' : 'symbol', 'value' : "+symbol+"}, {'name' : 'symbol', 'value' : "+symbol+"}]",
			'properties' : tgdbOptionESC
		}
	}).success(function onSuccess(response){
		console.log(response);
		callback(response);
	});
}

function rebuildAll (http, serviceURL, key, genes, callback) {
	fetchGenes(http, serviceURL, key, function(response){
		console.log("Updated select : " + key);
		console.log(response);
   		var graphs = angular.fromJson(response);
		console.log(graphs);
		console.log(graphs[genes[0].name]);
   		genes[0].buildNetwork(graphs[genes[0].name], http, serviceURL, key, genes[1]);
   		genes[1].buildNetwork(graphs[genes[1].name], http, serviceURL, key, genes[0]);
   		if(callback) {
   			callback(key);
   		}
	});
}

app.controller('DualGraphController', function($location, $scope, $window, $http) {
	//console.log('Initialized : DualGraphController');
	var ctrl = this;
	this.selectedGeneSymbol = 'CD86';
	this.selectedGeneId = 'CD86';
	this.selectedDegreesofSeparation = 4;
	this.humanGenes = null;
	this.mouseGenes = null;
	this.initialized = false;
	
    var serviceURL = 'http://' + $location.host() + ':' + $location.port();

	this.mouseGenes = new NetWork('mESC', $window, 'mouseGenesGraph');
	this.mouseGenes.disableEvent();
	this.humanGenes = new NetWork('hESC', $window, 'humanGenesGraph');
	rebuildAll (
		$http, serviceURL, this.selectedGeneSymbol, [this.humanGenes, this.mouseGenes], function(newSelectedGeneSymbol){
		$scope.humanGenes = ctrl.humanGenes.getNodes();
		//console.log('new symbol ->' + newSelectedGeneSymbol);
		//$window.document.getElementById('human-gene-select').selectedIndex = newSelectedGeneSymbol;
		$window.document.getElementById('degrees-of-separation-select').selectedIndex = tgdbOptionESC.traversaldepth;
		this.initialized = true;
	}) ;
	
    this.selectHumanGene = function() {
		var symbol = $window.document.getElementById('human-gene-select').value;
		if(!symbol) {
			console.log('Selected symbol is null : symbol = ' + symbol);
			return;
		}
		this.selectedGeneSymbol = symbol; 
		rebuildAll ($http, serviceURL, this.selectedGeneSymbol, [this.humanGenes, this.mouseGenes], function(newSelectedGeneSymbol){
			//$window.document.getElementById('human-gene-select').selectedIndex = newSelectedGeneSymbol;			
		}) ;
    };
    
    this.selectDegreesofSeparation = function() {
		//this.selectedGeneSymbol = $window.document.getElementById('human-gene-select').value;
    	tgdbOptionESC.traversaldepth = $window.document.getElementById('degrees-of-separation-select').value;
		rebuildAll ($http, serviceURL, this.selectedGeneSymbol, [this.humanGenes, this.mouseGenes], function() {
			//console.log('Im here ............ ');
		}) ;
    };
});

function NetWork(name, window, containerId){
	var me = this;
	this.name = name;
    this.network = null;
    this.eventDisabled = false;
	this.container = window.document.getElementById(containerId);
	
	this.data = {
		nodes : new window.vis.DataSet(),
		edges : new window.vis.DataSet()
	};

	this.options = {
		autoResize: false,
		height: '500',
		width: '100%',
		nodes: {scaling:{min: 16, max: 32}},
        edges: {color: GRAY, smooth: false},
        physics:{
        	barnesHut:{gravitationalConstant:-30000},
        	stabilization: {iterations:2500}
        },
        groups: {
        	main    : {shape: 'triangle', color: '#FF9900' /*orange*/},
        	other01 : {shape: 'dot', color: "#2B7CE9" /*blue*/},
        	other02 : {shape: 'dot', color: "#5A1E5C" /*purple*/},
        	other03 : {shape: 'square', color: "#C5000B" /*red*/},
        	other04 : {shape: 'square', color: "#109618" /*green*/}
        }
	};
	
	this.disableEvent = function () {
		 this.eventDisabled = true;
	};
	
	this.getNodes = function () {
		return this.data.nodes.get();
	};
	
	this.getNode = function (id) {
		return this.data.nodes.get(id);
	};
	
	this.buildNetwork = function (graph, http, serviceURL, selectedGeneSymbol, peer) {
		console.log(graph);
		if(!graph) {
			console.log('No data comes back ...');
			return;
		}
		
		if(this.network) {
			this.data.nodes.clear();
			this.data.edges.clear();
			this.network.destroy();
		}
		
		populateVisData(
			selectedGeneSymbol, 
    		graph, 
    		this.data
		);
		
		console.log('Rebuild network : ' + this.name);
	    this.network = new window.vis.Network(this.container, this.data, this.options);
	    
		this.network.on("click", function (params) {
			if(this.eventDisabled) {
				console.log('Event disabled ...');
				return;
			}
	        if(params.nodes.length>1) {
				console.log('Click on edge ..... ');
	        	return;
	        }
	        var symbol = params.nodes[0];
	        //var symbol = me.getNode(params.nodes[0]).symbol;
	        if(!symbol) {
	        	console.log('Selected symbol is null ...');
	        	return;
	        }
	        
			rebuildAll (http, serviceURL, symbol, [me, peer], function(){
				console.log('in on click ......:'+symbol);
				window.document.getElementById('human-gene-select').selectedIndex = symbol;
				window.document.getElementById('human-gene-select').value = symbol;
				//window.document.getElementById('degrees-of-separation-select').selectedIndex = tgdbOptionESC.traversaldepth;
			}) ;
		});
	};
}