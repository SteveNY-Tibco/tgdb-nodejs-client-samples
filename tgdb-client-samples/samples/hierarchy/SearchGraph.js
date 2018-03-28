/**
 * Query for members in the House of Bonaparte graph 
 * born between the start and end years
 * and display the member attributes.
 * 
 * Usage : node QueryGraph.js -startyear 1900 -endyear 2000
 * 
 */
var tgdb = require('tgdb');
var fs   = require('fs');

var logger = tgdb.TGLogManager.getLogger();
var dbInfo = JSON.parse(fs.readFileSync('db-setup.json')).dbInfo;

function main() {
	
	var memberName = 'Napoleon Bonaparte';
	var targetIndex = -1;
	process.argv.forEach(function (val, index, array) {
		console.log(index + ': ' + val); 
		if (val==='-memberName') {
			targetIndex = index+1;
		}
		
		if(index===targetIndex) {
			memberName = val;
		}
	});
	
	logger.setLevel(tgdb.TGLogLevel.Info);
		
	var conn = tgdb.TGConnectionFactory.getFactory().createConnection(dbInfo.url, dbInfo.user, dbInfo.pwd, null);
	conn.connect(function(){
		var gof = conn.getGraphObjectFactory();
		if (!gof) {
			throw new TGException("Graph object not found");
		}

		conn.getGraphMetadata(true, function(gmd){
			var houseKey = gof.createCompositeKey("houseMemberType");
			houseKey.setAttribute("memberName", memberName);
			logger.logInfo("Searching for member '%s'...\n",memberName);
			
      		conn.getEntity(houseKey, null, function(houseMember){
          		if (houseMember) {
                    logger.logInfo("House member '%s' found",houseMember.getAttribute("memberName").getValue());
                    houseMember.getAttributes().forEach(function(attr) {
                    	if (attr.getValue() === null) {
                    		logger.logInfo("\t%s: %s", attr.getName(), "");
                    	}
                    	else {
                    		logger.logInfo("\t%s: %s", attr.getName(), attr.getValue());
                    	}
                    });
          		}
	    		if (conn !== null) {
	    			conn.disconnect();
	    		}
      		});
		});
	});
}

main();
