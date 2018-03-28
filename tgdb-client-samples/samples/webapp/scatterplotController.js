app.controller('ScatterplotController', function($location, $scope, $window, $http) {
	var ctrl = this;
	var serviceURL = 'http://' + $location.host() + ':' + $location.port();
	
	var container = $window.document.getElementById('scatterplot');
	var items = [];

	var dataset = new vis.DataSet(items);
	
	var groups = new vis.DataSet();
    groups.add({id: 0, content: "group0"})
    groups.add({id: 1, content: "group1"})
    groups.add({id: 2, content: "group2"})

	var scatterOptions = {
		sort: false,
		sampling:false,
		style:'points',
		drawPoints: {
			enabled: true,
			size: 6,
			style: 'circle' // square, circle
		},
		defaultGroup: 'Scatterplot',
		height: '600px',

	};
	
	var barOptions = {
			sort: false,
			sampling:false,
			style:'bar',
			drawPoints: {
				enabled: true,
				size: 6,
				style: 'circle' // square, circle
			},
			defaultGroup: 'Scatterplot',
			height: '600px',

	};
	
	var graph2d = new vis.Graph2d(container, dataset, groups, scatterOptions);
	
	graph2d.on('rangeChanged', function addTextDiv(parameters) {
	    var textElements = document.getElementsByClassName('datapoint');
		var count = textElements.length;
	    for (var i = 0; i < count; i++) {
	    	var textElement = textElements[i];
	    	textElement.innerHTML = "<div>test</div>"
	    }
	})
	
	/*-- Graph Initialization, corresponds to DIS-2014, this should not cause anything
	 *   to crash if the data is not loaded -- begin */
	 $http.get(serviceURL + '/rest/api/tgdb/quote/loadYear', {
				params:{
					'nodetype': 'yearpricetype',
					'name': 'DIS-2014',
					'selectedDisplayValue': 'openprice'
				}
			}).success(function onSuccess(response){
				var selectedSymbol = 'DIS';
				var selectedYear = '2014';
				var selectedValue = 'openprice'
				var datapoints = angular.fromJson(response);
				console.log(datapoints);
				items = [];
				var groupValue = 0;
				for (i in datapoints) {
					var obj = datapoints[i];
					var xValue = Object.keys(obj)[0];
					var yValue = obj[xValue];
					xValue = xValue.substr(selectedSymbol.length+1);
					groupValue = (groupValue+1)%3;
					console.log("xValue: " + xValue);
					console.log("yValue: " + yValue);
					items.push({x: xValue, y: yValue, group: groupValue,
								// From CT: This label shows on all the points and displays on hover, save this.
								label: {content: yValue, className: "datapoint"}});
				}

				var dataset = new vis.DataSet(items);
				if (graph2d){
					graph2d.destroy();
				}
				graph2d = new window.vis.Graph2d(container, dataset, groups, barOptions);
			})
	/*-- Graph Initialization, corresponds to DIS-2014, this should not cause anything
	 *   to crash if the data is not loaded -- end */
	
	this.changedSelection = function() {
		var selectedSymbol = $window.document.getElementById('symbol-select').value;
		var selectedYear = $window.document.getElementById('year-select').value;
		var selectedMonth = $window.document.getElementById('month-select').value;
		var selectedValue = $window.document.getElementById('value-select').value;
		console.log(selectedValue);
		if (selectedSymbol == '[ticker symbol]' || selectedYear == '[Year]' || selectedValue == '[Value]') {
			return;
		}
		else if (selectedMonth == '[Month]') {
			// TODO: Do a get call to get new dataset.
			$http.get(serviceURL + '/rest/api/tgdb/quote/loadYear', {
				params:{
					'nodetype': 'yearpricetype',
					'name': selectedSymbol + '-' + selectedYear,
					'selectedDisplayValue': selectedValue
				}
			}).success(function onSuccess(response){
				var datapoints = angular.fromJson(response);
				console.log(datapoints);
				items = [];
				var groupValue = 0;
				for (i in datapoints) {
					var obj = datapoints[i];
					var xValue = Object.keys(obj)[0];
					var yValue = obj[xValue];
					xValue = xValue.substr(selectedSymbol.length+1);
					groupValue = (groupValue+1)%3;
					console.log("xValue: " + xValue);
					console.log("yValue: " + yValue);
					items.push({x: xValue, y: yValue, group: groupValue,
								// From CT: This label shows on all the points and displays on hover, save this.
								label: {content: yValue, className: "datapoint"}});
				}

				var dataset = new vis.DataSet(items);
				if (graph2d){
					graph2d.destroy();
				}
				graph2d = new window.vis.Graph2d(container, dataset, groups, barOptions);
			})
		}
		else {
			// TODO: Do a get call to get new dataset.
			console.log("calling http get /rest/api/tgdb/quote/loadMonth");
			$http.get(serviceURL + '/rest/api/tgdb/quote/loadMonth', {
				params:{
					'nodetype': 'monthpricetype',
					'name': selectedSymbol + '-' + selectedYear + '-' + selectedMonth,
					'selectedDisplayValue': selectedValue
				}
			}).success(function onSuccess(response){
				var datapoints = angular.fromJson(response);
				console.log(datapoints);
				items = []
				var groupValue = 0;
				for (i in datapoints) {
					var obj = datapoints[i];
					var xValue = Object.keys(obj)[0];
					var yValue = obj[xValue];
					xValue = xValue.substr(selectedSymbol.length+1);
					groupValue = (groupValue+1)%3;
					console.log("xValue: " + xValue);
					console.log("yValue: " + yValue);
					console.log("groupValue: " + groupValue);
					items.push({x: xValue, y: yValue, group: groupValue,
								// From CT: This label shows on all the points and displays on hover, save this.
								label: {content: yValue, className: "datapoint"}});
				}

				var dataset = new vis.DataSet(items);
				if (graph2d){
					graph2d.destroy();
				}
				graph2d = new window.vis.Graph2d(container, dataset, groups, barOptions);
/*				var curEdges = ent.getEdges();
          		for (i in curEdges) {
          			console.log(i);
          			//console.log(curEdges[i].getAttributeValue('name'));
          			if (curEdges[i].getAttributeValue('name') == 'MonthToDay') {
          				var curNodes = curEdges[i].getVertices();
          				for (j in curNodes) {
          					var curName = curNodes[j].getAttributeValue('name');
          					if (curName.length > 8) {
          						val = curNodes[j].getAttributeValue('openprice');
          						console.log(curName + ' : open(' + val + ')');
          					}
          				}
          			}
          		}*/
			});
		}
	}
});

