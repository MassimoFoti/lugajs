describe("luga.validator.api", function(){

	"use strict";

	it("Contains Validator's static APIs", function(){
		expect(luga.validator.api).toBeDefined();
	});

	describe(".validateForm()", function(){

		it("Allows to programmatically validate a form", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/basic.htm");

			expect(luga.validator.api.validateForm({formNode: document.getElementById("basic")})).toEqual(false);
			expect(document.getElementById("myName")).toHaveClass("invalid");

			document.getElementById("myName").value = "filled";
			expect(luga.validator.api.validateForm({formNode: document.getElementById("basic")})).toEqual(true);
			expect(document.getElementById("myName")).not.toHaveClass("invalid");

		});

		it("And returns a boolean", function(){
			jasmineFixtures.loadHTML("validator/FormValidator/basic.htm");
			expect(luga.validator.api.validateForm({formNode: document.getElementById("basic")})).toEqual(false);
		});

	});

	describe(".validateField()", function(){

		it("Thows an error if the field can't be validated", function(){

			expect(function(){
				luga.validator.api.validateField({fieldNode: jQuery("<input type='reset'>")});
			}).toThrow();

		});

		it("Allows to programmatically validate a field", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/basic.htm");

			expect(luga.validator.api.validateField({fieldNode: document.getElementById("myName")})).toEqual(false);
			expect(document.getElementById("myName")).toHaveClass("invalid");

			document.getElementById("myName").value = "filled";
			expect(luga.validator.api.validateField({
				fieldNode: document.getElementById("myName")
			})).toEqual(true);
			expect(document.getElementById("myName")).not.toHaveClass("invalid");

		});

		it("And returns a boolean", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/basic.htm");
			expect(luga.validator.api.validateField({fieldNode: document.getElementById("myName")})).toEqual(false);

		});

		it("Accept a custom error handler as an option", function(){
			jasmineFixtures.loadHTML("validator/FormValidator/basic.htm");

			formValidatorHandlers.customErrorHandler = function(){};
			spyOn(formValidatorHandlers, "customErrorHandler");

			var options = {
				fieldNode: document.getElementById("myName"),
				error: "formValidatorHandlers.customErrorHandler"
			};

			expect(luga.validator.api.validateField(options)).toEqual(false);
			expect(formValidatorHandlers.customErrorHandler).toHaveBeenCalled();

		});

	});

	describe(".validateFields()", function(){

		it("Allows to programmatically validate a collection of fields", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/generic.htm");
			var fields = jQuery("#name,#age");

			expect(luga.validator.api.validateFields({fields: fields})).toBe(false);
			expect(document.getElementById("name")).toHaveClass("invalid");

		});

		it("And return true if all fields are validated", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/generic.htm");
			var fields = jQuery("#name,#age");

			document.getElementById("age").value = "33";
			document.getElementById("name").value = "filled";
			expect(luga.validator.api.validateFields({fields: fields})).toBe(true);
			expect(document.getElementById("name")).not.toHaveClass("invalid");

		});

	});

	describe(".validateChildFields()", function(){

		it("Allows to programmatically validate all fields contained inside a given node", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/children.htm");

			var fieldset = document.getElementById("fieldGroup");
			expect(luga.validator.api.validateChildFields({rootNode: fieldset})).toBe(false);
			expect(document.getElementById("name")).toHaveClass("invalid");

		});

		it("And return true if all fields are validated", function(){

			jasmineFixtures.loadHTML("validator/FormValidator/generic.htm");
			var fieldset = document.getElementById("fieldGroup");

			document.getElementById("age").value = "33";
			document.getElementById("name").value = "filled";
			expect(luga.validator.api.validateChildFields({rootNode: fieldset})).toBe(true);
			expect(document.getElementById("name")).not.toHaveClass("invalid");

		});

	});

});
