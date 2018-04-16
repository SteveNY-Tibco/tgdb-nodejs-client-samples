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
        
var fs          = require('fs');
var tgdb        = require('tgdb');
var TGDataAccessException = require('./exception/TGDataAccessException').TGDataAccessException;

var conf = JSON.parse(fs.readFileSync('./conf/server.json'));

var connFactory = tgdb.TGConnectionFactory.getFactory();
var TGLogLevel  = tgdb.TGLogLevel;
var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

var dba = null;
function TGDBAccessor() {
	dba = this;
	dba.conn = connFactory.createConnection(
		conf.dataSources.routes.url, 
		conf.dataSources.routes.user, 
		conf.dataSources.routes.pwd
	);
	dba.gof = null;
	dba.tgmetadata = null;
	dba.conn.connect( function() {
		console.log("Connected ..... ");
		dba.gof = dba.conn.getGraphObjectFactory();
		dba.tgmetadata = dba.gof.getGraphMetaData();
	});

	dba.option = tgdb.TGQueryOption.createQueryOption();
	dba.option.setPrefetchSize(500);
	dba.option.setTraversalDepth(2);
	dba.option.setEdgeLimit(500);
}

TGDBAccessor.prototype.checkEntityType = function(ent) {
	if(!this.gof.isEntity(ent)) {
		throw("Not an entity : " + ent);
    }
	
    if (this.gof.isNode(ent)) {
    	return 0;
    } else if (this.gof.isEdge(ent)) {
    	return 1;
    } else {
		throw(new TGDataAccessException("Unknown entity type : " + ent));
    }
};

TGDBAccessor.prototype.getMetadata = function(callback) {
	logger.logInfo(" retrieving metadata" );
    var data={};
    if(!dba.tgmetadata) {
		dba.conn.getGraphMetadata(true,function(gmd) {
			dba.tgmetadata = gmd;
			console.log("Got metadata ....... ");
		    data["nodeTypes"]=dba.tgmetadata.getNodeTypes();
		    data["edgeTypes"]=dba.tgmetadata.getEdgeTypes();
		    callback(data);
		});
    } else {
    	data["nodeTypes"]=dba.tgmetadata.getNodeTypes();
    	data["edgeTypes"]=dba.tgmetadata.getEdgeTypes();
    	callback(data);
    }
};

TGDBAccessor.prototype.getEntityTypes = function(entityType) {
	logger.logInfo(" retrieving node types" );
    var types = null;
	if(0===entityType) {
		types = this.tgmetadata.getNodeTypes();
	} else if(1===entityType) {
		types = this.tgmetadata.getEdgeTypes();
	} else {
		throw(new TGDataAccessException("Invalid entity type : " + entityType));
	}
	
    var entityTypes=[];
	for(var i=0; i<types.length; i++) {
		entityTypes.push(types[i]._name);
	}
	return entityTypes;
};

TGDBAccessor.prototype.getKeyAttributes = function(entityType, type) {
	logger.logInfo(" retrieving key attributes" );
	var entityMetadata = null;
	if(0===entityType) {
		entityMetadata = this.tgmetadata.getNodeType(type);
	} else if(1===entityType) {
		entityMetadata = this.tgmetadata.getEdgeType(type);
	} else {
		throw(new TGDataAccessException("Invalid entity type : " + entityType));
	}

    if (!entityMetadata)
      throw("type " + type + " does not exist.");
    
    var keyAttributes = [];
  	for ( var k in entityMetadata._pKeys) {
  		keyAttributes.push(entityMetadata._pKeys[k].getName());
  		logger.logInfo("find a key attribute " + entityMetadata._pKeys[k].getName());
    }
    return keyAttributes;
};

TGDBAccessor.prototype.getEntities = function(para, callback) {
	
	/* Not implemented yet!!!!!! */
	
	var option = this.buildQueryOption(para);
	var keys = buildEntityKeys(para);
	var key = keys.shift();
  	conn.getEntity(key, option, function(ent){
//  		if() {
  			
//  		}
  		callback(ent);
  	});
};

TGDBAccessor.prototype.getEntity = function(para, callback) {
	var option = this.buildQueryOption(para);
	var key = this.buildEntityKey(para);
  	this.conn.getEntity(key, option, function(ent){
  		callback(ent);
  	});
};

TGDBAccessor.prototype.query = function(para, callback) {
	
	console.log(para);
	
	var option = this.buildQueryOption(para);
	this.conn.executeQuery(
		para.query.queryString, 
		option, 
		function (resultSet){
			callback(resultSet);
		}
	);
};

