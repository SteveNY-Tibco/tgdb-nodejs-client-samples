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
	return res.json(dba.getEntityTypes(0));
};

RESTAPIController.prototype.getEdgeTypes = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	return res.json(dba.getEntityTypes(1));
};

RESTAPIController.prototype.getMetadata = function(req, res) {
	logger.logInfo('query = ' + req.query);	
	dba.getMetadata(function(metedata){
		res.json(metedata);
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
	dba.insertNode(nodeTypeName, req.body, function(node, exception){
		if(!!exception) {
			if(!(exception instanceof tgdb.TGTransactionUniqueConstraintViolationException)) {
				res.send(exception);	
			} else {
				dba.updateNode(nodeTypeName, req.body, function(node, exception){
					if(!!exception) {
						res.send(exception);	
					} else {
						res.send(entityToJS(node));	
					}
				});
			}
		} else {
			res.send(entityToJS(node));	
		}
	});
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
	dba.insertEdge(edgeTypeName, req.body, function(edge){
		res.send(entityToJS(edge));	
	});
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
				"nodes" : [],
				"links" : []
			};
		var graph = dba.extractEntities(ent);
		for(var i=0; i<graph.nodes.length; i++) {
			result.nodes.push(entityToJS(graph.nodes[i]));
		}
		for(var i=0; i<graph.edges.length; i++) {
			result.links.push(entityToJS(graph.edges[i]));
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
			"nodes" : [],
			"links" : []
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
			res.json(result);
		} else {
			res.json(result);
		}
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
