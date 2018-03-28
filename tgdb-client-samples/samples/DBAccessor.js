        
var fs          = require('fs');
var tgdb        = require('tgdb');
var conf = JSON.parse(fs.readFileSync('./conf/server.json'));

var connFactory = tgdb.TGConnectionFactory.getFactory();
var TGLogLevel  = tgdb.TGLogLevel;
var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

function TGDBAccessor() {
	var dba = this;
	dba.conn = connFactory.createConnection(
			conf.dataSources.routes.url, 
			conf.dataSources.routes.user, 
			conf.dataSources.routes.pwd
		);
	dba.gof = null;
	dba.tgmetadata = null;
	dba.conn.connect( function() {
		console.log("Connected ");
		dba.gof = dba.conn.getGraphObjectFactory();
		dba.conn.getGraphMetadata(true,function(gmd) {
			dba.tgmetadata = gmd;
			console.log("Got metadata ....... ");
		});
	});

	dba.option = tgdb.TGQueryOption.createQueryOption();
	dba.option.setPrefetchSize(500);
	dba.option.setTraversalDepth(2);
	dba.option.setEdgeLimit(500);
}

TGDBAccessor.prototype.getMetadata = function(callback) {
	logger.logInfo(" retrieving metadata" );
    var data={};
    data["nodeTypes"]=this.tgmetadata.getNodeTypes();
    data["edgeTypes"]=this.tgmetadata.getEdgeTypes();
    callback(data);
};

TGDBAccessor.prototype.getKeyAttributes = function(entityType, type) {
	logger.logInfo(" retrieving key attributes" );
	var entityMetadata = null;
	if(0===entityType) {
		entityMetadata = this.tgmetadata.getNodeType(type);
	} else if(1===entityType) {
		entityMetadata = this.tgmetadata.getEdgeType(type);
	} else {
		throw("Invalid entity type : " + entityType);
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
    logger.logInfo(para);
	
	var option = this.buildQueryOption(para);
	var keys = this.buildEntityKeys(para);
  	this.conn.getEntity(keys[0], option, function(ent){
  		callback(ent);
  	});
};

TGDBAccessor.prototype.query = function(para, callback) {
	var option = this.buildQueryOption(para);
	this.conn.executeQuery(
		para.query, 
		option, 
		function (resultSet){
			callback(resultSet);
		}
	);
};

TGDBAccessor.prototype.close = function(para, callback) {
	logger.logInfo("[TGDBAccessor::close] Close connection !!!!!! ");
	if(null!=this.conn) {
		this.conn.disconnect()
	}
};

TGDBAccessor.prototype.buildQueryOption = function(para) {
	var option = tgdb.TGQueryOption.createQueryOption();
	option.setTraversalCondition(para.traversalCondition);
	option.setEndCondition(para.endCondition);
	option.setTraversalDepth(para.traversalDepth);
	return option;
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
