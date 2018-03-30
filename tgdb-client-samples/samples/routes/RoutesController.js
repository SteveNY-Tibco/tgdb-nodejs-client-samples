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
var conf = JSON.parse(fs.readFileSync('./conf/server.json'));

var connFactory = tgdb.TGConnectionFactory.getFactory();
var TGLogLevel  = tgdb.TGLogLevel;
var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

function RoutesController() {
}

function buildTraversalQueryParameter(query, airlineIDName) {
	var para = { query:{} };
	// Build and execute query
	var queryString = "@nodetype = 'airportType' and iataCode = '" + query.fromAirport + "';";
	var traverseString = "@edgetype = 'routeType' and @isfromedge = 1";
	for (var i=0; i<airlineIDName.length; i++) {
		if (i==0)
			traverseString = traverseString + " and (@edge.airlineID = '" + airlineIDName[i][0] + "'";
		else
			traverseString = traverseString + " or @edge.airlineID = '" + airlineIDName[i][0] + "'";
		if (i==airlineIDName.length-1)
			traverseString = traverseString + ")";

	}
	traverseString = traverseString + " and @degree <= " + (query.maxStops + 1) + ";";
	var endString = "@tonodetype = 'airportType' and @tonode.iataCode = '" + query.toAirport + "';";

	logger.logInfo("\nSearching routes from '" + query.fromAirport + "' to '" + query.toAirport + "' with " + query.maxStops + " stop(s)");
	for (var i=0; i<airlineIDName.length; i++) {
		if (i==0)
			logger.logInfo(" via airlines '"+airlineIDName[i][1]+"'");
		else
			logger.logInfo(", '"+airlineIDName[i][1]+"'");
	}
	logger.logInfo(" ...");

	para.query["queryString"] = queryString;
	para.query["traversalCondition"] = traverseString;
	para.query["endCondition"] = endString;
	para["traversalDepth"] = query.maxStops + 1;

	return para;
}

function buildRoutes(stops, level, routes, route, airport, targetCode) {
	var rts = airport.getEdges();
	for(var i=0; i<rts.length; i++) {
		for(var j=0; j<rts[i].getVertices().length; j++) {
			var nextAirport = rts[i].getVertices()[j];
			var iata = nextAirport.getAttribute("iataCode").getValue();
			if(nextAirport.getId()===airport.getId()||route.indexOf(iata)>=0) {
				continue;
			}
			var newRoute = null;
			if(i!==rts.length-1) {
				newRoute = route.slice(0);
			} else {
				newRoute = route;
			}
			newRoute.push(iata);
			if(targetCode!==iata) {
				if(stops<3) {
					buildRoutes(stops+1, level+"   ", routes, newRoute, rts[i].getVertices()[j], targetCode);					
				}
			} else {
				routes.push(newRoute);
			}
		}
	}
}

RoutesController.prototype.routes = function(req, res) {
	var query = req.body;
	
	// Search for airline ID first
	var airlineIDName = [];
	var queryString = queryString = "@nodetype = 'airlineType'";
	if (!(!query.airlineCode)) {
		for(var i=0; i<query.airlineCode.length; i++) {
			if (i===0)
				queryString = queryString + " and (iataCode = '" +query.airlineCode[i]+ "'";
			else
				queryString = queryString + " or iataCode = '" +query.airlineCode[i]+ "'";
		}
		queryString = queryString + ");";

		var para = { query:{} };
		para.query["queryString"] = queryString;
		para["traversalDepth"] = query.maxStops + 1;
		
		dba.query(para, function (result){
			while (result.hasNext()) {
				var airline = result.next();
				var airlineInfo = [];
				airlineInfo.push(airline.getAttribute("airlineID").getValue());
				airlineInfo.push(airline.getAttribute("name").getValue());
				airlineIDName.push(airlineInfo);
				console.log(airlineIDName);
			}
			
			dba.query(buildTraversalQueryParameter(query, airlineIDName), function(resultSet) {
				// Go through resultSet and build routes
				var routes = [];
				if (!!resultSet) {
					while (resultSet.hasNext()) {
						var airport0 = resultSet.next();
						var airportCode0 = (airport0).getAttribute("iataCode").getValue();
						var route = [];
						route.push(airportCode0);
						buildRoutes(0, "", routes, route, airport0, query.toAirport);
					}
				}
				return res.json({"numberOfRoutes": routes.length, "routes":routes});
			});
		});		
	} else {
		dba.query(buildTraversalQueryParameter(query, airlineIDName), function(resultSet) {
			// Go through resultSet and build routes
			var routes = [];
			if (!!resultSet) {
				while (resultSet.hasNext()) {
					var airport0 = resultSet.next();
					var airportCode0 = (airport0).getAttribute("iataCode").getValue();
					var route = [];
					route.push(airportCode0);
					buildRoutes(0, "", routes, route, airport0, query.toAirport);
				}
			}
			return res.json({"numberOfRoutes": routes.length, "routes":routes});
		});
	}	
};

RoutesController.prototype.close = function() {
	logger.logInfo("[RoutesController::close] Close dba !!!!!! ");
	if(null!=dba) {
		dba.close()
	}
};

RoutesController.prototype.services = function() {
	var services = [];
	var service = {
		method : 'post',
		uri : '/samples/routes',
		task : this.routes
	};
	services.push(service);

	return services;
};

module.exports = RoutesController;
