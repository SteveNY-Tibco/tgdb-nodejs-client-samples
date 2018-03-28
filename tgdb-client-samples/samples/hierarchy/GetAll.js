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
var BuildGraph = require('./BuildGraph.js');

var logger = tgdb.TGLogManager.getLogger();
var dbInfo = JSON.parse(fs.readFileSync('db-setup.json')).dbInfo;
/*
function displayAll()
{
    int count = 0;
    int nf = 0;

    TGKey houseKey = gof.createCompositeKey("houseMemberType");
    for (Object[] member : BuildGraph.houseMemberData) {
        String memberName = member[0].toString();
        houseKey.setAttribute("memberName", memberName);
        System.out.printf("Searching for member '%s'...\n", memberName);
        TGEntity houseMember = conn.getEntity(houseKey, null);
        if (houseMember != null) {
            ++count;
            SimpleDateFormat simpleFormat = new SimpleDateFormat("dd MMM yyyy");
            System.out.printf("House member '%s' found\n", houseMember.getAttribute("memberName").getAsString());
            for (TGAttribute attr : houseMember.getAttributes()) {
                if (attr.getValue() == null)
                    System.out.printf("\t%s: %s\n", attr.getAttributeDescriptor().getName(), "");
                else
                    System.out.printf("\t%s: %s\n", attr.getAttributeDescriptor().getName(), (attr.getValue() instanceof Calendar) ? (simpleFormat.format(((Calendar) attr.getValue()).getTime())) : attr.getValue());
            }
            for (TGEdge relation : ((TGNode)houseMember).getEdges(TGEdge.DirectionType.Directed)) { // Directed == child
                TGNode[] vertices = relation.getVertices();
                TGNode fromMember = vertices[0];
                TGNode toMember = vertices[1];
                if (fromMember == houseMember) {
                    System.out.printf("\tchild: %s\n", toMember.getAttribute("memberName").getAsString());
                }
            }
        } else {
            System.out.printf("House member '%s' not found\n", memberName);
            ++nf;
        }
    }
    System.out.printf("Number of entities found :%d\n", count);
    System.out.printf("length of HouseMemberData:%d\n", BuildGraph.houseMemberData.length);
    System.out.printf("Number of entities Not found :%d\n", nf);
    return;
}
*/
function main() {
	
	logger.setLevel(tgdb.TGLogLevel.Info);

	logger.logInfo(BuildGraph.houseMemberData);
	
	/*
	var conn = tgdb.TGConnectionFactory.getFactory().createConnection(dbInfo.url, dbInfo.user, dbInfo.pwd, null);
	conn.connect(function(){
		var gof = conn.getGraphObjectFactory();
		if (!gof) {
			throw new tgdb.TGException("Graph object not found");
		}

        var queryString = "@nodetype = 'houseMemberType';";
        var opt = tgdb.TGQueryOption.createQueryOption();
        opt.setTraversalDepth(1);
        opt.setEdgeLimit(1);
        opt.setPrefetchSize(1000);
        conn.executeQuery(queryString, opt, function(resultSet){
        	var entityList = [];
            while (resultSet.hasNext())
            {
                entityList.push(resultSet.next());
            }
        });
	});*/
}

main();