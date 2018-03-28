/*
 * Various javascript functions that don't fall into any framework
 * Used by UI interfaces.
 */

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

/*function addTextDiv() {
    var textElements = document.getElementsByClassName('datapoint');
	var count = textElements.length;
    for (var i = 0; i < count; i++) {
    	var textElement = textElements[i];
    	textElement.innerHTML = "<div>test</div>"
    }
}
*/