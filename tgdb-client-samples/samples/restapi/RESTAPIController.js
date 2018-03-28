        
var fs   = require('fs');
var tgdb = require('tgdb');
var dba  = require('../DBAccessor').getDBAccessor();

var connFactory = tgdb.TGConnectionFactory.getFactory();
var TGLogLevel  = tgdb.TGLogLevel;
var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

function RESTAPIController() {
	
}

RESTAPIController.prototype.getMetadata = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	dba.getMetadata(function(metedata){
		return res.json(metedata);
	});
};

RESTAPIController.prototype.getNode = function(req, res) {
	/*
	 * keys : [
	 *    {
	 *       entityType : "node",
	 *       type : "someType",
	 *       keyAttributes : { 
	 *          "attrName01" : "attrValue01",
	 *          "attrName02" : "attrValue02"
	 *       }
	 *    }
	 * ]
	 *
	 * */
	logger.logInfo('query = ' + req.query);	
	var type=req.params.node_type;
	console.log(req.params[0]);
	var keyValues=req.params[0].split("/");
	var keyAttributeNames = dba.getKeyAttributes(0, type);	
	var para = {
		keys : [
			{
				entityType : 0,
				type : type,
				keyAttributes : {}
			}
		]
	};
	
	for(var i=0; i<keyAttributeNames.length; i++) {
		para.keys[0].keyAttributes[keyAttributeNames[i]] = keyValues[i];
	}
	
	dba.getEntity(para, function(ent){
		var result={};
		var edgeArray=[];
		var nodeArray=[];
		var nodeList={};
		if (!!ent) {
			var nodeid=ent.getId().getHexString();
			logger.logInfo(" got entity "+ent.getEntityKind().name);
			var info=entityToJS(ent);
			nodeList[nodeid]=info;
			var curEdges = ent.getEdges();
			logger.logInfo(" has edges : "+curEdges.length);
			curEdges.forEach(function(edge) {
				var edgeinfo = {};
				edgeinfo=entityToJS(edge);
				var from=edge.getVertices()[0];
				var to=edge.getVertices()[1];
				// add from and to nodes to the node map if necessary
				if (from.getId().getHexString()!=nodeid) {
					nodeList[from.getId().getHexString()]=entityToJS(from);
				}
				if (to.getId().getHexString()!=nodeid) {
					nodeList[to.getId().getHexString()]=entityToJS(to);    
				} 
				edgeinfo.source=from.getId().getHexString();
				edgeinfo.target=to.getId().getHexString();
				edgeArray.push(edgeinfo);
			});
			for (n in nodeList) {
				nodeArray.push(nodeList[n]);
			}
			result["nodes"]=nodeArray;
			result["links"]=edgeArray;
			logger.logInfo(" got entity with attributes "+info);
		}
		return res.json(result);
	});
};

RESTAPIController.prototype.search = function(req, res) {
	logger.logInfo('query = ' + req.body);	

	var para = {
		"query" : req.body.query, //"@nodetype = 'airlineType' and iataCode = 'DL';",
		"traversalCondition" : req.body.traversalCondition,
		"endCondition" : req.body.endCondition,
		"traversalDepth" : "3"
	};
	dba.query(para, function(resultSet){
		var result=[];
		if(!!resultSet) {
			while (resultSet.hasNext()) {
				result.push(entityToJS(resultSet.next()));
			}
			res.json(result);
		} else {
			res.json(result);
		}
	});
};

RESTAPIController.prototype.close = function() {
	logger.logInfo("[RoutesController::close] Close dba !!!!!! ");
	if(null!=dba) {
		dba.close()
	}
};

RESTAPIController.prototype.services = function() {
	var services = [
		{ method : 'get', uri : '/tgdb/metedata', task : this.getMetadata },
		{ method : 'get', uri : '/tgdb/node/:node_type/*', task : this.getNode},
		{ method : 'post', uri : '/tgdb/search', task : this.search }
	];

	return services;
};

//entities returned by the graph DB services are not JSON friendly
//return a simplified object from an entity 
function entityToJS(ent) {
	var info={};
	info["id"]=ent.getId().getHexString();
	var attrArray=ent.getAttributes();
 	attrArray.forEach(function(attr) {
 		info[attr.getName()]=attr.getValue();
 	});
 	return info;
}

module.exports = RESTAPIController;