TGDBAccessor.prototype.insertNode = function(type, para, callback) {
	var nodeTypeName = type;
	var props = para.properties;
	var nodeType = this.tgmetadata.getNodeType(nodeTypeName);
	if (!nodeType) {
	    throw(new TGDataAccessException("Node type "+type+" does not exist."));
	}
	
	var node = this.gof.createNode(nodeType);
	for (var k in props) {
		node.setAttribute(k, props[k]);
		logger.logInfo("Using attribute "+k);
	}

	this.conn.insertEntity(node);
	this.conn.commit(function(changeList, exception){
		logger.logInfo("Insert transaction completed for Node : " + props[0]);
		if(!exception) {
			callback(node);				
		} else {
			callback(null, exception);				
		}
	});
}

TGDBAccessor.prototype.updateNode = function(type, para, callback) {
	para.type =type;
	para.key = {};
	var keyAttributeNames = this.getKeyAttributes(0, type);
	if (!keyAttributeNames) {
	    throw(new TGDataAccessException("Node search key definition for node type " + type + "."));
	}

	for(var i=0; i<keyAttributeNames.length; i++) {
		para.key[keyAttributeNames[i]] = para.properties[keyAttributeNames[i]];
	}
	
	this.getEntity(para, function(node){
		if(!node) {
			logger.logInfo(para.key);
			logger.logInfo("Unable to update, node has not found.");
			callback(null, new TGDataAccessException("Unable to update, node has not found."));
		}
		var props = para.properties;
		for (var k in props) {
			node.setAttribute(k, props[k]);
			logger.logInfo("Using attribute "+k);
		}
		dba.conn.updateEntity(node);
		dba.conn.commit(function(changeList, exception){
			logger.logInfo("Update transaction completed for Node : " + props[0]);
			if(!exception) {
				callback(node);				
			} else {
				callback(null, exception);				
			}
		});
	});
};

TGDBAccessor.prototype.deleteNode = function(para, callback) {
	
	this.getEntity(para, function(node){
		if(!node) {
			logger.logInfo(para.key);
			callback(null, new TGDataAccessException("Unable to delete, target node has not found."));
			return;
		}
		
		dba.conn.deleteEntity(node);
		dba.conn.commit(function(changeList, exception){
			if(!exception) {
				logger.logInfo("Delete transaction completed for Node : %s(%s)",para.type ,para.key);	        
				callback(node);				
			} else {
				callback(null, exception);				
			}
	    });
	});	
};

TGDBAccessor.prototype.insertEdge = function(type, para, callback) {
	var source = para.source;
	var target = para.target;
	var attributes = para.properties;
	
	this.getEntity(source, function(sourceNode){
		if(!sourceNode) {
			logger.logInfo(para.key);
			logger.logInfo("Source node has not found.");
			throw new TGDataAccessException("Source node has not found.");
		}
		
		dba.getEntity(target, function(targetNode){
			if(!targetNode) {
				logger.logInfo(para.key);
				logger.logInfo("Target node has not found.");
				callback(null, new TGDataAccessException("Target node has not found."));
				return;
			}

			var edge = dba.gof.createUndirectedEdge(sourceNode, targetNode);
			for (var k in attributes) {
				edge.setAttribute(k,attributes[k]);
				logger.logInfo("Setting edge attribute "+k);
			}
             
			logger.logInfo("Create edge : ");
			dba.conn.insertEntity(edge);
			dba.conn.commit(function(changeList, exception){
				if(!exception) {
					logger.logInfo("Transaction completed for Edge");
					callback(edge);				
				} else {
					callback(null, exception);				
				}
			});			
		});
	});
}

TGDBAccessor.prototype.deleteEdge = function(type, para, callback) {
	
	/* Not implemented yet!!!!!! */

	
	var source = para.source;
	var target = para.target;
	var attributes = para.properties;
	
	this.getEntity(source, function(sourceNode){
		if(!sourceNode) {
			logger.logInfo(para.key);
			logger.logInfo("Source node has not found.");
			throw new TGDataAccessException("Source node has not found.");
		}
		dba.getEntity(target, function(targetNode){
			if(!targetNode) {
				logger.logInfo(para.key);
				logger.logInfo("Target node has not found.");
				callback(null, new TGDataAccessException("Target node has not found."));
				return;
			}
			
			var directionType = null;
			if(!!direction) {
			    switch (direction) {
		    	case TGEdgeDirectionType.UNDIRECTED.ordinal :
		    		directionType = TGEdgeDirectionType.UNDIRECTED;
		    		break;
		    	case TGEdgeDirectionType.DIRECTED.ordinal :
		    		directionType = TGEdgeDirectionType.DIRECTED;
		    		break;
		    	case TGEdgeDirectionType.BIDIRECTIONAL.ordinal :
		    		directionType = TGEdgeDirectionType.BIDIRECTIONAL;
		    		break;
			    }
			}

			var targetEdges = [];
			var edges = sourceNode.getEdges();
			for(var i=0; i<edges.length; i++) {
				var edge = edges[i];
				if(!directionType||directionType===edge.getDirection()) {
					var nodes = edge.getVertices();
					for(var j=0; j<nodes.length; j++) {
						var node = nodes[j];
						if(node==targetNode) {
							targetEdges.push(edge);
						}
					}
				}
			}
			
			for(var i=0; i<targetEdges.length; i++) {
				logger.logInfo("Delete edge : ");
				dba.conn.deleteEntity(targetEdges[i]);
			}
			
			dba.conn.commit(function(changeList, exception){
		        if(callback) {
					logger.logInfo("Delete transaction completed for Edge");
		            callback({'message':'delete edge done!'});
		        }
			});			
		});
	});
}

