"use strict";

describe("luga.validator", function(){

	it("Lives inside its own namespace", function(){
		expect(luga.validator).toBeDefined();
	});

	describe("Uses separated namespace for storing:", function(){
		it(".rules", function(){
			expect(luga.validator.rules).toBeDefined();
		});
		it(".patterns", function(){
			expect(luga.validator.patterns).toBeDefined();
		});
		it(".dateSpecs", function(){
			expect(luga.validator.dateSpecs).toBeDefined();
		});
		it(".handlers", function(){
			expect(luga.validator.handlers).toBeDefined();
		});
	});

	describe(".version", function(){
		it("Reports the current version number", function(){
			expect(luga.validator.version).toBeDefined();
		});
	});

});

describe("luga.validator.handlers", function(){

	it("Contains handlers for form validation", function(){
		expect(luga.validator.handlers).toBeDefined();
	});

	describe("luga.validator.handlers.errorAlert", function(){
		it("Display error messages inside alert", function(){
			expect(luga.validator.handlers.errorAlert).toBeDefined();
			expect(jQuery.isFunction(luga.validator.handlers.errorAlert)).toBeTruthy();
		});
	});

	describe("luga.validator.handlers.errorBox", function(){
		it("Display errors inside a box above the form", function(){
			expect(luga.validator.handlers.errorBox).toBeDefined();
			expect(jQuery.isFunction(luga.validator.handlers.errorBox)).toBeTruthy();
		});
	});

	describe("luga.validator.handlers.bootstrap", function(){
		it("Use Bootstrap validation states to display errors", function(){
			expect(luga.validator.handlers.bootstrap).toBeDefined();
			expect(jQuery.isFunction(luga.validator.handlers.bootstrap)).toBeTruthy();
		});
	});

});

describe("luga.validator.fieldValidatorFactory.getInstance()", function(){

	describe("Returns either:", function(){

		beforeEach(function(){
			loadFixtures("validator/FormValidator/generic.htm");
		});

		it("null if the passed HTML has no matching validator", function(){
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("<div>")})).toBeNull();
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("<input type='reset'>")})).toBeNull();
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("<fieldset>")})).toBeNull();
		});

		it("An instance of luga.validator.TextValidator", function(){
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("#age")}).constructor).toEqual(luga.validator.TextValidator);
		});

		it("An instance of luga.validator.CheckboxValidator", function(){
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("#boxNicole")}).constructor).toEqual(luga.validator.CheckboxValidator);
		});

		it("An instance of luga.validator.RadioValidator", function(){
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("#boxNicole")}).constructor).toEqual(luga.validator.CheckboxValidator);
		});

		it("An instance of luga.validator.SelectValidator", function(){
			expect(luga.validator.fieldValidatorFactory.getInstance({fieldNode: jQuery("#food")}).constructor).toEqual(luga.validator.SelectValidator);
		});

	});

});

describe("luga.validator.BaseFieldValidator is an abstract class", function(){

	it("That can't be invoked directly", function(){
		var textNode = jQuery('<input type="text" data-lugavalidator-required="true" disabled="disabled" data-lugavalidator-errorclass="invalid">');
		expect(function(){
			new luga.validator.BaseFieldValidator({
				fieldNode: textNode
			});
		}).toThrow();
	});

	it("Adds/remove error class and title attribute from the associated form field", function(){
		var fieldNode = jQuery('<input type="text" data-lugavalidator-required="true" data-lugavalidator-errorclass="invalid" data-lugavalidator-message="Invalid field!">');
		var fieldValidator = luga.validator.fieldValidatorFactory.getInstance({
			fieldNode: fieldNode
		});
		expect(fieldNode.hasClass("invalid")).toBeFalsy();
		fieldValidator.flagInvalid();
		expect(fieldNode.hasClass("invalid")).toBeTruthy();
		expect(fieldNode.attr("title")).toEqual("Invalid field!");
		fieldValidator.flagValid();
		expect(fieldNode.hasClass("invalid")).toBeFalsy();
		expect(fieldNode.attr("title")).toBeUndefined();
	});

	it("Handle disabled fields as always valid", function(){
		var fieldNode = jQuery('<input type="text" data-lugavalidator-required="true" disabled="disabled" data-lugavalidator-errorclass="invalid">');
		var fieldValidator = luga.validator.fieldValidatorFactory.getInstance({
			fieldNode: fieldNode
		});
		expect(fieldValidator.validate()).toBeFalsy();
		expect(fieldNode.hasClass("invalid")).toBeFalsy();
	});

	describe(".name", function(){

		describe("Either", function(){

			it("Defaults to an empty string", function(){
				var textValidator = luga.validator.fieldValidatorFactory.getInstance({
					fieldNode: jQuery("<input type='text'>")
				});
				expect(textValidator.name).toEqual("");
			});
			it("Matches the field's name attribute", function(){
				var textValidator = luga.validator.fieldValidatorFactory.getInstance({
					fieldNode: jQuery("<input type='text' name='myName' id='myId'>")
				});
				expect(textValidator.name).toEqual("myName");
			});
			it("Matches the field's id attribute", function(){
				var textValidator = luga.validator.fieldValidatorFactory.getInstance({
					fieldNode: jQuery("<input type='text' id='myId'>")
				});
				expect(textValidator.name).toEqual("myId");
			});

		});

	});

});

describe("luga.validator.BaseGroupValidator is an abstract class", function(){
	it("That can't be invoked directly", function(){
		var boxNode = jQuery('<input type="checkbox">');
		expect(function(){
			new luga.validator.BaseGroupValidator({
				fieldNode: boxNode
			});
		}).toThrow();
	});
});

