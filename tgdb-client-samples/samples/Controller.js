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
