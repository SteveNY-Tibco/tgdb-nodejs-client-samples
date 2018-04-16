/**
 * Copyright 2016 TIBCO Software Inc. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except 
 * in compliance with the License.
 * A copy of the License is included in the distribution package with this file.
 * You also may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
        
var fs   = require('fs');
var tgdb = require('tgdb');
var dba  = require('../DBAccessor').getDBAccessor();

var connFactory = tgdb.TGConnectionFactory.getFactory();
var TGLogLevel  = tgdb.TGLogLevel;
var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

function RESTAPIController() {
	
}

/**
 * 
 *  For metadata
 * 
 */

RESTAPIController.prototype.getNodeTypes = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	var result = { 
		message : 'OK!',
		nodeTypes : dba.getEntityTypes(0)
	};
	return res.json(result);
};

RESTAPIController.prototype.getEdgeTypes = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	var result = { 
		message : 'OK!',
		edgeTypes : dba.getEntityTypes(1)
	};
	return res.json(result);
};

RESTAPIController.prototype.getMetadata = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	dba.getMetadata(function(metedata){
		var result = { 
			message : 'OK!',
			metadata : metedata 
		};
		res.json(result);
	});
};

/**
 * 
 *  Insert/update
 * 
 */
RESTAPIController.prototype.upsertNode = function(req, res) {
	logger.logInfo('query = ' + req.body);
	var nodeTypeName = req.params.node_type;
	var result = {};
	try{
		dba.insertNode(nodeTypeName, req.body, function(node, exception){
			if(!!exception) {
				if(!(exception instanceof tgdb.TGTransactionUniqueConstraintViolationException)) {
					result.exception = exception;
				} else {
					dba.updateNode(nodeTypeName, req.body, function(node){
						result = { message : 'Node updated!'};
						result.node = entityToJS(node);
						logger.logInfo(result);
						res.send(result);	
					});
				}
			} else {
				result = { message : 'Node inserted!'};
				result.node = entityToJS(node);
				res.send(result);	
			}
		});
	} catch(exception) {
		result.exception = exception;
		res.send(result);
	}
};

RESTAPIController.prototype.deleteNode = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	var type=req.params.node_type;
	console.log(req.params[0]);
	
	var para = {
		"type" : type,
		"key" : {}
	};
	
	var keyValues=req.params[0].split("/");
	var keyAttributeNames = dba.getKeyAttributes(0, type);
	for(var i=0; i<keyAttributeNames.length; i++) {
		para.key[keyAttributeNames[i]] = keyValues[i];
	}
	
	var result = {};
	try {
		dba.deleteNode(para, function(node, exception) {
			if(!exception) {
				result = { message : 'Node deleted!'};
				result.node = entityToJS(node);	
			} else {
				result.exception = exception;	
			}
			res.send(result);	
		});
	} catch (exception) {
		result.exception = exception;
		res.send(result);
	}
};

/*
{
  "source": {
    "type": "houseMemberType",
    "memberName": "Raphael"
  },
  "target": {
    "type": "houseMemberType",
    "memberName": "Raphael3"
  },
  "properties" : {
    "relType": "RE1",
    "since": "now"
  }
    
}
*/

RESTAPIController.prototype.insertEdge = function(req, res) {
	logger.logInfo('query = ' + req.body);	
	var edgeTypeName=req.params.edge_type;
	
	var result = {};
	try {
		dba.insertEdge(edgeTypeName, req.body, function(edge, exception){
			if(!exception) {
				result = { message : 'Edge inserted!'};
				result.edge = entityToJS(edge);	
			} else {
				result.exception = exception;	
			}
			res.send(result);	
		});
	} catch (exception) {
		result.exception = exception;
		res.send(result);
	}
};

RESTAPIController.prototype.deleteEdge = function(req, res) {
	
	/* Not implemented yet!!!!!! */
	
	logger.logInfo('query = ' + req.body);	
	var edgeTypeName=req.params.edge_type;
	
	var result = {};
	try {
		dba.deleteEdge(edgeTypeName, req.body, function(edge, exception){
			var result = {};
			if(!exception) {
				result = { message : 'Edge deleted!'};
				result.edge = entityToJS(edge);	
			} else {
				result.exception = exception;	
			}
			res.send(result);
		});
	} catch (exception) {
		result.exception = exception;
		res.send(result);
	}
};

