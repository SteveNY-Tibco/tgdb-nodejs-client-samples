//Class definition
function Graph(name) {
	this.name  = name;
    this.nodes = [];
    this.edges = [];

    this.createNodeMap = function(callback) {
    	var map = {};
    	var node = null;
    	for(var index in this.nodes) {
    		node = this.nodes[index];
    		map[node._id] = node;
    	}
		return map;
    };
}

function Node(id) {
	this._id           = id;
	this.isRef         = true;
	this.isDeleted     = false;
	this.updateDB      = true;
    this.attributes    = {};
    this.edges         = [];
}

function Edge(id, fromNodeId, toNodeId, edgeType, directionType) {
	this._id           = id;
	this.isRef         = true;
	this.isDeleted     = false;
	this.updateDB      = true;
    this.attributes    = {};
    this.from          = fromNodeId;
    this.to            = toNodeId;
    this.directionType = directionType;
}