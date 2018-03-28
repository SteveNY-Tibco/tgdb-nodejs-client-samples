exports.printg = function(graph) {
	var node = null;
	for(var i=0; i<graph.nodes.length; i++) {
		Object.keys(graph.nodes[i].attributes).forEach(function(key) {
			//console.log('Node : ' + i + 'key : ' + key + ', value : ' + graph.nodes[i].attributes[key]);
		});
	}

	var edge = null;
	for(var i=0; i<graph.edges.length; i++) {
		Object.keys(graph.edges[i].attributes).forEach(function(key) {
			//console.log('edge : ' + i + 'key : ' + key + ', value : ' + graph.edges[i].attributes[key]);
		});	
	}
};
