"use strict";

describe("luga", function() {

	it("Requires jQuery in order to work", function() {
		expect(jQuery).toBeDefined();
	});

	it("Lives inside its own namespace", function() {
		expect(luga).toBeDefined();
	});

	describe(".namespace()", function() {

		it("Does not override existing namespaces", function() {
			var testRoot = {};
			testRoot.child = {};
			testRoot.child.grandChild = {};
			luga.namespace("child", testRoot);
			expect(testRoot.child.grandChild).toBeDefined();
		});

		it("By default uses window as root object", function() {
			luga.namespace("ciccio");
			expect(ciccio).toBeDefined();
		});

		it("But works on any arbitrary root object", function() {
			var testRoot = {};
			luga.namespace("child", testRoot);
			expect(testRoot.child).toBeDefined();
		});

	});

	describe(".extend()", function() {

		it("Offers a simple solution for inheritance among classes", function() {

			/* Class Person. */
			function Person(gender) {
				this.gender = gender;
				this.getGender = function() {
					return this.gender;
				};
			}
			/* Class Superstar */
			function Superstar(gender, name) {
				luga.extend(Person, this, arguments);
				this.gender = gender;
				this.name = name;
				this.getName = function() {
					return this.name;
				};
			}
			var nicole = new Superstar("female", "Nicole Kidman");

			expect(nicole.getGender()).toEqual("female");
			expect(nicole.getName()).toEqual("Nicole Kidman")
		});

	});

	describe(".merge()", function() {

		it("Merges the contents of two objects together into the first object", function() {
			var config = {letter: "a", number: 1};
			var params = {number: 2, symbol: "@"};
			luga.merge(config, params);
			expect(config).toEqual({letter: "a", number: 2, symbol: "@"});
		});

	});

});

describe("luga.utils stores generic, utilities and static methods", function() {

	it("Lives inside its own namespace", function() {
		expect(luga.utils).toBeDefined();
	});

	describe(".formatString()", function() {
		it("Given a string containing placeholders, assembles a new string", function() {
			expect(luga.utils.formatString("My name is {0} {1}", ["Ciccio", "Pasticcio"])).toEqual("My name is Ciccio Pasticcio");
			expect(luga.utils.formatString("This {0} is just a {0}", ["test"])).toEqual("This test is just a test");
			expect(luga.utils.formatString("My name is {firstName} {lastName}", {firstName: "Ciccio", lastName: "Pasticcio"})).toEqual("My name is Ciccio Pasticcio");
			expect(luga.utils.formatString("This {str} is just a {str}", { str:"test"} )).toEqual("This test is just a test");
		});
	});

	describe(".stringToFunction(). Given the name of a function as a string", function() {

		it("Returns the relevant function if it finds it inside the window/global scope", function() {
			window.myFunc = function(){};
			var result = luga.utils.stringToFunction("myFunc");
			expect(result).not.toBeNull();
			expect(jQuery.isFunction(result)).toBeTruthy();
		});

		it("Returns null if the function does not exist", function() {
			expect(luga.utils.stringToFunction("missing")).toBeNull();
		});

		it("Or if the variable exists, but it's not a function", function() {
			window.str = "ciao";
			expect(luga.utils.stringToFunction("str")).toBeNull();
		});

	});

	describe(".displayMessage()", function() {

		it("Displays a message box above a given node", function() {
			loadFixtures("validator/FormValidator/basic.htm");
			var formNode = jQuery("#basic");
			expect(boxNode).not.toExist();
			luga.utils.displayMessage(formNode, "Ciao");
			var boxNode = formNode.prev();
			expect(boxNode).toExist();
			expect(boxNode).toHaveText("Ciao");
			expect(boxNode).toHaveClass(luga.utils.CONST.CSS_CLASSES.MESSAGE);
		});

	});

	describe(".displayErrorMessage()", function() {

		it("Displays an error box above a given node", function() {
			loadFixtures("validator/FormValidator/basic.htm");
			var formNode = jQuery("#basic");
			expect(boxNode).not.toExist();
			luga.utils.displayErrorMessage(formNode, "Error");
			var boxNode = formNode.prev();
			expect(boxNode).toExist();
			expect(boxNode).toHaveText("Error");
			expect(boxNode).toHaveClass(luga.utils.CONST.CSS_CLASSES.ERROR_MESSAGE);
		});

	});

});