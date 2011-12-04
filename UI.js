(function(window, document, undefined) {

var UI = (function() {
	var canvas;
	var ctx;
	var tree;
	var currentTheme = "default";
	var themes = {
		"default": {
			borderColor: hexToRgb("#000000"),
			borderSize: 4,
			borderRadius: 0,
			backgroundColor: hexToRgb("#cccccc"),
			headerColor: hexToRgb("#aaaaaa"),
			padding: 2,
			margin: 0,
			fontSize: "12px",
			fontFamily: "Arial",
			fontColor: hexToRgb("#000000"),
			textBaseline: "top",
			lineHeight: 20
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
			child.draw(ctx);
			draw(children[i]);
		}
	}
	
	/**
	* Evaluate an expression
	* Must seperate with spaces and use units
	*/
	function expr(str, p, w, h) {
		//if number, use that
		if(typeof str === "number") return str;
		var tokens = str.split(' ');
		var a, b;
		
		//evaluate the first number
		a = parseInt(tokens[0], 10);
		if(tokens[0].indexOf("%") !== -1) {
			a = p * (a / 100);
		} else if(tokens[0] === "w" || tokens[0] === "width") {
			a = w;
		} else if(tokens[0] === "h" || tokens[0] === "height") {
			a = h;
		}
		
		//if no expression
		if(tokens.length === 1) return a;
		
		//evaluate the second number
		b = parseInt(tokens[2], 10)
		if(tokens[2].indexOf("%") !== -1) {
			b = p * (b / 100);
		} else if(tokens[2] === "w" || tokens[2] === "width") {
			b = w;
		} else if(tokens[2] === "h" || tokens[2] === "height") {
			b = h;
		}
		
		switch(tokens[1]) {
			case "+": return a + b
			case "-": return a - b;
			case "*": return a * b;
			case "/": return a / b;
		}
	}

	function calculate(p, c) {
		var width, height;
		var outerWidth, outerHeight;
		var minWidth, maxWidth, minHeight, maxHeight;
		var x, y;

		//calculate widths/heights
		outerWidth = expr(c.width, p._actual.width);
		width = outerWidth - (p.paddingLeft + p.paddingRight + c.borderSizeLeft + c.borderSizeRight);
		outerHeight = expr(c.height, p._actual.height);
		height = outerHeight - (p.paddingTop + p.paddingBottom + c.borderSizeTop + c.borderSizeBottom);
		
		//calculate the min/max width/heights
		if(c.minWidth !== undefined) minWidth = expr(c.minWidth, p._actual.width);
		if(c.minHeight !== undefined) minHeight = expr(c.minHeight, p._actual.height);
		if(c.maxWidth !== undefined) maxWidth = expr(c.maxWidth, p._actual.width);
		if(c.maxHeight !== undefined) maxHeight = expr(c.maxHeight, p._actual.height);
		
		//calculate the position
		x = expr(c.x, p._actual.width, outerWidth, outerHeight) + p.paddingLeft + c.marginLeft + p._actual.x + c.borderSizeLeft;
		y = expr(c.y, p._actual.height, outerWidth, outerHeight) + p.paddingTop + c.marginTop + p._actual.y + c.borderSizeTop;
		
		//make sure size within min and max
		if(width < (minWidth || 0)) width = minWidth || 0;
		if(height < (minHeight || 0)) height = minHeight || 0;
		if(maxWidth && width > maxWidth) width = maxWidth;
		if(maxHeight && height > maxHeight) height = maxHeight;

		c._actual = {
			x: ~~x,
			y: ~~y,
			width: ~~width,
			height: ~~height
		};

		if(c.calculate) c.calculate();
	}
	
	/**
	* Determine the actualy property values
	* from CSS style syntax
	* e.g. margin: 0 0 0 5; padding: 5; border-width: 5 10
	*/
	function parseProperty(node, prop) {
		var p = node[prop];
		if(p === undefined) return;
		
		var top, right, bottom, left;
		var tokens;
		
		//set all sides to same value
		if(typeof p === "number") {
			top = right = bottom = left = p;
		} else if(typeof p === "string") {
			//evaluate values seperated by spaces
			tokens = p.split(/\s+/);
			if(tokens.length === 1) {
				top = right = bottom = left = parseInt(tokens[0], 10);
			} else if(tokens.length === 2) {
				top = bottom = parseInt(tokens[0], 10);
				left = right = parseInt(tokens[1], 10);
			} else if(tokens.length === 4) {
				top = parseInt(tokens[0], 10);
				right = parseInt(tokens[1], 10);
				bottom = parseInt(tokens[2], 10);
				left = parseInt(tokens[3], 10);
			} else throw "Too many values in " + prop;
		
		} else throw "Incorrect value for " + prop + ": " + p.toString();
		
		node[prop + "Top"] = top;
		node[prop + "Right"] = right;
		node[prop + "Bottom"] = bottom;
		node[prop + "Left"] = left;
	}

	/**
	* A UI node in the display tree
	*/
	function node(opts) {
		if(!opts) return;
		
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
		
		parseProperty(this, "padding");
		parseProperty(this, "margin");
		parseProperty(this, "borderSize");
		parseProperty(this, "borderRadius");

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
		},
		
		roundRect: function(ctx, x, y, width, height, radiusTop, radiusRight, radiusBottom, radiusLeft, fill) {
			ctx.beginPath();
			
			ctx.moveTo(x + radiusTop, y);
			ctx.lineTo(x + width - radiusRight, y);
			ctx.quadraticCurveTo(x + width, y, x + width , y + radiusRight);
			
			ctx.lineTo(x + width , y + height - radiusBottom);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radiusBottom, y + height);
			
			ctx.lineTo(x + radiusLeft, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radiusLeft);
			
			ctx.lineTo(x, y + radiusTop);
			ctx.quadraticCurveTo(x, y, x + radiusTop, y);
			ctx.closePath();
			
			ctx.fillStyle = fill;
			ctx.fill();
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
		
		/**
		* Define a widget for the UI library
		*/
		e: function(name, def) {
			var c = function(opts) {
				opts.type = name;
				node.call(this, opts);
			};
			
			this[name] = function(opts) {
				return new c(opts);
			}
			
			c.prototype = new node;
			c.prototype.constructor = c;
			
			for(var key in def) {
				c.prototype[key] = def[key];
			}
		},

		debug: function() {
			console.log(tree, canvas, ctx, themes, currentTheme);
		},
		
		reflow: function() {
			if(isFullscreen) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				
				tree._actual.width = tree.width;
				tree._actual.height = tree.height;
			}
			
			UI.repaint();
		},
		
		fullscreen: function(q) {
			if(q === undefined) {
				q = !isFullscreen;
			}
			
			if(q) {
				tree.width = canvas.width = window.innerWidth;
				tree.height = canvas.height = window.innerHeight;
				isFullscreen = true;
				window.onresize = this.reflow;
			} else {
				tree.width = canvas.width = originalDimensions.width;
				tree.height = canvas.height = originalDimensions.height;
				isFullscreen = false;
				window.onresize = null;
			}
			
			//update the actual dims
			tree._actual.width = tree.width;
			tree._actual.height = tree.height;
			
			this.repaint();
		},

		repaint: draw
	};

})();
//end UI def
	