/**
 * 
 *  For unique id query
 * 
 */

/*
{
	"type" : "airportType",
	"key" : {}, 
	"properties" : {
		"name": "John F Kennedy International Airport",
		"iataCode": "JFKGGGGx",
		"country": "United States",
		"city": "New York",
		"icaoCode": "KJFKXXXy",
		"airportID": "AIRPORT99000000"
	}
}
*/

RESTAPIController.prototype.getNode = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	var type=req.params.node_type;
	console.log(req.params[0]);
	
	var para = {
		"type" : type,
		"key" : {}, 
		"properties" : {}
	};
	
	var keyValues=req.params[0].split("/");
	var keyAttributeNames = dba.getKeyAttributes(0, type);
	for(var i=0; i<keyAttributeNames.length; i++) {
		para.key[keyAttributeNames[i]] = keyValues[i];
	}

	dba.getEntity(para, function(ent){
		var result = {
				message : 'OK!',
				nodes : [],
				links : []
			};
		if(!ent) {
			result.message = 'Node not found!';
		} else {
			var graph = dba.extractEntities(ent);
			for(var i=0; i<graph.nodes.length; i++) {
				result.nodes.push(entityToJS(graph.nodes[i]));
			}
			for(var i=0; i<graph.edges.length; i++) {
				result.links.push(entityToJS(graph.edges[i]));
			}
		}
		return res.json(result);
	});
};

/**
 * 
 *  For searching
 * 
 */


RESTAPIController.prototype.search = function(req, res) {
	logger.logInfo('query = ' + req.body);
	
	var para = req.body;
	if(!para.traversalDepth) {
		para.traversalDepth = 1;
	}
	
	dba.query(para, function(resultSet){
		var result = {
			message : 'OK!',
			nodes : [],
			links : []
		};
		if(!!resultSet) {
			while (resultSet.hasNext()) {
				var graph = dba.extractEntities(resultSet.next(), para.traversalDepth);
				for(var i=0; i<graph.nodes.length; i++) {
					result.nodes.push(entityToJS(graph.nodes[i]));
				}
				for(var i=0; i<graph.edges.length; i++) {
					result.links.push(entityToJS(graph.edges[i]));
				}
			}
		} else {
			result.message = 'Nothing return from search!';
		}
		res.json(result);
	});
};

/**
 * 
 *  Controller interface
 * 
 */

RESTAPIController.prototype.close = function() {
	logger.logInfo("[RoutesController::close] Close dba !!!!!! ");
	if(null!=dba) {
		dba.close()
	}
};

RESTAPIController.prototype.services = function() {
	var services = [
		{ method : 'get', uri : '/tgdb/metadata', task : this.getMetadata },
		{ method : 'get', uri : '/tgdb/nodetypes', task : this.getNodeTypes},
		{ method : 'get', uri : '/tgdb/edgetypes', task : this.getEdgeTypes},
		{ method : 'get', uri : '/tgdb/node/:node_type/*', task : this.getNode},
		{ method : 'delete', uri : '/tgdb/node/:node_type/*', task : this.deleteNode},
		{ method : 'post', uri : '/tgdb/search', task : this.search },
		{ method : 'post', uri : '/tgdb/node/:node_type', task : this.upsertNode },
		{ method : 'post', uri : '/tgdb/edge', task : this.insertEdge }
	];

	return services;
};

/*
 * 
 *  Utility
 * 
 * */

function entityToJS(ent) {
	var info={};
	info["id"]=ent.getId().getHexString();
 	if(1==dba.checkEntityType(ent)) {
 		var edge = ent;
		var from = edge.getVertices()[0];
		var to = edge.getVertices()[1];
		if(!!from&&!!to) {
			info.source=from.getId().getHexString();
			info.target=to.getId().getHexString();
		}
 	}

	var attrArray=ent.getAttributes();
 	attrArray.forEach(function(attr) {
 		info[attr.getName()]=attr.getValue();
 	});
 	
 	return info;
}

module.exports = RESTAPIController;
