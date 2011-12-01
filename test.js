/*
* TODO:
* - Use the prototype
* - Data binding
* - Layout
* 	- use w/h in expression
*	- Get a clear box model
*/
window.onload = function() {
	UI.init();
	
	p1 = UI.panel({
		x: "50%",
		width: "50%",
		height: "100% - 20px",
		backgroundColor: "rgb(0, 200, 0)",
		padding: 10
	});
	
	p1Child = UI.panel({
		height: "50px",
		backgroundColor: "rgb(200, 0, 0)",
		parent: p1
	});
	
	p2 = UI.panel({		
		width: "50%",
		height: "35px",
		borderSize: 2,
		borderColor: "rgb(100, 100, 100)"
	});
	
	p3 = UI.panel({
		width: "50%",
		height: "50% - 28px",
		y: 35,
		backgroundColor: "rgb(250, 250, 100)",
		borderSize: 20
	});
	
	p3Child = UI.panel({
		parent: p3
	});
	
	p35 = UI.panel({
		width: "50%",
		height: "50% - 28px",
		y: "50% + 8px",
		backgroundColor: "rgb(150, 250, 250)",
		borderSize: 0
	});
	
	p4 = UI.panel({
		y: "100% - 20px",
		width: "100%",
		height: "20px",
		borderSize: 1
	});

	//this will be automatic soon
	UI.fullscreen();
}