/**
* UI Panel Definition
*/
UI.e("panel", {
	draw: function(ctx) {
		ctx.save();
		
		//only draw a border when needed
		if(this.borderSize) {
			this.roundRect(
				ctx,
				this._actual.x - this.borderSizeLeft,
				this._actual.y - this.borderSizeTop,
				this._actual.width + this.borderSizeRight + this.borderSizeLeft,
				this._actual.height + this.borderSizeBottom + this.borderSizeTop,
				//short circuit logic to only add the size if the radius is > 0
				this.borderRadiusTop && this.borderRadiusTop + this.borderSizeTop,
				this.borderRadiusRight && this.borderRadiusRight + this.borderSizeRight,
				this.borderRadiusBottom && this.borderRadiusBottom + this.borderSizeBottom,
				this.borderRadiusLeft && this.borderRadiusLeft + this.borderSizeLeft,
				this.borderColor
			);
		}
		
		//main rect
		this.roundRect(
			ctx,
			this._actual.x,
			this._actual.y,
			this._actual.width,
			this._actual.height,
			this.borderRadiusTop,
			this.borderRadiusRight,
			this.borderRadiusBottom,
			this.borderRadiusLeft,
			this.backgroundColor
		);
		
		ctx.stroke();
		
		if(this.text) {
			var lines = this.text.split("\n");
			var len = lines.length;
			var line;
			
			ctx.font = this.fontSize + " " + this.fontFamily;
			ctx.fillStyle = this.fontColor;
			ctx.textBaseline = this.textBaseline;
			
			for(var i = 0; i < len; ++i) {
				
				ctx.fillText(
					lines[i],
					this._actual.x + this.paddingLeft + this.borderSizeLeft,
					(this._actual.y + this.paddingTop + this.borderSizeTop) + i * this.lineHeight
				);
			}
		}

		ctx.restore();
	}
});


	
window.UI = UI;
})(window, window.document);
