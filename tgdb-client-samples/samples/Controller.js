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
var conf = JSON.parse(fs.readFileSync('./conf/server.json'));

var controllers = {};
var controllerArray = [];
for(var i=0; i<conf.controllers.length; i++) {
	
	console.log(conf.controllers[i]);
	
	var AController = require(conf.controllers[i].path);
	controllers[conf.controllers[i].name] = new AController();
	controllerArray.push(controllers[conf.controllers[i].name]);
}

//===========================================================================

var Controller = {
	defaultController : controllerArray[0],
	getControllers : function() {
		return controllerArray;
	},
	getController : function(controller) {
		if(!controkker) {
			return controllers[controller];
		}
		return this.defaultController;
	}
};

module.exports = Controller;