TGDBAccessor.prototype.close = function(para, callback) {
	logger.logInfo("[TGDBAccessor::close] Close connection !!!!!! ");
	if(null!=this.conn) {
		this.conn.disconnect()
	}
};

TGDBAccessor.prototype.buildQueryOption = function(para) {
	var option = tgdb.TGQueryOption.createQueryOption();
	
	if(!!para.query) {
		if(!!para.query.traversalCondition) {
			option.setTraversalCondition(para.query.traversalCondition);
		}
		
		if(!!para.query.endCondition) {
			option.setEndCondition(para.query.endCondition);
		}
	}
	
	option.setPrefetchSize(!para.prefetchSize?this.option.getPrefetchSize():para.prefetchSize);
	option.setTraversalDepth(!para.traversalDepth?this.option.getTraversalDepth():para.traversalDepth);
	option.setTraversalDepth(!para.edgeLimit?this.option.getEdgeLimit():para.edgeLimit);

	return option;
};

TGDBAccessor.prototype.buildEntityKey = function(para) {
	/*
	{
		"type" : "airportType",
		"key" : {
			"airportID": "AIRPORT99000000"
		},
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
	var tgKey = this.gof.createCompositeKey(para.type);
	for(var attrName in para.key) {
		tgKey.setAttribute(attrName, para.key[attrName]);
	}

	return tgKey;
};

TGDBAccessor.prototype.buildEntityKeys = function(para) {
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
	
	var tgKeys = [];
	for(var i=0; i<para.keys.length; i++) {
		var key = para.keys[i];
		var entityType = key.entityType;
		var type = key.type;
		var tgKey = this.gof.createCompositeKey(type);
		for(var attrName in key.keyAttributes) {
			tgKey.setAttribute(attrName, key.keyAttributes[attrName]);
		}
		tgKeys.push(tgKey);
	}

	return tgKeys;
};

TGDBAccessor.prototype.extractEntities = function (ent, maxDepth) {
	if(!maxDepth) {
		maxDepth = this.option.getTraversalDepth();
	}
	var traversedMap = {};
	var gof = this.gof;
	traverse(gof, ent, maxDepth, 0, traversedMap);
	
	var result = {
		nodes : [],
		edges : []
	};
	
	Object.keys(traversedMap).forEach(function(key){
		var entity = traversedMap[key];
		if(gof.isNode(entity)) {
			result.nodes.push(entity);
		} else {
			result.edges.push(entity);
		}
	});
	
	return result;
};

function traverse(gof, ent, maxDepth, currDepth, traversedMap) {
	var entityId = ent.getId().getHexString();
    if (currDepth === maxDepth||!ent) {
		return;
	}
	
	if (traversedMap[entityId]) {
		// We've seen it before so do nothing
		return;
	}

	// See a new entity will try to traverse down
	traversedMap[entityId] = ent;

    if (gof.isNode(ent)) {
    	logger.logDebugWire('A node : ' + ent.getId().getHexString());    	
        ent.getAttributes().forEach(function(attr) {
        	logger.logDebugWire('      ' + attr.getValue());
        });
	
    	var edges = ent.getEdges();
    	edges.forEach(function(edge) {
    		traverse(gof, edge, maxDepth, currDepth, traversedMap);
    	});
    } else if (!gof.isNode(ent)) {
    	logger.logDebugWire('An edge : ' + ent.getId().getHexString());
        ent.getAttributes().forEach(function(attr) {
        	logger.logDebugWire('      ' + attr.getValue());
        });
    	
    	var nodes = ent.getVertices();
    	nodes.forEach(function(node) {
    		if(node&&node.getId().getHexString()!==0) {
        		traverse(gof, node, maxDepth, currDepth, traversedMap);
    		}
    	});
    } else {
    	logger.logDebugWire('Unknow entity type.');
    }
}

//===========================================================================

var DBAccessor = {
	defaultDBAccessor : null,
	getDBAccessor : function() {
		console.log("[DBAccessor::getDBAccessor]");
		if(!this.defaultDBAccessor) {
			this.defaultDBAccessor = new TGDBAccessor();
		}
		return this.defaultDBAccessor;
	}
};

module.exports = DBAccessor;
