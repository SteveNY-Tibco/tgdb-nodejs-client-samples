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

var fs         = require('fs');
var http       = require('http');
var express    = require('express');
var bodyParser = require('body-parser');

var tgdb       = require('tgdb');
var controllers = require('./Controller').getControllers();
var conf       = JSON.parse(fs.readFileSync('./conf/server.json'));

var logger = tgdb.TGLogManager.getLogger();
logger.setLevel(tgdb.TGLogLevel.Debug);

var app = express();
app.use(express.static(__dirname + '/webapp'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function(req, res){
  res.redirect('/index.htm');
});

//===========================================================================

for(var i=0; i<controllers.length; i++) {
	var services = controllers[i].services();
	for(var j=0; j<services.length; j++) {
		logger.logInfo("Deploying service : method = " + services[j].method + ", uri = " + services[j].uri);
		if('get'===services[j].method) {
			app.get(services[j].uri, services[j].task);			
			logger.logInfo("Service : method = " + services[j].method + ", uri = " + services[j].uri + " Deployed!");
		} else if('post'===services[j].method) {
			app.post(services[j].uri, services[j].task);			
			logger.logInfo("Service : method = " + services[j].method + ", uri = " + services[j].uri + " Deployed!");
		} else if('put'===services[j].method) {
			app.put(services[j].uri, services[j].task);			
			logger.logInfo("Service : method = " + services[j].method + ", uri = " + services[j].uri + " Deployed!");
		} else if('delete'===services[j].method) {
			app.delete(services[j].uri, services[j].task);			
			logger.logInfo("Service : method = " + services[j].method + ", uri = " + services[j].uri + " Deployed!");
		}
	}	
}

//===========================================================================

function cleanup(options, err) {
    if (options.cleanup) {
    	logger.logInfo("[Server::cleanup] Close controller !!!!!! ");
    	for(var i=0; i<controllers.length; i++) {
    		if(!!controllers[i]) {
    			controllers[i].close();
    		}
    	}
    }
    if (err) {
    	console.log(err.stack);
    }
    if (options.exit) {
    	process.exit();
    }
}

process.stdin.resume();
process.on('uncaughtException', cleanup.bind(null, {exit:true})); // uncaught exceptions
process.on('exit', cleanup.bind(null,{cleanup:true}));  // closing
process.on('SIGINT', cleanup.bind(null, {exit:true}));  // ctrl-c 
process.on('SIGUSR1', cleanup.bind(null, {exit:true})); // kill
process.on('SIGUSR2', cleanup.bind(null, {exit:true}));

//===========================================================================

var serviceLocations = conf.serviceLocations;

for(var i=0; i<serviceLocations.length; i++) {
	try {
		http.createServer(app).listen(serviceLocations[i].port, serviceLocations[i].ip);
		console.log('Server running at http://' + serviceLocations[i].ip + ':' + serviceLocations[i].port + '/');
	} catch(err) {
		console.log('Error running at : ' + err);
	}
}
