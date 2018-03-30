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
