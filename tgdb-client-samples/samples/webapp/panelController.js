app.controller('PanelController', function() {
	this.activePanel = 1;
	
	this.select = function(selectedPanel) {
		this.activePanel = selectedPanel;
	};
	
	this.isSelected = function(targetPanel) {
		return this.activePanel === targetPanel;
	};
});

app.directive('activePanel', function(){
	return {
		restrict : 'A',
		templateUrl : function(elem, attr){
			return attr.tab+'.html';
	    }
	};
});

app.controller('CommunityPanelController', function() {
	this.activePanel = 1;
	
	this.select = function(selectedPanel) {
		this.activePanel = selectedPanel;
	};
	
	this.isSelected = function(targetPanel) {
		return this.activePanel === targetPanel;
	};
});

app.directive('activeCommunityPanel', function(){
	return {
		restrict : 'A',
		templateUrl : function(elem, attr){
			return 'community/' + attr.tab+'-community.html';
	    }
	};
});

var toggle = false;
function toggleNav() {
    toggle = !toggle;
    if (toggle) {
        document.getElementById("mySidenav").style.width = "450px";
        document.getElementById("overlayButton").style.right="450px";
    }
    else {
        document.getElementById("mySidenav").style.width = "0";
        document.getElementById("overlayButton").style.right="0px";
    }
}