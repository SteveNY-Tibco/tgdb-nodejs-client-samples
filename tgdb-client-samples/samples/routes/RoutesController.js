        
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
	var para = {};
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

	para["queryString"] = queryString;
	para["traversalCondition"] = traverseString;
	para["endCondition"] = endString;
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
//				console.log("%s%s - %s - iata", level, i, j, iata);
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
	var query = {
			"maxStops" : 2,
			"airlineCode" : [
				"DL"
			],
			"fromAirport" : "JFK",
			"toAirport" : "SFO"
		};
		
		logger.logInfo('query = ' + query);	
		
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

			var para = {};
			para["queryString"] = queryString;
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
//							tgdb.PrintUtility.printEntitiesBreadth(airport0, 10);						
							var route = [];
							route.push(airportCode0);
							buildRoutes(0, "", routes, route, airport0, query.toAirport);
				
						}
					}
					return res.json({"numberOfRoutes": routes.length, "routes":routes});
				});
			});		
		} else {
			dba.queryByExpr(buildTraversalQueryParameter(query, airlineIDName), function(resultSet) {
				// Go through resultSet and build routes
				var routes = [];
				if (!!resultSet) {
					while (resultSet.hasNext()) {
						var airport0 = resultSet.next();
						var airportCode0 = (airport0).getAttribute("iataCode").getValue();
//						tgdb.PrintUtility.printEntitiesBreadth(airport0, 10);						
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
		method : 'get',
		uri : '/tgdb/flights',
		task : this.routes
	};
	services.push(service);

	return services;
};

module.exports = RoutesController;
