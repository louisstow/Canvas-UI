var UI = (function(window, document, undefined) {
	var canvas;
	var ctx;
	var tree;
	var currentTheme = "default";
	var themes = {
		"default": {
			borderColor: hexToRgb("#000000"),
			borderSize: 4,
			backgroundColor: hexToRgb("#cccccc"),
			headerColor: hexToRgb("#aaaaaa"),
			padding: 2,
			margin: 0
		}
	};
	var isFullscreen = false;
	var originalDimensions;

	function hexToRgb(str) {
		if(str.charAt(0) === "#") {
			str = str.substr(1);
		}

		var r = parseInt(str.substr(0, 2), 16);
		var g = parseInt(str.substr(2, 2), 16);
		var b = parseInt(str.substr(4, 2), 16);

		return "rgb(" + r + "," + g + "," + b + ")";
	}

	/*
	* Draw the UI to the canvas
	*/
	function draw(p) {
		if(!p) {
			p = tree;
		}

		var children = p._children;
		var len = children.length;
		var child;
		for(var i = 0; i < len; ++i) {
			child = children[i];

			calculate(p, child);
			child.draw();
			draw(children[i]);
		}
	}
	
	/**
	* Evaluate an expression
	* Must seperate with spaces and use units
	*/
	function expr(str, p) {
		//if number, use that
		if(typeof str === "number") return str;
		var tokens = str.split(' ');
		var x, y;
		
		//evaluate the first number
		x = parseInt(tokens[0], 10);
		if(tokens[0].indexOf("%") !== -1) {
			x = p * (x / 100);
		}
		
		//if no expression
		if(tokens.length === 1) return x;
		
		//evaluate the second number
		y = parseInt(tokens[2], 10)
		if(tokens[2].indexOf("%") !== -1) {
			y = p * (y / 100);
		}
		
		switch(tokens[1]) {
			case "+": return x + y
			case "-": return x - y;
			case "*": return x * y;
			case "/": return x / y;
		}
	}

	function calculate(p, c) {
		var width, height;
		var x, y;

		//calculate width
		width = expr(c.width, p._actual.width) - (p.padding + c.borderSize) * 2;
		height = expr(c.height, p._actual.height) - (p.padding + c.borderSize) * 2;
		x = expr(c.x, p._actual.width) + p.padding + c.margin + p._actual.x + c.borderSize;
		y = expr(c.y, p._actual.height) + p.padding + c.margin + + p._actual.y + c.borderSize;

		c._actual = {
			x: x,
			y: y,
			width: width,
			height: height
		};

		c.calculate();
	}

	/**
	* A UI node in the display tree
	*/
	function node(opts) {
		//copy all properties
		for(var key in opts) {
			this[key] = opts[key];
		}

		if(!this.width) this.width = "100%";
		if(!this.height) this.height = "100%";
		if(!this.x) this.x = 0;
		if(!this.y) this.y = 0;

		//save the actual props for the root
		if(!tree) {
			//actual coords
			this._actual = {
				x: 0,
				y: 0,
				width: this.width,
				height: this.height
			};
		
		}

		//copy the theme properties
		var theme = themes[opts.theme || currentTheme];
		for(var key in theme) {
			if(this[key] === undefined)
				this[key] = theme[key];
		}

		//array of child nodes
		this._children = [];

		//if no parent, take the root
		if(!this.parent) {
			if(tree) tree.addChild(this);
		} else {
			this.parent.addChild(this);
		}
	}

	/*
	* Add functions to the node
	*/
	node.prototype = {
		addChild: function(n) {
			this._children.push(n);
			n.parent = this;
		},

		removeChild: function(n) {
			var child = this._children;
			var len = child.length;
			for(var i = 0; i < len; ++i) {
				if(child[i] === n) {
					child.splice(i, 1);
					n.parent = null;
					return;
				}
			}
		}
	};

	return {
		/**
		* Initialize UI.js
		* Pass in a string for the ID, a canvas object
		* or default to id of "canvas"
		*/
		init: function(cv) {
			if(cv) {
				if(typeof cv === "string") {
					canvas = document.getElementById(cv);
				} else {
					canvas = cv;
				}
			} else {
				canvas = document.getElementById("canvas");
			}

			ctx = canvas.getContext("2d");
			tree = new node({
				width: canvas.width,
				height: canvas.height,
				parent: null
			});
			
			//save the original dimensions
			originalDimensions = {
				width: canvas.width,
				height: canvas.height
			};
		},

		panel: function(opts) {
			opts.type = "panel";
			var n = new node(opts);
			n.draw = function(param) {
				ctx.save();
				
				//only draw a border when needed
				if(this.borderSize) {
					ctx.fillStyle = this.borderColor;
					ctx.fillRect(
						this._actual.x - this.borderSize,
						this._actual.y - this.borderSize,
						this._actual.width + this.borderSize * 2,
						this._actual.height + this.borderSize * 2
					);
				}
                
				ctx.fillStyle = this.backgroundColor;
				ctx.fillRect(
					this._actual.x,
					this._actual.y,
					this._actual.width,
					this._actual.height
				);

				ctx.restore();
			};

			n.calculate = function() {

			};

			return n;
		},

		debug: function() {
			console.log(tree, canvas, ctx, themes, currentTheme);
		},
		
		update: function() {
			console.log("RESIZE");
			if(isFullscreen) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				
				tree._actual.width = tree.width;
				tree._actual.height = tree.height;
			}
			
			UI.draw();
		},
		
		fullscreen: function(q) {
			if(q === undefined) {
				q = !isFullscreen;
			}
			
			if(q) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				isFullscreen = true;
				window.onresize = this.update;
			} else {
				tree.width = canvas.width = originalDimensions.width;
				tree.height = canvas.height = originalDimensions.height;
				isFullscreen = false;
				window.onresize = null;
			}
			
			//update the actual dims
			tree._actual.width = tree.width;
			tree._actual.height = tree.height;
			
			this.draw();
		},

		draw: draw
	};

})(window, window.document);
