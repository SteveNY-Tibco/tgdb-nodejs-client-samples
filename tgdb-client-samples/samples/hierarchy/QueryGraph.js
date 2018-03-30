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
	logger.setLevel(tgdb.TGLogLevel.Info);

	var startYear = 1700;
	var endYear = 1800;
	var testcase = null;

	var startYearIndex = -1;
	var endYearIndex = -1;
	var testcaseIndex = -1;
	process.argv.forEach(function (val, index, array) {
		console.log(index + ': ' + val); 
		if (val==='-startyear') {
			startYearIndex = index+1;
		}
		
		if (val==='-endyear') {
			endYearIndex = index+1;
		}

		if (val==='-testcase') {
			testcaseIndex = index+1;
		}
		
		if(index===startYearIndex) {
			startYear = val;
		}
		
		if(index===endYearIndex) {
			endYear = val;
		}
		
		if(index===testcaseIndex) {
			testcase = val;
		}

	});
	
    var queryString = null;
    var traverseString = null;
    var endString = null;
    var resultSet = null;
    var dumpDepth = 5;
    var currDepth = 0;
    var dumpBreadth = false;
    var showAllPath = true;
    var option = tgdb.TGQueryOption.createQueryOption();
    if ('1'===testcase) {
        //Simple query
        dumpBreadth = true;
        logger.logInfo("Querying for member born between %d and %d\n", startYear, endYear);
        queryString = "@nodetype = 'houseMemberType' and yearBorn > " + startYear + " and yearBorn < " + endYear + ";";
        option = null;
    } else if ('2'===testcase) {
    	//Identify a single path from Napoleon Bonaparte  to Francois Bonaparte
        queryString = "@nodetype = 'houseMemberType' and memberName = 'Napoleon Bonaparte';";
        traverseString = "@edgetype = 'offspringEdge' and @isfromedge = 1 and @edge.birthOrder = 1 and @degree < 3" + ";";
        endString = "@tonodetype = 'houseMemberType' and @tonode.memberName = 'Francois Bonaparte'" + ";"; 
        option.setTraversalCondition(traverseString);
        option.setEndCondition(endString);
    } else if ('3'===testcase) {
    	//Identify all paths from Napoleon Bonaparte  to Napoleon IV Eugene with no traversal filter except 10 level deep restriction
        dumpDepth = 10;
        queryString = "@nodetype = 'houseMemberType' and memberName = 'Napoleon Bonaparte';";
        endString = "@tonodetype = 'houseMemberType' and @tonode.memberName = 'Napoleon IV Eugene'" + ";"; 
        option.setTraversalDepth(10);
        option.setEndCondition(endString);
    } else if ('4'===testcase) {
    	//Identify all paths from Napoleon Bonaparte  to Napoleon IV Eugene using only offspringEdge type and within 10 level deep
        dumpDepth = 10;
        queryString = "@nodetype = 'houseMemberType' and memberName = 'Napoleon Bonaparte';";
        traverseString = "@edgetype = 'offspringEdge' and @degree <= 10" + ";";
        endString = "@tonodetype = 'houseMemberType' and @tonode.memberName = 'Napoleon IV Eugene'" + ";"; 
        option.setTraversalDepth(10);
        option.setTraversalCondition(traverseString);
        option.setEndCondition(endString);
    } else if ('5'===testcase) {
    	//Identify specific path from Napoleon Bonaparte -> his parents -> Louis Bonaparte -> Louis Napoleon -> Napoleon IV Eugene
        dumpDepth = 10;
        queryString = "@nodetype = 'houseMemberType' and memberName = 'Napoleon Bonaparte';";
        traverseString = "(@edgetype = 'offspringEdge' and @isfromedge = 0 and @degree = 1)" +
                                   "or (@edgetype = 'offspringEdge' and @isfromedge = 1 and @degree = 2)" +
                                   "or (@edgetype = 'offspringEdge' and @isfromedge = 1 and @degree = 3)" +
                                   "or (@edgetype = 'offspringEdge' and @isfromedge = 1 and @degree = 4)" +
                                    ";";
        endString = "@tonodetype = 'houseMemberType' and @tonode.memberName = 'Napoleon IV Eugene'" + ";"; 
        option.setTraversalDepth(10);
        option.setTraversalCondition(traverseString);
        option.setEndCondition(endString);
    }
	
	var conn = tgdb.TGConnectionFactory.getFactory().createConnection(dbInfo.url, dbInfo.user, dbInfo.pwd, null);
	conn.connect(function(){
		var gof = conn.getGraphObjectFactory();
		if (!gof) {
			throw new TGException("Graph object not found");
		}

		conn.getGraphMetadata(true, function(gmd){
	        conn.executeQuery(queryString, option, function(resultSet){
	          	if (!!resultSet) {
	                while (resultSet.hasNext()) {
	                    var houseMember = resultSet.next();
	                    
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
	            } else {
	          		logger.logInfo("Querying for member born between %d and %d not found", startYear, endYear);
	          	}
	          		
	    		if (conn !== null) {
	    			conn.disconnect();
	    		}
	        });
		});
	});
}

main();