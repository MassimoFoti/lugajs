/*! 
Luga JS  2016-07-02T10:32:52.720Z
Copyright 2013-2016 Massimo Foti (massimo@massimocorner.com)
Licensed under the Apache License, Version 2.0 | http://www.apache.org/licenses/LICENSE-2.0
 */
/* globals ActiveXObject */

/* istanbul ignore if */
if(typeof(jQuery) === "undefined"){
	throw("Unable to find jQuery");
}
/* istanbul ignore else */
if(typeof(luga) === "undefined"){
	var luga = {};
}

(function(){
	"use strict";

	luga.version = "0.5.0";

	luga.CONST = {
		ERROR_MESSAGES: {
			NOTIFIER_ABSTRACT: "It's forbidden to use luga.Notifier directly, it must be used as a base class instead",
			INVALID_OBSERVER_PARAMETER: "addObserver(): observer parameter must be an object",
			INVALID_DATA_PARAMETER: "notifyObserver(): data parameter is required and must be an object"
		}
	};

	/**
	 * Creates namespaces to be used for scoping variables and classes so that they are not global.
	 * Specifying the last node of a namespace implicitly creates all other nodes.
	 * Based on Nicholas C. Zakas's code
	 * @param {string} ns           Namespace as string
	 * @param {object} rootObject   Optional root object. Default to window
	 */
	luga.namespace = function(ns, rootObject){
		var parts = ns.split(".");
		if(rootObject === undefined){
			rootObject = window;
		}
		for(var i = 0; i < parts.length; i++){
			if(rootObject[parts[i]] === undefined){
				rootObject[parts[i]] = {};
			}
			rootObject = rootObject[parts[i]];
		}
		return rootObject;
	};

	/**
	 * Offers a simple solution for inheritance among classes
	 *
	 * @param {function} baseFunc  Parent constructor function. Required
	 * @param {function} func      Child constructor function. Required
	 * @param {array}    args      An array of arguments that will be passed to the parent's constructor. Optional
	 */
	luga.extend = function(baseFunc, func, args){
		baseFunc.apply(func, args);
	};

	/**
	 * Given the name of a function as a string, return the relevant function, if any
	 * Returns undefined, if the reference has not been found
	 * Supports namespaces (if the fully qualified path is passed)
	 * @param {string} path            Fully qualified name of a function
	 * @returns {function|undefined}   The javascript reference to the function, undefined if nothing is fund or if it's not a function
	 */
	luga.lookupFunction = function(path){
		if(!path){
			return undefined;
		}
		var reference = luga.lookupProperty(window, path);
		if(jQuery.isFunction(reference) === true){
			return reference;
		}
		return undefined;
	};

	/**
	 * Given an object and a path, returns the property located at the given path
	 * If nothing exists at that location, returns undefined
	 * Supports unlimited nesting levels (if the fully qualified path is passed)
	 * @param {object} object  Target object
	 * @param {string} path    Dot-delimited string
	 * @returns {*|undefined}
	 */
	luga.lookupProperty = function(object, path){
		// Either of the two params is invalid
		if(!object || !path){
			return undefined;
		}
		// Property live at the first level
		if(object[path] !== undefined){
			return object[path];
		}
		var parts = path.split(".");
		while(parts.length > 0){
			var part = parts.shift();
			if(object[part] !== undefined){
				if(parts.length === 0){
					// We got it
					return object[part];
				}
				else{
					// Keep looping
					object = object[part];
				}
			}
		}
		return undefined;
	};

	/**
	 * Shallow-merge the contents of two objects together into the first object
	 * It wraps jQuery's extend to make names less ambiguous
	 *
	 * @param {object} target  An object that will receive the new properties
	 * @param {object} obj     An object containing additional properties to merge in
	 */
	luga.merge = function(target, obj){
		jQuery.extend(target, obj);
	};

	/**
	 * Given an object, a path and a value, set the property located at the given path to the given value
	 * If the path does not exists, it creates it
	 * @param {object} object  Target object
	 * @param {string} path    Fully qualified property name
	 * @param {*}      value
	 */
	luga.setProperty = function(object, path, value){
		var parts = path.split(".");
		while(parts.length > 0){
			var part = parts.shift();
			if(object[part] !== undefined){
				// Keep looping
				object = object[part];
			}
			else if(parts.length > 0){
				// Create the missing element and keep looping
				object[part] = {};
				object = object[part];
			}
			else{
				object[part] = value;
			}
		}
	};

	/**
	 * Provides the base functionality necessary to maintain a list of observers and send notifications to them.
	 * It's forbidden to use this class directly, it can only be used as a base class.
	 * The Notifier class does not define any notification messages, so it is up to the developer to define the notifications sent via the Notifier.
	 * @throws {Exception}
	 */
	luga.Notifier = function(){
		if(this.constructor === luga.Notifier){
			throw(luga.CONST.ERROR_MESSAGES.NOTIFIER_ABSTRACT);
		}
		this.observers = [];
		var prefix = "on";
		var suffix = "Handler";

		// Turns "complete" into "onComplete"
		var generateMethodName = function(eventName){
			var str = prefix;
			str += eventName.charAt(0).toUpperCase();
			str += eventName.substring(1);
			str += suffix;
			return str;
		};

		/**
		 * Adds an observer object to the list of observers.
		 * Observer objects should implement a method that matches a naming convention for the events they are interested in.
		 * For an event named "complete" they must implement a method named: "onCompleteHandler"
		 * The interface for this methods is as follows:
		 * observer.onCompleteHandler = function(data){};
		 * @param  {object} observer  Observer object
		 * @throws {Exception}
		 */
		this.addObserver = function(observer){
			if(jQuery.type(observer) !== "object"){
				throw(luga.CONST.ERROR_MESSAGES.INVALID_OBSERVER_PARAMETER);
			}
			this.observers.push(observer);
		};

		/**
		 * Sends a notification to all interested observers registered with the notifier.
		 *
		 * @method
		 * @param {string}  eventName  Name of the event
		 * @param {object}  data       Object containing data to be passed from the point of notification to all interested observers.
		 *                             If there is no relevant data to pass, use an empty object.
		 * @throws {Exception}
		 */
		this.notifyObservers = function(eventName, data){
			if(jQuery.type(data) !== "object"){
				throw(luga.CONST.ERROR_MESSAGES.INVALID_DATA_PARAMETER);
			}
			var method = generateMethodName(eventName);
			for(var i = 0; i < this.observers.length; i++){
				var observer = this.observers[i];
				if(observer[method] && jQuery.isFunction(observer[method])){
					observer[method](data);
				}
			}
		};

		/**
		 * Removes the given observer object.
		 *
		 * @method
		 * @param {Object} observer
		 */
		this.removeObserver = function(observer){
			for(var i = 0; i < this.observers.length; i++){
				if(this.observers[i] === observer){
					this.observers.splice(i, 1);
					break;
				}
			}
		};

	};

	/* DOM */

	luga.namespace("luga.dom.treeWalker");

	/**
	 * Static factory to create a cross-browser DOM TreeWalker
	 * https://developer.mozilla.org/en/docs/Web/API/TreeWalker
	 *
	 * @param {Node}         rootNode    Start node. Required
	 * @param {function}     filterFunc  Optional filter function. If specified only nodes matching the filter will be accepted
	 *                                   The function will be invoked with this signature: filterFunc(node). Must return true|false
	 * @returns {TreeWalker}
	 */
	luga.dom.treeWalker.getInstance = function(rootNode, filterFunc){

		var filter = {
			acceptNode: function(node){
				/* istanbul ignore else */
				if(filterFunc !== undefined){
					if(filterFunc(node) === false){
						return NodeFilter.FILTER_SKIP;
					}
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		};

		// http://stackoverflow.com/questions/5982648/recommendations-for-working-around-ie9-treewalker-filter-bug
		// A true W3C-compliant nodeFilter object isn't passed, and instead a "safe" one _based_ off of the real one.
		var safeFilter = filter.acceptNode;
		safeFilter.acceptNode = filter.acceptNode;
		return document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT, safeFilter, false);
	};

	/* Form */

	luga.namespace("luga.form");

	luga.form.CONST = {
		FIELD_SELECTOR: "input,select,textarea",
		FAKE_INPUT_TYPES: {
			fieldset: true,
			reset: true
		},
		MESSAGES: {
			MISSING_FORM: "Unable to load form"
		}
	};

	/**
	 * Returns a JavaScript object containing name/value pairs from fields contained inside a given root node
	 * Only fields considered successful are returned:
	 * http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.2
	 * Values of multiple checked checkboxes and multiple select are included as a single entry, with array value
	 *
	 * @param {jquery}   rootNode     jQuery object wrapping the root node
	 * @param {boolean}  demoronize   MS Word's special chars are replaced with plausible substitutes. Default to false
	 * @returns {object}              A JavaScript object containing name/value pairs
	 * @throws {Exception}
	 */
	luga.form.toHash = function(rootNode, demoronize){

		if(rootNode.length === 0){
			throw(luga.form.CONST.MESSAGES.MISSING_FORM);
		}

		var map = {};
		var fields = luga.form.utils.getChildFields(rootNode);
		for(var i = 0; i < fields.length; i++){
			if(luga.form.utils.isSuccessfulField(fields[i]) === true){
				var fieldName = jQuery(fields[i]).attr("name");
				var fieldValue = null;
				var fieldType = jQuery(fields[i]).prop("type");
				switch(fieldType){

					case "select-multiple":
						fieldValue = jQuery(fields[i]).val();
						break;

					case "checkbox":
					case "radio":
						if(jQuery(fields[i]).prop("checked") === true){
							fieldValue = jQuery(fields[i]).val();
						}
						break;

					default:
						fieldValue = jQuery(fields[i]).val();
				}

				if(fieldValue !== null){
					if(demoronize === true){
						fieldValue = luga.string.demoronize(fieldValue);
					}
					if(map[fieldName] === undefined){
						map[fieldName] = fieldValue;
					}
					else if(jQuery.isArray(map[fieldName]) === true){
						map[fieldName].push(fieldValue);
					}
					else{
						map[fieldName] = [map[fieldName], fieldValue];
					}
				}

			}
		}
		return map;
	};

	/**
	 * Given a form tag or another element wrapping input fields, serialize their value into JSON data
	 * If fields names contains dots, their are handled as nested properties
	 * Only fields considered successful are returned:
	 * http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.2
	 * @param {jquery} rootNode  jQuery object wrapping the form fields
	 * @returns {json}
	 */
	luga.form.toJson = function(rootNode){
		var flatData = luga.form.toHash(rootNode);
		var jsonData = {};
		for(var x in flatData){
			luga.setProperty(jsonData, x, flatData[x]);
		}
		return jsonData;
	};

	/**
	 * Returns a URI encoded string of name/value pairs from fields contained inside a given root node
	 * Only fields considered successful are returned:
	 * http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.2
	 *
	 * @param {jquery}   rootNode     jQuery object wrapping the root node
	 * @param {boolean}  demoronize   If set to true, MS Word's special chars are replaced with plausible substitutes. Default to false
	 * @returns {string}               A URI encoded string
	 * @throws {Exception}
	 */
	luga.form.toQueryString = function(rootNode, demoronize){

		if(rootNode.length === 0){
			throw(luga.form.CONST.MESSAGES.MISSING_FORM);
		}

		var str = "";
		var fields = luga.form.utils.getChildFields(rootNode);
		for(var i = 0; i < fields.length; i++){
			if(luga.form.utils.isSuccessfulField(fields[i]) === true){
				var fieldName = jQuery(fields[i]).attr("name");
				var fieldValue = jQuery(fields[i]).val();
				var fieldType = jQuery(fields[i]).prop("type");
				switch(fieldType){

					case "select-multiple":
						for(var j = 0; j < fieldValue.length; j++){
							str = appendQueryString(str, fieldName, fieldValue[j], demoronize);
						}
						break;

					case "checkbox":
					case "radio":
						if(jQuery(fields[i]).prop("checked") === true){
							str = appendQueryString(str, fieldName, fieldValue, demoronize);
						}
						break;

					default:
						str = appendQueryString(str, fieldName, fieldValue, demoronize);
				}
			}
		}
		return str;
	};

	var appendQueryString = function(str, fieldName, fieldValue, demoronize){
		if(str !== ""){
			str += "&";
		}
		str += encodeURIComponent(fieldName);
		str += "=";
		if(demoronize === true){
			str += encodeURIComponent(luga.string.demoronize(fieldValue));
		}
		else{
			str += encodeURIComponent(fieldValue);
		}
		return str;
	};

	luga.namespace("luga.form.utils");

	/**
	 * Returns true if the given field is successful, false otherwise
	 * http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.2
	 *
	 * @param {jquery}  fieldNode
	 * @returns {boolean}
	 */
	luga.form.utils.isSuccessfulField = function(fieldNode){
		if(luga.form.utils.isInputField(fieldNode) === false){
			return false;
		}
		if(jQuery(fieldNode).prop("disabled") === true){
			return false;
		}
		if(jQuery(fieldNode).attr("name") === undefined){
			return false;
		}
		return true;
	};

	/**
	 * Returns true if the passed node is a form field that we care about
	 *
	 * @param {jquery}  fieldNode
	 * @returns {boolean}
	 */
	luga.form.utils.isInputField = function(fieldNode){
		if(jQuery(fieldNode).prop("type") === undefined){
			return false;
		}
		// It belongs to the kind of nodes that are considered form fields, but we don't care about
		if(luga.form.CONST.FAKE_INPUT_TYPES[jQuery(fieldNode).prop("type")] === true){
			return false;
		}
		return true;
	};

	/**
	 * Extracts group of fields that share the same name from a given root node
	 * Or the whole document if the second argument is not passed
	 *
	 * @param {string}  name       Name of the field. Mandatory
	 * @param {jquery}  rootNode   Root node, optional, default to document
	 * @returns {jquery}
	 */
	luga.form.utils.getFieldGroup = function(name, rootNode){
		var selector = "input[name=" + name + "]";
		return jQuery(selector, rootNode);
	};

	/**
	 * Returns an array of input fields contained inside a given root node
	 *
	 * @param {jquery}  rootNode   Root node
	 * @returns {Array.<jquery>}
	 */
	luga.form.utils.getChildFields = function(rootNode){
		var fields = [];
		jQuery(rootNode).find(luga.form.CONST.FIELD_SELECTOR).each(function(index, item){
			if(luga.form.utils.isInputField(item)){
				fields.push(item);
			}
		});

		return fields;
	};

	/* Utilities */

	luga.namespace("luga.string");


	/**
	 * Replace MS Word's non-ISO characters with plausible substitutes
	 *
	 * @param {string} str   String containing MS Word's garbage
	 * @returns {string}      The de-moronized string
	 */
	luga.string.demoronize = function(str){
		str = str.replace(new RegExp(String.fromCharCode(710), "g"), "^");
		str = str.replace(new RegExp(String.fromCharCode(732), "g"), "~");
		// Evil "smarty" quotes
		str = str.replace(new RegExp(String.fromCharCode(8216), "g"), "'");
		str = str.replace(new RegExp(String.fromCharCode(8217), "g"), "'");
		str = str.replace(new RegExp(String.fromCharCode(8220), "g"), "\"");
		str = str.replace(new RegExp(String.fromCharCode(8221), "g"), "\"");
		// More garbage
		str = str.replace(new RegExp(String.fromCharCode(8211), "g"), "-");
		str = str.replace(new RegExp(String.fromCharCode(8212), "g"), "--");
		str = str.replace(new RegExp(String.fromCharCode(8218), "g"), ",");
		str = str.replace(new RegExp(String.fromCharCode(8222), "g"), ",,");
		str = str.replace(new RegExp(String.fromCharCode(8226), "g"), "*");
		str = str.replace(new RegExp(String.fromCharCode(8230), "g"), "...");
		return str;
	};

	/**
	 * Given a string containing placeholders, it assembles a new string
	 * replacing the placeholders with the strings contained inside the second argument (either an object or an array)
	 * Loosely based on the .NET implementation: http://msdn.microsoft.com/en-us/library/system.string.format.aspx
	 *
	 * Example passing strings inside an array:
	 * luga.string.format("My name is {0} {1}", ["Ciccio", "Pasticcio"]);
	 * => "My name is Ciccio Pasticcio"
	 *
	 * Example passing strings inside an object:
	 * luga.string.format("My name is {firstName} {lastName}", {firstName: "Ciccio", lastName: "Pasticcio"});
	 * => "My name is Ciccio Pasticcio"
	 *
	 * @param  {string}  str                   String containing placeholders
	 * @param  {object|array.<string>} args    Either an array of strings or an objects containing name/value pairs in string format
	 * @returns {string} The newly assembled string
	 */
	luga.string.format = function(str, args){
		var pattern = null;
		if($.isArray(args) === true){
			for(var i = 0; i < args.length; i++){
				pattern = new RegExp("\\{" + i + "\\}", "g");
				str = str.replace(pattern, args[i]);
			}
		}
		if($.isPlainObject(args) === true){
			for(var x in args){
				pattern = new RegExp("\\{" + x + "\\}", "g");
				str = str.replace(pattern, args[x]);
			}
		}
		return str;
	};

	/**
	 * Given a string in querystring format, return a JavaScript object containing name/value pairs
	 * @param {string} str  The querystring
	 * @returns {object}
	 */
	luga.string.queryToHash = function(str){
		var map = {};
		if(str.charAt(0) === "?"){
			str = str.substring(1);
		}
		if(str.length === 0){
			return map;
		}
		var parts = str.split("&");

		for(var i = 0; i < parts.length; i++){
			var tokens = parts[i].split("=");
			var fieldName = decodeURIComponent(tokens[0]);
			var fieldValue = "";
			if(tokens.length === 2){
				fieldValue = decodeURIComponent(tokens[1]);
			}
			if(map[fieldName] === undefined){
				map[fieldName] = fieldValue;
			}
			else if(jQuery.isArray(map[fieldName]) === true){
				map[fieldName].push(fieldValue);
			}
			else{
				map[fieldName] = [map[fieldName], fieldValue];
			}
		}
		return map;
	};

	var propertyPattern = new RegExp("\\{([^}]*)}", "g");

	/**
	 * Given a string containing placeholders in {key} format, it assembles a new string
	 * replacing the placeholders with the strings contained inside the second argument keys
	 * Unlike luga.string.format, placeholders can match nested properties too. But it's slower
	 *
	 * Example:
	 * luga.string.format("My name is {firstName} {lastName}", {firstName: "Ciccio", lastName: "Pasticcio"});
	 * => "My name is Ciccio Pasticcio"
	 *
	 * Example with nested properties:
	 * var nestedObj = { type: "people", person: { firstName: "Ciccio", lastName: "Pasticcio" } };
	 * luga.string.replaceProperty("My name is {person.firstName} {person.lastName}", nestedObj)
	 * => "My name is Ciccio Pasticcio"
	 *
	 * @param   {string} str   String containing placeholders
	 * @param   {object} obj   An objects containing name/value pairs in string format
	 * @returns {string} The newly assembled string
	 */
	luga.string.replaceProperty = function(str, obj){
		if($.isPlainObject(obj) === true){
			var results;
			while((results = propertyPattern.exec(str)) !== null){
				var property = luga.lookupProperty(obj, results[1]);
				if(property !== undefined){
					var pattern = new RegExp(results[0], "g");
					str = str.replace(pattern, property);
					// Keep searching
					propertyPattern.test(str);
				}
			}
		}
		return str;
	};

	luga.namespace("luga.utils");

	luga.utils.CONST = {
		CSS_CLASSES: {
			MESSAGE: "luga-message",
			ERROR_MESSAGE: "luga-error-message"
		},
		MSG_BOX_ID: "lugaMessageBox"
	};

	/**
	 * Private helper function
	 * Generate node's id
	 */
	var generateBoxId = function(node){
		var boxId = luga.utils.CONST.MSG_BOX_ID;
		if(node.attr("id") === undefined){
			boxId += node.attr("id");
		}
		else if(node.attr("name") !== undefined){
			boxId += node.attr("name");
		}
		return boxId;
	};

	/**
	 * Remove a message box (if any) associated with a given node
	 * @param {jquery}  node   Target node
	 */
	luga.utils.removeDisplayBox = function(node){
		var boxId = generateBoxId(jQuery(node));
		var oldBox = jQuery("#" + boxId);
		// If an error display is already there, get rid of it
		if(oldBox.length > 0){
			oldBox.remove();
		}
	};

	/**
	 * Display a message box above a given node
	 * @param {jquery}  node   Target node
	 * @param {string}  html   HTML/Text code to inject
	 */
	luga.utils.displayMessage = function(node, html){
		return luga.utils.displayBox(node, html, luga.utils.CONST.CSS_CLASSES.MESSAGE);
	};

	/**
	 * Display an error box above a given node
	 * @param {jquery}  node   Target node
	 * @param {string}  html   HTML/Text code to inject
	 */
	luga.utils.displayErrorMessage = function(node, html){
		return luga.utils.displayBox(node, html, luga.utils.CONST.CSS_CLASSES.ERROR_MESSAGE);
	};

	/**
	 * Display a box with a message associated with a given node
	 * Overwrite this method if you want to change the way luga.utils.displayMessage and luga.utils.displayErrorMessage behaves
	 * @param {jquery}  node      Target node
	 * @param {string}  html      HTML/Text code to inject
	 * @param {string}  cssClass  CSS class attached to the box. Default to "luga_message"
	 */
	luga.utils.displayBox = function(node, html, cssClass){
		if(cssClass === undefined){
			cssClass = luga.utils.CONST.CSS_CLASSES.MESSAGE;
		}
		var boxId = generateBoxId(jQuery(node));
		var box = jQuery("<div></div>");
		box.attr("id", boxId);
		box.addClass(cssClass);
		box.html(html);
		var oldBox = jQuery("#" + boxId);
		// If a box display is already there, replace it, if not, we create one from scratch
		if(oldBox.length > 0){
			oldBox.replaceWith(box);
		}
		else{
			jQuery(node).before(box);
		}
		return box;
	};

	/* XML */

	luga.namespace("luga.xml");

	luga.xml.MIME_TYPE = "application/xml";
	luga.xml.ATTRIBUTE_PREFIX = "_";
	luga.xml.DOM_ACTIVEX_NAME = "MSXML2.DOMDocument.4.0";

	/**
	 * Given a DOM node, evaluate an XPath expression against it
	 * Results are returned as an array of nodes. An empty array is returned in case there is no match
	 * @param {Node} node
	 * @param {string} path
	 * @returns {Array<Node>}
	 */
	luga.xml.evaluateXPath = function(node, path){
		var retArray = [];
		/* istanbul ignore if IE-only */
		if(window.ActiveXObject !== undefined){
			var selectedNodes = node.selectNodes(path);
			// Extract the nodes out of the nodeList returned by selectNodes and put them into an array
			// We could directly use the nodeList returned by selectNodes, but this would cause inconsistencies across browsers
			for(var i = 0; i < selectedNodes.length; i++){
				retArray.push(selectedNodes[i]);
			}
			return retArray;
		}
		else{
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(path, node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			var currentNode = result.iterateNext();
			// Iterate and populate the array
			while(currentNode !== null){
				retArray.push(currentNode);
				currentNode = result.iterateNext();
			}
			return retArray;
		}
	};

	/**
	 * Convert an XML node into a JavaScript object
	 * @param {Node} node
	 * @returns {object}
	 */
	luga.xml.nodeToHash = function(node){
		var obj = {};
		attributesToProperties(node, obj);
		childrenToProperties(node, obj);
		return obj;
	};

	/**
	 * Map attributes to properties
	 * @param {Node}   node
	 * @param {object} obj
	 */
	function attributesToProperties(node, obj){
		if((node.attributes === null) || (node.attributes === undefined)){
			return;
		}
		for(var i = 0; i < node.attributes.length; i++){
			var attr = node.attributes[i];
			obj[luga.xml.ATTRIBUTE_PREFIX + attr.name] = attr.value;
		}
	}

	/**
	 * Map child nodes to properties
	 * @param {Node}   node
	 * @param {object} obj
	 */
	function childrenToProperties(node, obj){
		for(var i = 0; i < node.childNodes.length; i++){
			var child = node.childNodes[i];

			if(child.nodeType === 1 /* Node.ELEMENT_NODE */){
				var isArray = false;
				var tagName = child.nodeName;

				if(obj[tagName] !== undefined){
					// If the property exists already, turn it into an array
					if(obj[tagName].constructor !== Array){
						var curValue = obj[tagName];
						obj[tagName] = [];
						obj[tagName].push(curValue);
					}
					isArray = true;
				}

				if(nodeHasText(child) === true){
					// This may potentially override an existing property
					obj[child.nodeName] = getTextValue(child);
				}
				else{
					var childObj = luga.xml.nodeToHash(child);
					if(isArray === true){
						obj[tagName].push(childObj);
					}
					else{
						obj[tagName] = childObj;
					}
				}
			}
		}
	}

	/**
	 * Extract text out of a TEXT or CDATA node
	 * @param {Node} node
	 * @returns {string}
	 */
	function getTextValue(node){
		var child = node.childNodes[0];
		/* istanbul ignore else */
		if((child.nodeType === 3) /* TEXT_NODE */ || (child.nodeType === 4) /* CDATA_SECTION_NODE */){
			return child.data;
		}
	}

	/**
	 * Return true if a node contains value, false otherwise
	 * @param {Node}   node
	 * @returns {boolean}
	 */
	function nodeHasText(node){
		var child = node.childNodes[0];
		if((child !== null) && (child.nextSibling === null) && (child.nodeType === 3 /* Node.TEXT_NODE */ || child.nodeType === 4 /* CDATA_SECTION_NODE */)){
			return true;
		}
		return false;
	}

	/**
	 * Serialize a DOM node into a string
	 * @param {Node}   node
	 * @returns {string}
	 */
	luga.xml.nodeToString = function(node){
		/* istanbul ignore if IE-only */
		if(window.ActiveXObject !== undefined){
			return node.xml;
		}
		else{
			var serializer = new XMLSerializer();
			return serializer.serializeToString(node, luga.xml.MIME_TYPE);
		}
	}

	/**
	 * Create a DOM Document out of a string
	 * @param {string} xmlStr
	 * @returns {Document}
	 */
	luga.xml.parseFromString = function(xmlStr){
		var xmlParser;
		/* istanbul ignore if IE-only */
		if(window.ActiveXObject !== undefined){
			var xmlDOMObj = new ActiveXObject(luga.xml.DOM_ACTIVEX_NAME);
			xmlDOMObj.async = false;
			xmlDOMObj.loadXML(xmlStr);
			return xmlDOMObj;
		}
		else{
			xmlParser = new DOMParser();
			var domDoc = xmlParser.parseFromString(xmlStr, luga.xml.MIME_TYPE);
			return domDoc;
		}
	};


}());
/* globals alert */

/* istanbul ignore if */
if(typeof(luga) === "undefined"){
	throw("Unable to find Luga JS Core");
}

(function(){
	"use strict";

	luga.namespace("luga.ajaxform");
	luga.ajaxform.version = "0.7.5";

	/* Success and error handlers */
	luga.namespace("luga.ajaxform.handlers");

	/**
	 * Replace form with message
	 *
	 * @param {string}   msg          Message to display in the GUI
	 * @param {jquery}   formNode     jQuery object wrapping the form
	 * @param {string}   textStatus   HTTP status
	 * @param {object}   jqXHR        jQuery wrapper around XMLHttpRequest
	 */
	luga.ajaxform.handlers.replaceForm = function(msg, formNode, textStatus, jqXHR){
		jQuery(formNode).empty();
		jQuery(formNode).html(msg);
	};

	/**
	 * Display error message inside alert
	 *
	 * @param {string}   msg          Message to display in the GUI
	 * @param {jquery}   formNode     jQuery object wrapping the form
	 * @param {string}   textStatus   HTTP status
	 * @param {string}   errorThrown  Error message from jQuery
	 * @param {object}   jqXHR        jQuery wrapper around XMLHttpRequest
	 */
	luga.ajaxform.handlers.errorAlert = function(msg, formNode, textStatus, errorThrown, jqXHR){
		alert(msg);
	};

	/**
	 * Display errors inside a box above the form
	 *
	 * @param {string}   msg          Message to display in the GUI
	 * @param {jquery}   formNode     jQuery object wrapping the form
	 * @param {string}   textStatus   HTTP status
	 * @param {string}   errorThrown  Error message from jQuery
	 * @param {object}   jqXHR        jQuery wrapper around XMLHttpRequest
	 */
	luga.ajaxform.handlers.errorBox = function(msg, formNode, textStatus, errorThrown, jqXHR){
		// Clean-up any existing box
		luga.utils.removeDisplayBox(formNode);
		luga.utils.displayErrorMessage(formNode, msg);
	};

	/**
	 * Utility function to be used as after handler by Luga Validator
	 *
	 * @param {jquery}       formNode  jQuery object wrapping the form
	 * @param {jquery.Event} event     jQuery object wrapping the submit event
	 */
	luga.ajaxform.handlers.afterValidation = function(formNode, event){
		event.preventDefault();
		var sender = new luga.ajaxform.Sender({
			formNode: formNode
		});
		sender.send();
	};

	luga.ajaxform.CONST = {
		FORM_SELECTOR: "form[data-lugajax-form='true']",
		DEFAULT_METHOD: "GET",
		DEFAULT_TIME_OUT: 30000, // ms
		CUSTOM_ATTRIBUTES: {
			AJAX: "data-lugajax-form",
			ACTION: "data-lugajax-action",
			METHOD: "data-lugajax-method",
			TIME_OUT: "data-lugajax-timeout",
			SUCCESS: "data-lugajax-success",
			SUCCESS_MSG: "data-lugajax-successmsg",
			ERROR: "data-lugajax-error",
			ERROR_MSG: "data-lugajax-errormsg",
			BEFORE: "data-lugajax-before",
			AFTER: "data-lugajax-after",
			HEADERS: "data-lugajax-headers"
		},
		MESSAGES: {
			SUCCESS: "Thanks for submitting the form",
			ERROR: "Failed to submit the form",
			MISSING_FORM: "luga.ajaxform was unable to load form",
			MISSING_FUNCTION: "luga.ajaxform was unable to find a function named: {0}"
		},
		HANDLERS: {
			SUCCESS: "luga.ajaxform.handlers.replaceForm",
			ERROR: "luga.ajaxform.handlers.errorAlert"
		}
	};

	/**
	 * @typedef {object} luga.ajaxform.Sender.options
	 *
	 * @property {jquery} formNode     Either a jQuery object wrapping the form or the naked DOM object. Required
	 * @property {string} action       URL to where the form will be send. Default to the current URL
	 * @property {string} method       HTTP method to be used. Default to GET
	 * @property {number} timeout      Timeout to be used during the HTTP call (milliseconds). Default to 30000
	 * @property {string} success      Name of the function to be invoked if the form is successfully submitted. Default to luga.ajaxform.handlers.replaceForm
	 * @property {string} error        Name of the function to be invoked if the HTTP call failed. Default to luga.ajaxform.handlers.errorAlert
	 * @property {string} successmsg   Message that will be displayed to the user if the form is successfully submitted. Default to "Thanks for submitting the form"
	 * @property {string} errormsg     Message that will be displayed to the user if the HTTP call failed. Default to "Failed to submit the form"
	 * @property {string} before       Name of the function to be invoked before the form is send. Default to null
	 * @property {string} after        Name of the function to be invoked after the form is send. Default to null
	 * @property {object} headers      A set of name/value pairs to be used as custom HTTP headers. Available only with JavaScript API
	 */

	/**
	 * Form handler. Invoke its sender() method to serialize the form and send its contents using XHR
	 * @param options {luga.ajaxform.Sender.options}
	 * @constructor
	 * @throws {Exception}
	 */
	luga.ajaxform.Sender = function(options){
		// Ensure it's a jQuery object
		options.formNode = jQuery(options.formNode);
		this.config = {
			formNode: null, // Required
			// Either: form attribute, custom attribute, incoming option or current URL
			action: options.formNode.attr("action") || options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.ACTION) || document.location.href,
			// Either: form attribute, custom attribute, incoming option or default
			method: options.formNode.attr("method") || options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.METHOD) || luga.ajaxform.CONST.DEFAULT_METHOD,
			// Either: custom attribute, incoming option or default
			timeout: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.TIME_OUT) || luga.ajaxform.CONST.DEFAULT_TIME_OUT,
			success: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.SUCCESS) || luga.ajaxform.CONST.HANDLERS.SUCCESS,
			error: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.ERROR) || luga.ajaxform.CONST.HANDLERS.ERROR,
			successmsg: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.SUCCESS_MSG) || luga.ajaxform.CONST.MESSAGES.SUCCESS,
			errormsg: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.ERROR_MSG) || luga.ajaxform.CONST.MESSAGES.ERROR,
			// Either: custom attribute, incoming option or null
			before: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.BEFORE) || null,
			after: options.formNode.attr(luga.ajaxform.CONST.CUSTOM_ATTRIBUTES.AFTER) || null,
			headers: null
		};
		luga.merge(this.config, options);
		this.config.timeout = parseInt(this.config.timeout, 10);
		var self = this;

		if(self.config.formNode.length === 0){
			throw(luga.ajaxform.CONST.MESSAGES.MISSING_FORM);
		}

		/**
		 * @throws {Exception}
		 */
		var handleAfter = function(){
			/* istanbul ignore else */
			if(self.config.after !== null){
				var callBack = luga.lookupFunction(self.config.after);
				if(callBack === undefined){
					throw(luga.string.format(luga.ajaxform.CONST.MESSAGES.MISSING_FUNCTION, [self.config.after]));
				}
				callBack.apply(null, [self.config.formNode]);
			}
		};

		/**
		 * @throws {Exception}
		 */
		var handleBefore = function(){
			/* istanbul ignore else */
			if(self.config.before !== null){
				var callBack = luga.lookupFunction(self.config.before);
				if(callBack === undefined){
					throw(luga.string.format(luga.ajaxform.CONST.MESSAGES.MISSING_FUNCTION, [self.config.before]));
				}
				callBack.apply(null, [self.config.formNode]);
			}
		};

		/**
		 * @throws {Exception}
		 */
		var handleError = function(textStatus, jqXHR, errorThrown){
			var callBack = luga.lookupFunction(self.config.error);
			if(callBack === undefined){
				throw(luga.string.format(luga.ajaxform.CONST.MESSAGES.MISSING_FUNCTION, [self.config.error]));
			}
			callBack.apply(null, [self.config.errormsg, self.config.formNode, textStatus, errorThrown, jqXHR]);
		};

		/**
		 * @throws {Exception}
		 */
		var handleSuccess = function(textStatus, jqXHR){
			var callBack = luga.lookupFunction(self.config.success);
			if(callBack === undefined){
				throw(luga.string.format(luga.ajaxform.CONST.MESSAGES.MISSING_FUNCTION, [self.config.success]));
			}
			callBack.apply(null, [self.config.successmsg, self.config.formNode, textStatus, jqXHR]);
		};

		/**
		 * Perform the following actions:
		 * 1) Invoke the before handler, if any
		 * 2) Make the HTTP call, sending along the serialized form's content
		 * 3) Invoke either the success or error handler
		 * 4) Invoke the after handler, if any
		 */
		this.send = function(){

			var formData = luga.form.toQueryString(self.config.formNode, true);

			if(self.config.before !== null){
				handleBefore();
			}

			jQuery.ajax({
				data: formData,
				error: function(jqXHR, textStatus, errorThrown){
					handleError(textStatus, jqXHR, errorThrown);
				},
				method: self.config.method,
				headers: self.config.headers,
				success: function(response, textStatus, jqXHR){
					handleSuccess(textStatus, jqXHR);
				},
				timeout: self.config.timeout,
				url: self.config.action
			});

			if(self.config.after !== null){
				handleAfter();
			}

		};

		/*
		 AS above, just send  data as raw JSON
		 */
		this.sendJson = function(){

			var formData = luga.form.toJson(self.config.formNode, true);

			if(self.config.before !== null){
				handleBefore();
			}

			jQuery.ajax({
				contentType: "application/json",
				data: JSON.stringify(formData),
				error: function(jqXHR, textStatus, errorThrown){
					handleError(textStatus, jqXHR, errorThrown);
				},
				method: self.config.method,
				headers: self.config.headers,
				success: function(response, textStatus, jqXHR){
					handleSuccess(textStatus, jqXHR);
				},
				timeout: self.config.timeout,
				url: self.config.action
			});

			if(self.config.after !== null){
				handleAfter();
			}

		};


	};

	/**
	 * Attach form handlers to onSubmit events
	 */
	luga.ajaxform.initForms = function(){
		jQuery(luga.ajaxform.CONST.FORM_SELECTOR).each(function(index, item){
			var formNode = jQuery(item);
			formNode.submit(function(event){
				event.preventDefault();
				var formHandler = new luga.ajaxform.Sender({
					formNode: formNode
				});
				formHandler.send();
			});
		});
	};

	jQuery(document).ready(function(){
		luga.ajaxform.initForms();
	});

}());
/* istanbul ignore if */
if(typeof(luga) === "undefined"){
	throw("Unable to find Luga JS Core");
}

(function(){
	"use strict";

	luga.namespace("luga.csi");

	luga.csi.version = "1.1.2";

	luga.csi.CONST = {
		NODE_SELECTOR: "div[data-lugacsi]",
		URL_ATTRIBUTE: "data-lugacsi",
		AFTER_ATTRIBUTE: "data-lugacsi-after",
		MESSAGES: {
			FILE_NOT_FOUND: "luga.csi failed to retrieve text from: {0}"
		}
	};

	/**
	 * @typedef {object} luga.csi.Include.options
	 *
	 * @property {jquery}   rootNode     Root node for widget (DOM reference). Required
	 * @property {string}   url          Url to be included. Optional. Default to the value of the "data-lugacsi" attribute inside rootNode
	 * @property {function} success      Function that will be invoked once the url is successfully fetched. Optional, default to the internal "onSuccess" method
	 * @property {function} after        Function that will be invoked once the include is successfully performed.
	 *                                   It will be called with the handler(rootNode, url, response) signature. Optional, it can be set using the "data-lugacsi-after" attribute
	 * @property {function} error        Function that will be invoked if the url request fails. Optional, default to the internal "onError" method
	 * @property {int}      xhrTimeout   Timeout for XHR call (ms). Optional. Default to 5000 ms
	 */

	/**
	 * Client-side Include widget
	 *
	 * @param {luga.csi.Include.options} options
	 * @constructor
	 */
	luga.csi.Include = function(options){

		var onSuccess = function(response, textStatus, jqXHR){
			jQuery(config.rootNode).html(response);
		};

		/**
		 * @param {object}   jqXHR        jQuery wrapper around XMLHttpRequest
		 * @param {string}   textStatus   HTTP status
		 * @param {string}   errorThrown
		 * @throws {Exception}
		 */
		var onError = function(qXHR, textStatus, errorThrown){
			throw(luga.string.format(luga.csi.CONST.MESSAGES.FILE_NOT_FOUND, [config.url]));
		};

		var config = {
			url: jQuery(options.rootNode).attr(luga.csi.CONST.URL_ATTRIBUTE),
			after: jQuery(options.rootNode).attr(luga.csi.CONST.AFTER_ATTRIBUTE),
			success: onSuccess,
			error: onError,
			xhrTimeout: 5000
		};
		luga.merge(config, options);

		this.load = function(){
			jQuery.ajax({
				url: config.url,
				timeout: config.XHR_TIMEOUT,
				success: function(response, textStatus, jqXHR){
					config.success.apply(null, [response, textStatus, jqXHR]);
					var afterHandler = luga.lookupFunction(config.after);
					if(afterHandler !== undefined){
						afterHandler.apply(null, [config.rootNode, config.url, response]);
					}
				},
				error: function(jqXHR, textStatus, errorThrown){
					config.error.apply(null, [jqXHR, textStatus, errorThrown]);
				}
			});
		};

	};

	/**
	 * Invoke this to programmatically load CSI inside the current document
	 */
	luga.csi.loadIncludes = function(){
		jQuery(luga.csi.CONST.NODE_SELECTOR).each(function(index, item){
			var includeObj = new luga.csi.Include({rootNode: item});
			includeObj.load();
		});
	};

	jQuery(document).ready(function(){
		luga.csi.loadIncludes();
	});

}());
/* globals alert */

/* istanbul ignore if */
if(typeof(luga) === "undefined"){
	throw("Unable to find Luga JS Core");
}

(function(){
	"use strict";

	luga.namespace("luga.validator");

	luga.validator.version = "0.9.2";

	/* Validation handlers */

	luga.namespace("luga.validator.handlers");

	/**
	 * Display error messages inside alert
	 *
	 * @param {jquery}                                      formNode      jQuery object wrapping the form
	 * @param {array.<luga.validator.BaseFieldValidator>}   validators    Array of field validators
	 */
	luga.validator.handlers.errorAlert = function(formNode, validators){
		var errorMsg = "";
		var focusGiven = false;
		for(var i = 0; i < validators.length; i++){
			// Append to the error string
			errorMsg += validators[i].message + "\n";
			// Give focus to the first invalid text field
			/* istanbul ignore else */
			if((focusGiven === false) && (validators[i].getFocus)){
				validators[i].getFocus();
				focusGiven = true;
			}
		}
		/* istanbul ignore else */
		if(errorMsg !== ""){
			alert(errorMsg);
		}
	};

	/**
	 * Display errors inside a box above the form
	 *
	 * @param {jquery}                                      formNode      jQuery object wrapping the form
	 * @param {array.<luga.validator.BaseFieldValidator>}   validators    Array of field validators
	 */
	luga.validator.handlers.errorBox = function(formNode, validators){
		// Clean-up any existing box
		if(validators.length === 0){
			luga.utils.removeDisplayBox(formNode);
			return;
		}
		var focusGiven = false;
		var htmlStr = "<ul>";
		// Create a <ul> for each error
		for(var i = 0; i < validators.length; i++){
			htmlStr += "<li><em>" + validators[i].name + ": </em> " + validators[i].message + "</li>";
			// Give focus to the first invalid text field
			if((focusGiven === false) && (validators[i].getFocus)){
				validators[i].getFocus();
				focusGiven = true;
			}
		}
		htmlStr += "</ul>";
		luga.utils.displayErrorMessage(formNode, htmlStr);
	};

	/**
	 * Use Bootstrap validation states to display errors
	 *
	 * @param {jquery}                                      formNode      jQuery object wrapping the form
	 * @param {array.<luga.validator.BaseFieldValidator>}   validators    Array of field validators
	 */
	luga.validator.handlers.bootstrap = function(formNode, validators){
		var ERROR_SELECTOR = ".has-error";
		var ERROR_CLASS = "has-error";
		var ALERT_SELECTOR = ".alert-danger";

		var FAILED_UPDATE = "<div class=\"alert alert-danger\" role=\"alert\">" +
			"<span style=\"padding-right:10px\" class=\"glyphicon glyphicon-exclamation-sign\">" +
			"</span>{0}</div>";

		// Reset all fields in the form
		jQuery(formNode).find(ERROR_SELECTOR).removeClass(ERROR_CLASS);
		jQuery(formNode).find(ALERT_SELECTOR).remove();

		var focusGiven = false;
		for(var i = 0; i < validators.length; i++){
			var fieldNode = jQuery(validators[i].node);
			// Attach Bootstrap CSS to parent node
			fieldNode.parent().addClass(ERROR_CLASS);
			// Display alert message
			fieldNode.before(jQuery(luga.string.format(FAILED_UPDATE, [validators[i].message])));
			// Give focus to the first invalid text field
			/* istanbul ignore else */
			if((focusGiven === false) && (validators[i].getFocus)){
				validators[i].getFocus();
				focusGiven = true;
			}
		}
	};

	luga.validator.CONST = {
		FORM_SELECTOR: "form[data-lugavalidator-validate]",
		RULE_PREFIX: "data-lugavalidator-",
		DEFAULT_DATE_PATTERN: "YYYY-MM-DD",
		CUSTOM_ATTRIBUTES: {
			VALIDATE: "data-lugavalidator-validate",
			ERROR: "data-lugavalidator-error",
			BEFORE: "data-lugavalidator-before",
			AFTER: "data-lugavalidator-after",
			BLOCK_SUBMIT: "data-lugavalidator-blocksubmit",
			MESSAGE: "data-lugavalidator-message",
			ERROR_CLASS: "data-lugavalidator-errorclass",
			REQUIRED: "data-lugavalidator-required",
			PATTERN: "data-lugavalidator-pattern",
			MIN_LENGTH: "data-lugavalidator-minlength",
			MAX_LENGTH: "data-lugavalidator-maxlength",
			MIN_NUMBER: "data-lugavalidator-minnumber",
			MAX_NUMBER: "data-lugavalidator-maxnumber",
			DATE_PATTERN: "data-lugavalidator-datepattern",
			MIN_DATE: "data-lugavalidator-mindate",
			MAX_DATE: "data-lugavalidator-maxdate",
			EQUAL_TO: "data-lugavalidator-equalto",
			MIN_CHECKED: "data-lugavalidator-minchecked",
			MAX_CHECKED: "data-lugavalidator-maxchecked",
			INVALID_INDEX: "data-lugavalidator-invalidindex",
			INVALID_VALUE: "data-lugavalidator-invalidvalue",
			DISABLED_MESSAGE: "data-lugavalidator-disabledlabel"
		},
		MESSAGES: {
			MISSING_FORM: "luga.validator was unable to load form",
			MISSING_FIELD: "luga.validator was unable to load field",
			MISSING_FUNCTION: "luga.validator was unable to find a function named: {0}",
			BASE_VALIDATOR_ABSTRACT: "luga.validator.BaseFieldValidator is an abstract class",
			GROUP_VALIDATOR_ABSTRACT: "luga.validator.BaseGroupValidator is an abstract class",
			FIELD_CANT_BE_VALIDATED: "This field can't be validated",
			PATTERN_NOT_FOUND: "luga.validator failed to retrieve pattern: {0}",
			INVALID_INDEX_PARAMETER: "data-lugavalidator-invalidindex accept only numbers",
			MISSING_EQUAL_TO_FIELD: "data-lugavalidator-equalto was unable to find field with id = {0}"
		},
		HANDLERS: {
			FORM_ERROR: "luga.validator.handlers.errorAlert"
		}
	};

	/**
	 * @typedef {object} luga.validator.FormValidator.options
	 *
	 * @property {jquery}  formNode      Either a jQuery object wrapping the form or the naked DOM object. Required
	 * @property {string}  error         Name of the function to be invoked to handle/display validation messages.
	 *                                   Default to luga.validator.errorAlert
	 * @property {string}  before        Name of the function to be invoked before validation is performed. Default to null
	 * @property {string}  after         Name of the function to be invoked after validation is performed. Default to null
	 * @property {boolean} blocksubmit   Disable submit buttons if the form isn't valid
	 *                                   This prevents multiple submits but also prevents the value of the submit buttons from being passed as part of the HTTP request
	 *                                   Set this options to false to keep the submit buttons enabled
	 */

	/**
	 * Form validator class
	 *
	 * @constructor
	 * @param {luga.validator.FormValidator.options} options
	 * @throws {Exception}
	 */
	luga.validator.FormValidator = function(options){
		/** @type {luga.validator.FormValidator.options} */
		this.config = {
			// Either: custom attribute, incoming option or default
			blocksubmit: jQuery(options.formNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.BLOCK_SUBMIT) || "true",
			error: jQuery(options.formNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.ERROR) || luga.validator.CONST.HANDLERS.FORM_ERROR,
			// Either: custom attribute, incoming option or null
			before: jQuery(options.formNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.BEFORE) || null,
			after: jQuery(options.formNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.AFTER) || null
		};
		luga.merge(this.config, options);
		// Hack to ensure it's a boolean
		this.config.blocksubmit = JSON.parse(this.config.blocksubmit);

		/** @type {luga.validator.FormValidator} */
		var self = this;
		/** @type {array.<luga.validator.BaseFieldValidator>} */
		self.validators = [];
		/** @type {array.<luga.validator.BaseFieldValidator>} */
		self.dirtyValidators = [];
		// Ensure it's a jQuery object
		self.config.formNode = jQuery(self.config.formNode);

		if(jQuery(self.config.formNode).length === 0){
			throw(luga.validator.CONST.MESSAGES.MISSING_FORM);
		}

		this.init = function(){
			self.validators = [];
			self.dirtyValidators = [];
			var formDom = self.config.formNode[0];
			for(var i = 0; i < formDom.elements.length; i++){
				/* istanbul ignore else */
				if(luga.form.utils.isInputField(formDom.elements[i]) === true){
					self.validators.push(luga.validator.fieldValidatorFactory.getInstance({
						fieldNode: formDom.elements[i],
						formNode: self.config.formNode
					}));
				}
			}
		};

		/**
		 * Execute all field validators. Returns an array of field validators that are in invalid state
		 * The returned array is empty if there are no errors
		 *
		 * @param   {object} event
		 * @returns {array.<luga.validator.BaseFieldValidator>}
		 */
		this.validate = function(event){
			self.init();
			self.before(event);
			// Keep track of already validated fields (to skip already validated checkboxes or radios)
			var executedValidators = {};
			for(var i = 0; i < self.validators.length; i++){
				if((self.validators[i] !== undefined) && (self.validators[i].validate !== undefined)){
					if(executedValidators[self.validators[i].name] !== undefined){
						// Already validated checkbox or radio, skip it
						continue;
					}
					if(self.validators[i].validate() === true){
						self.dirtyValidators.push(self.validators[i]);
					}
					executedValidators[self.validators[i].name] = true;
				}
			}
			if(self.isValid() === false){
				self.error();
				if(event !== undefined){
					event.preventDefault();
				}
			}
			else{
				if(this.config.blocksubmit === true){
					// Disable submit buttons to avoid multiple submits
					self.disableSubmit();
				}
				self.after(event);
			}
			return self.dirtyValidators;
		};

		this.disableSubmit = function(){
			var buttons = jQuery("input[type=submit]", self.config.formNode);
			jQuery(buttons).each(function(index, item){
				var buttonNode = jQuery(item);
				if(buttonNode.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.DISABLED_MESSAGE) !== undefined){
					buttonNode.val(buttonNode.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.DISABLED_MESSAGE));
				}
			});
		};

		/**
		 * Returns truue if the form is valid, false otherwise
		 * @returns {boolean}
		 */
		this.isValid = function(){
			return self.dirtyValidators.length === 0;
		};

		this.before = function(event){
			if(self.config.before !== null){
				var callBack = luga.lookupFunction(self.config.before);
				if(callBack !== undefined){
					callBack.apply(null, [self.config.formNode, event]);
				}
				else{
					throw(luga.string.format(luga.validator.CONST.MESSAGES.MISSING_FUNCTION, [self.config.before]));
				}
			}
		};

		this.error = function(){
			var callBack = luga.lookupFunction(self.config.error);
			if(callBack !== undefined){
				callBack.apply(null, [self.config.formNode, self.dirtyValidators]);
			}
			else{
				throw(luga.string.format(luga.validator.CONST.MESSAGES.MISSING_FUNCTION, [self.config.error]));
			}
		};

		this.after = function(event){
			if(self.config.after !== null){
				var callBack = luga.lookupFunction(self.config.after);
				if(callBack !== undefined){
					callBack.apply(null, [self.config.formNode, event]);
				}
				else{
					throw(luga.string.format(luga.validator.CONST.MESSAGES.MISSING_FUNCTION, [self.config.after]));
				}
			}
		};

	};

	luga.namespace("luga.validator.fieldValidatorFactory");

	/**
	 * @typedef {object} luga.validator.fieldValidatorFactory.getInstance.options
	 *
	 * @property {jquery} formNode    Either a jQuery object wrapping the form or the naked DOM object
	 *                                Required in case of radio and checkboxes (that are validated as group), optional in all other cases

	 * @property {jquery} fieldNode   Either a jQuery object wrapping the field or the naked DOM object. Required
	 *
	 * Additional options can be used, but are specific to different kind of input fields.
	 * Check their implementation for details
	 */

	/**
	 * Field validator factory. Use this to instantiate a field validator without worrying about the specific implementation
	 *
	 * @param {luga.validator.fieldValidatorFactory.getInstance.options} options
	 * @returns {luga.validator.BaseFieldValidator|luga.validator.BaseGroupValidator}
	 */
	luga.validator.fieldValidatorFactory.getInstance = function(options){
		/** @type {luga.validator.fieldValidatorFactory.getInstance.options} */
		this.config = {};
		luga.merge(this.config, options);
		var self = this;
		// Abort if the field isn't suitable to validation
		if(luga.form.utils.isInputField(self.config.fieldNode) === false){
			return null;
		}
		var fieldType = jQuery(self.config.fieldNode).prop("type");
		// Get relevant validator based on field type
		switch(fieldType){

			case "select-multiple":
				return new luga.validator.SelectValidator(this.config);

			case "select-one":
				return new luga.validator.SelectValidator(this.config);

			case "radio":
				if(jQuery(this.config.fieldNode).attr("name") !== undefined){
					return new luga.validator.RadioValidator({
						inputGroup: luga.form.utils.getFieldGroup(jQuery(this.config.fieldNode).attr("name"), this.config.formNode)
					});
				}
				break;

			case "checkbox":
				if(jQuery(this.config.fieldNode).attr("name") !== undefined){
					return new luga.validator.CheckboxValidator({
						inputGroup: luga.form.utils.getFieldGroup(jQuery(this.config.fieldNode).attr("name"), this.config.formNode)
					});
				}
				break;

			default:
				return new luga.validator.TextValidator(this.config);
		}
	};

	/**
	 * @typedef {object} luga.validator.BaseFieldValidator.options
	 *
	 * @property {jquery} fieldNode      Either a jQuery object wrapping the field or the naked DOM object. Required
	 * @property {string} message        Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass     CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 *
	 * Additional options can be used, but are specific to different kind of input fields.
	 * Check their implementation for details
	 */

	/**
	 * Abstract field validator class. To be extended for different kind of fields
	 *
	 * @constructor
	 * @abstract
	 * @param {luga.validator.BaseFieldValidator.options} options
	 * @throws {Exception}
	 */
	luga.validator.BaseFieldValidator = function(options){

		if(this.constructor === luga.validator.BaseFieldValidator){
			throw(luga.validator.CONST.MESSAGES.BASE_VALIDATOR_ABSTRACT);
		}

		/** @type {luga.validator.BaseFieldValidator.options} */
		this.config = {
			message: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MESSAGE) || "",
			errorclass: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.ERROR_CLASS) || ""
		};
		luga.merge(this.config, options);

		this.node = jQuery(options.fieldNode);
		this.message = this.config.message;
		this.name = "";

		if(this.node.attr("name") !== undefined){
			this.name = this.node.attr("name");
		}
		else if(this.node.attr("id") !== undefined){
			this.name = this.node.attr("id");
		}

		/**
		 * Return true if the field is valid. False otherwise
		 * @abstract
		 * @returns {boolean}
		 */
		/* istanbul ignore next */
		this.isValid = function(){
		};

		this.flagInvalid = function(){
			this.node.addClass(this.config.errorclass);
			// Set the title attribute in order to show a tooltip
			this.node.attr("title", this.message);
		};

		this.flagValid = function(){
			this.node.removeClass(this.config.errorclass);
			this.node.removeAttr("title");
		};

		/**
		 * Be careful, this method returns a boolean but also has side-effects
		 * @returns {boolean}
		 */
		this.validate = function(){
			// Disabled fields are always valid
			if(this.node.prop("disabled") === true){
				this.flagValid();
				return false;
			}
			if(this.isValid() === false){
				this.flagInvalid();
				return true;
			}
			else{
				this.flagValid();
				return false;
			}
		};
	};

	/**
	 * @typedef {object} luga.validator.TextValidator.options
	 *
	 * @property {jquery} fieldNode               Either a jQuery object wrapping the field or the naked DOM object. Required
	 * @property {boolean|function} required      Set it to true to flag the field as required.
	 *                                            In case you need conditional validation, set it to the name of a custom function that will handle the condition.
	 *                                            Can also be set using the "data-lugavalidator-required" attribute. Optional
	 * @property {string} pattern                 Validation pattern to be applied, either built-in or custom.
	 *                                            Can also be set using the "data-lugavalidator-pattern" attribute. Optional
	 * @property {string} minlength               Enforce a minimum text length. Can also be set using the "data-lugavalidator-minlength" attribute. Optional
	 * @property {string} maxlength               Enforce a maximum text length. Can also be set using the "data-lugavalidator-maxlength" attribute. Optional
	 * @property {string} minnumber               Enforce a minimum numeric value. Can also be set using the "data-lugavalidator-minnumber" attribute. Optional
	 * @property {string} maxnumber               Enforce a maximum numeric value. Can also be set using the "data-lugavalidator-maxnumber" attribute. Optional
	 * @property {string} datepattern             Date format pattern to be applied, either built-in or custom. Can also be set using the "data-lugavalidator-datepattern" attribute. Optional
	 * @property {string} mindate                 Enforce a minimum date. Can also be set using the "data-lugavalidator-mindate" attribute. Optional
	 * @property {string} maxdate                 Enforce a maximum date. Can also be set using the "data-lugavalidator-maxdate" attribute. Optional
	 * @property {string} equalto                 Id of another field who's values will be compared for equality. Can also be set using the "data-lugavalidator-equalto" attribute. Optional
	 * @property {string} message                 Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass              CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 */

	/**
	 * Text field validator class
	 *
	 * @constructor
	 * @extends luga.validator.BaseFieldValidator
	 * @param {luga.validator.TextValidator.options} options
	 * @throws {Exception}
	 */
	luga.validator.TextValidator = function(options){

		/** @type {luga.validator.TextValidator.options} */
		this.config = {
			required: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.REQUIRED),
			pattern: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.PATTERN),
			minlength: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MIN_LENGTH),
			maxlength: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MAX_LENGTH),
			minnumber: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MIN_NUMBER),
			maxnumber: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MAX_NUMBER),
			datepattern: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.DATE_PATTERN) || luga.validator.CONST.DEFAULT_DATE_PATTERN,
			mindate: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MIN_DATE),
			maxdate: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MAX_DATE),
			equalto: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.EQUAL_TO)
		};

		luga.merge(this.config, options);
		luga.extend(luga.validator.BaseFieldValidator, this, [this.config]);

		if(this.config.required !== undefined){
			try{
				// Hack to ensure it's a boolean
				this.config.required = JSON.parse(this.config.required);
			}
			catch(e){
				// Unable to convert into a booolean. It must be a string referencing a function
			}
		}

		/** @type {luga.validator.TextValidator} */
		var self = this;

		self.node = jQuery(options.fieldNode);
		if(self.node.length === 0){
			throw(luga.validator.CONST.MESSAGES.MISSING_FIELD);
		}
		self.type = "text";

		// Put focus and cursor inside the field
		this.getFocus = function(){
			// This try block is required to solve an obscure issue with IE and hidden fields
			try{
				self.node.focus();
				self.node.select();
			}
			catch(e){
			}
		};

		/**
		 * @returns {boolean}
		 */
		this.isEmpty = function(){
			return self.node.val() === "";
		};

		/**
		 * @returns {boolean}
		 */
		this.isRequired = function(){
			var requiredAtt = this.config.required;
			if(requiredAtt === true){
				return true;
			}
			if(requiredAtt === false){
				return false;
			}
			// It's a conditional validation. Invoke the relevant function if available
			var functionReference = luga.lookupFunction(requiredAtt);
			if(functionReference !== undefined){
				return functionReference.apply(null, [self.node]);
			}
			else{
				throw(luga.string.format(luga.validator.CONST.MESSAGES.MISSING_FUNCTION, [requiredAtt]));
			}
		};

		/**
		 * Returns true if the field satisfy the rules associated with it. False otherwise
		 * Be careful, this method contains multiple exit points!!!
		 * @override
		 * @returns {boolean}
		 */
		this.isValid = function(){
			if(self.isEmpty()){
				if(self.isRequired() === true){
					return false;
				}
				else{
					return true;
				}
			}
			else{
				// It's empty. Loop over all the available rules
				for(var rule in luga.validator.rules){
					// Check if the current rule is required for the field
					if(self.node.attr(luga.validator.CONST.RULE_PREFIX + rule) !== undefined){
						// Invoke the rule
						if(luga.validator.rules[rule].apply(null, [self.node, self]) === false){
							return false;
						}
					}
				}
			}
			return true;
		};
	};

	/**
	 * @typedef {object} luga.validator.SelectValidator.options
	 *
	 * @property {jquery} fieldNode              Either a jQuery object wrapping the field or the naked DOM object. Required
	 * @property {string|number} invalidindex    Prevents selection of an entry on a given position (zero based). Can also be set using the "data-lugavalidator-invalidindex" attribute. Optional
	 * @property {string} invalidvalue           Prevents selection of an entry with a given value. Can also be set using the "data-lugavalidator-invalidvalue" attribute. Optional
	 * @property {string} message                Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass             CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 */

	/**
	 * Select field validator class
	 *
	 * @constructor
	 * @extends luga.validator.BaseFieldValidator
	 * @param {luga.validator.SelectValidator.options} options
	 * @throws {Exception}
	 */
	luga.validator.SelectValidator = function(options){

		/** @type {luga.validator.SelectValidator.options} */
		this.config = {
			invalidindex: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.INVALID_INDEX),
			invalidvalue: jQuery(options.fieldNode).attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.INVALID_VALUE)
		};

		luga.merge(this.config, options);
		luga.extend(luga.validator.BaseFieldValidator, this, [this.config]);

		/** @type {luga.validator.SelectValidator} */
		var self = this;
		self.type = "select";
		self.node = jQuery(options.fieldNode);
		if(self.node.length === 0){
			throw(luga.validator.CONST.MESSAGES.MISSING_FIELD);
		}

		// Ensure invalidindex is numeric
		if((self.config.invalidindex !== undefined) && (!jQuery.isNumeric(self.config.invalidindex))){
			throw(luga.validator.CONST.MESSAGES.INVALID_INDEX_PARAMETER);
		}

		// Whenever a "size" attribute is available, the browser reports -1 as selectedIndex
		// Fix this weirdness
		var currentIndex = self.node.prop("selectedIndex");
		if(currentIndex === -1){
			currentIndex = 0;
		}
		currentIndex = parseInt(currentIndex, 10);

		/**
		 * Returns true if the field satisfy the rules associated with it. False otherwise
		 * Be careful, this method contains multiple exit points!!!
		 * @override
		 * @returns {boolean}
		 */
		this.isValid = function(){
			// Check for index
			if(currentIndex === parseInt(self.config.invalidindex, 10)){
				return false;
			}
			// Check for value
			if(self.node.val() === self.config.invalidvalue){
				return false;
			}
			// No need to care about other rules
			return true;
		};

	};

	/**
	 * @typedef {object} luga.validator.BaseGroupValidator.options
	 *
	 * @property {jquery} inputGroup      A jQuery object wrapping input fields that share the same name. Use luga.form.utils.getFieldGroup() to obtain it. Required
	 * @property {string} message         Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass      CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 *
	 * Additional options can be used, but are specific to different kind of input fields.
	 * Check their implementation for details
	 */

	/**
	 * Abstract validator class for grouped fields (checkboxes, radio buttons). To be extended for different kind of fields
	 *
	 * @constructor
	 * @abstract
	 * @param {luga.validator.BaseFieldValidator.options} options
	 * @throws {Exception}
	 */
	luga.validator.BaseGroupValidator = function(options){

		if(this.constructor === luga.validator.BaseGroupValidator){
			throw(luga.validator.CONST.MESSAGES.GROUP_VALIDATOR_ABSTRACT);
		}
		/** @type {luga.validator.BaseFieldValidator.options} */
		this.config = {};
		luga.merge(this.config, options);
		this.inputGroup = this.config.inputGroup;
		this.name = jQuery(this.config.inputGroup).attr("name");
		this.message = "";
		this.errorclass = "";

		// Since fields from the same group can have conflicting attribute values, the last one win
		for(var i = 0; i < this.inputGroup.length; i++){
			var field = jQuery(this.inputGroup[i]);
			if(field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MESSAGE) !== undefined){
				this.message = field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MESSAGE);
			}
			if(field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.ERROR_CLASS) !== undefined){
				this.errorclass = field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.ERROR_CLASS);
			}
		}

		/**
		 * Returns true if the field group is valid. False otherwise
		 * @abstract
		 * @returns {boolean}
		 */
		/* istanbul ignore next */
		this.isValid = function(){
		};

		this.flagInvalid = function(){
			/* istanbul ignore else */
			if(this.errorclass !== ""){
				for(var i = 0; i < this.inputGroup.length; i++){
					var field = jQuery(this.inputGroup[i]);
					field.addClass(this.errorclass);
					field.attr("title", this.message);
				}
			}
		};

		this.flagValid = function(){
			if(this.errorclass !== ""){
				for(var i = 0; i < this.inputGroup.length; i++){
					var field = jQuery(this.inputGroup[i]);
					field.removeClass(this.errorclass);
					field.removeAttr("title");
				}
			}
		};

		/**
		 * Be careful, this method returns a boolean but also has side-effects
		 * @returns {boolean}
		 */
		this.validate = function(){
			if(this.isValid() === true){
				this.flagValid();
				return false;
			}
			else{
				this.flagInvalid();
				return true;
			}
		};

	};

	/**
	 * @typedef {object} luga.validator.RadioValidator.options
	 *
	 * @property {jquery} inputGroup      A jQuery object wrapping input fields that share the same name. Use luga.form.utils.getFieldGroup() to obtain it. Required
	 * @property {string} message         Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass      CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 */

	/**
	 * Radio button group validator class
	 *
	 * @constructor
	 * @extends luga.validator.BaseGroupValidator
	 * @param {luga.validator.RadioValidator.options} options
	 *
	 */
	luga.validator.RadioValidator = function(options){
		/** @type {luga.validator.RadioValidator.options} */
		this.config = {};
		luga.merge(this.config, options);
		luga.extend(luga.validator.BaseGroupValidator, this, [this.config]);
		this.type = "radio";

		/**
		 * Return true if the field group is required
		 * @returns {boolean}
		 */
		this.isRequired = function(){
			var requiredFlag = false;
			var fieldGroup = this.inputGroup;
			// Since fields from the same group can have conflicting attribute values, the last one win
			for(var i = 0; i < fieldGroup.length; i++){
				var field = jQuery(fieldGroup[i]);
				if(field.prop("disabled") === false){
					if(field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.REQUIRED)){
						requiredFlag = field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.REQUIRED);
					}
				}
			}
			return requiredFlag;
		};

		/**
		 * Returns true if the field satisfy the rules associated with it. False otherwise
		 * Be careful, this method contains multiple exit points!!!
		 * @override
		 * @returns {boolean}
		 */
		this.isValid = function(){
			if(this.isRequired() === "true"){
				var fieldGroup = this.inputGroup;
				for(var i = 0; i < fieldGroup.length; i++){
					var field = jQuery(fieldGroup[i]);
					// As long as only one is checked, we are fine
					if(field.prop("checked") === true){
						return true;
					}
				}
				return false;
			}
			return true;
		};
	};

	/**
	 * @typedef {object} luga.validator.CheckboxValidator.options
	 *
	 * @property {jquery} inputGroup      A jQuery object wrapping input fields that share the same name. Use luga.form.utils.getFieldGroup() to obtain it. Required
	 * @property {number} minchecked      Specify a minimum number of boxes that can be checked in a group. Set it to 1 to allow only one choice. Optional
	 * @property {number} maxchecked      Specify a maximum number of boxes that can be checked within a group. Optional
	 * @property {string} message         Error message. Can also be set using the "data-lugavalidator-message" attribute. Optional
	 * @property {string} errorclass      CSS class to apply for invalid state. Can also be set using the "data-lugavalidator-errorclass" attribute. Optional
	 */

	/**
	 * Checkboxes group validator class
	 *
	 * @constructor
	 * @extends luga.validator.BaseGroupValidator
	 * @param {luga.validator.CheckboxValidator.options} options
	 *
	 */
	luga.validator.CheckboxValidator = function(options){
		/** @type {luga.validator.CheckboxValidator.options} */
		this.config = {};
		luga.merge(this.config, options);
		luga.extend(luga.validator.BaseGroupValidator, this, [this.config]);
		this.type = "checkbox";
		this.minchecked = 0;
		this.maxchecked = this.config.inputGroup.length;

		// Since checkboxes from the same group can have conflicting attribute values, the last one win
		for(var i = 0; i < this.inputGroup.length; i++){
			var field = jQuery(this.inputGroup[i]);
			if(field.prop("disabled") === false){
				if(field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MIN_CHECKED) !== undefined){
					this.minchecked = field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MIN_CHECKED);
				}
				if(field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MAX_CHECKED) !== undefined){
					this.maxchecked = field.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.MAX_CHECKED);
				}
			}
		}

		/**
		 * Returns true if the field satisfy the rules associated with it. False otherwise
		 * @override
		 * @returns {boolean}
		 */
		this.isValid = function(){
			var checkCounter = 0;
			var fieldGroup = this.inputGroup;
			for(var i = 0; i < fieldGroup.length; i++){
				// For each checked box, increase the counter
				var field = jQuery(this.inputGroup[i]);
				if(field.prop("disabled") === false){
					if(field.prop("checked") === true){
						checkCounter++;
					}
				}
			}
			return ((checkCounter >= this.minchecked) && (checkCounter <= this.maxchecked));
		};

	};

	/* Rules */

	luga.namespace("luga.validator.rules");

	luga.validator.rules.email = function(fieldNode, validator){
		var fieldValue = fieldNode.val();
		var containsAt = (fieldValue.indexOf("@") !== -1);
		var containDot = (fieldValue.indexOf(".") !== -1);
		if((containsAt === true) && (containDot === true)){
			return true;
		}
		return false;
	};

	/**
	 * @throws {Exception}
	 */
	luga.validator.rules.equalto = function(fieldNode, validator){
		var secondFieldNode = jQuery("#" + validator.config.equalto);
		if(secondFieldNode.length === 0){
			throw(luga.string.format(luga.validator.CONST.MESSAGES.MISSING_EQUAL_TO_FIELD, [validator.config.equalto]));
		}
		return (fieldNode.val() === secondFieldNode.val());
	};

	luga.validator.rules.datepattern = function(fieldNode, validator){
		var datObj = luga.validator.dateStrToObj(fieldNode.val(), validator.config.datepattern);
		if(datObj !== null){
			return true;
		}
		return false;
	};

	luga.validator.rules.maxdate = function(fieldNode, validator){
		var pattern = validator.config.datepattern;
		var valueDate = luga.validator.dateStrToObj(fieldNode.val(), pattern);
		var maxDate = luga.validator.dateStrToObj(validator.config.maxdate, pattern);
		if((valueDate !== null) && (maxDate !== null)){
			return valueDate <= maxDate;
		}
		return false;
	};

	luga.validator.rules.mindate = function(fieldNode, validator){
		var pattern = validator.config.datepattern;
		var valueDate = luga.validator.dateStrToObj(fieldNode.val(), pattern);
		var minDate = luga.validator.dateStrToObj(validator.config.mindate, pattern);
		if((valueDate !== null) && (minDate !== null)){
			return valueDate >= minDate;
		}
		return false;
	};

	luga.validator.rules.maxlength = function(fieldNode, validator){
		if(fieldNode.val().length > validator.config.maxlength){
			return false;
		}
		return true;
	};

	luga.validator.rules.minlength = function(fieldNode, validator){
		if(fieldNode.val().length < validator.config.minlength){
			return false;
		}
		return true;
	};

	luga.validator.rules.maxnumber = function(fieldNode, validator){
		if(jQuery.isNumeric(fieldNode.val()) === false){
			return false;
		}
		if(parseFloat(fieldNode.val()) <= parseFloat(validator.config.maxnumber)){
			return true;
		}
		return false;
	};

	luga.validator.rules.minnumber = function(fieldNode, validator){
		if(jQuery.isNumeric(fieldNode.val()) === false){
			return false;
		}
		if(parseFloat(fieldNode.val()) >= parseFloat(validator.config.minnumber)){
			return true;
		}
		return false;
	};

	/**
	 * @throws {Exception}
	 */
	luga.validator.rules.pattern = function(fieldNode, validator){
		var regExpObj = luga.validator.patterns[validator.config.pattern];
		if(regExpObj !== undefined){
			return regExpObj.test(fieldNode.val());
		}
		else{
			// The pattern is missing
			throw(luga.string.format(luga.validator.CONST.MESSAGES.PATTERN_NOT_FOUND, [validator.config.pattern]));
		}
	};

	/* Patterns */

	luga.namespace("luga.validator.patterns");

	luga.validator.patterns.lettersonly = new RegExp("^[a-zA-Z]*$");
	luga.validator.patterns.alphanumeric = new RegExp("^\\w*$");
	luga.validator.patterns.integer = new RegExp("^-?[1-9][0-9]*$");
	luga.validator.patterns.positiveinteger = new RegExp("^\\d\\d*$");
	luga.validator.patterns.number = new RegExp("^-?(\\d\\d*\\.\\d*$)|(^-?\\d\\d*$)|(^-?\\.\\d\\d*$)");
	luga.validator.patterns.filepath_pdf = new RegExp("[\\w_]*\\.([pP][dD][fF])$");
	luga.validator.patterns.filepath_jpg = new RegExp("[\\w_]*\\.([jJ][pP][eE]?[gG])$");
	luga.validator.patterns.filepath_zip = new RegExp("[\\w_]*\\.([zZ][iI][pP])$");
	luga.validator.patterns.filepath = new RegExp("[\\w_]*\\.\\w{3}$");
	luga.validator.patterns.time = new RegExp("([0-1][0-9]|2[0-3]):[0-5][0-9]$");

	/* Date specifications */

	luga.namespace("luga.validator.dateSpecs");

	/**
	 * Create an object that stores date validation's info
	 *
	 * @param rex       {regexp}
	 * @param year      {number}
	 * @param month     {number}
	 * @param day       {number}
	 * @param separator {string}
	 *
	 * @returns {object}
	 */
	luga.validator.createDateSpecObj = function(rex, year, month, day, separator){
		var infoObj = {};
		infoObj.rex = new RegExp(rex);
		infoObj.y = year;
		infoObj.m = month;
		infoObj.d = day;
		infoObj.s = separator;
		return infoObj;
	};

	/**
	 * Create a Date object out of a string, based on a given date spec key
	 *
	 * @param {string}   dateStr
	 * @param {string}   dateSpecKey
	 * @returns {date|*}
	 */
	luga.validator.dateStrToObj = function(dateStr, dateSpecKey){
		var dateSpecObj = luga.validator.dateSpecs[dateSpecKey];
		if(dateSpecObj !== undefined){

			// If it doesn't matches the RegExp, abort
			if(!dateSpecObj.rex.test(dateStr)){
				return null;
			}

			// String's value matches the pattern, check if it's a valida date
			// Split the date into 3 different bits using the separator
			var dateBits = dateStr.split(dateSpecObj.s);
			// First try to create a new date out of the bits
			var testDate = new Date(dateBits[dateSpecObj.y], (dateBits[dateSpecObj.m] - 1), dateBits[dateSpecObj.d]);
			// Make sure values match after conversion
			var yearMatches = (testDate.getFullYear() === parseInt(dateBits[dateSpecObj.y], 10));
			var monthMatches = (testDate.getMonth() === parseInt(dateBits[dateSpecObj.m] - 1, 10));
			var dayMatches = (testDate.getDate() === parseInt(dateBits[dateSpecObj.d], 10));
			if((yearMatches === true) && (monthMatches === true) && (dayMatches === true)){
				return testDate;
			}
			return null;
		}
		return null;
	};

	luga.validator.dateSpecs["YYYY-MM-DD"] = luga.validator.createDateSpecObj("^([0-9]{4})-([0-1][0-9])-([0-3][0-9])$", 0, 1, 2, "-");
	luga.validator.dateSpecs["YYYY-M-D"] = luga.validator.createDateSpecObj("^([0-9]{4})-([0-1]?[0-9])-([0-3]?[0-9])$", 0, 1, 2, "-");
	luga.validator.dateSpecs["MM.DD.YYYY"] = luga.validator.createDateSpecObj("^([0-1][0-9]).([0-3][0-9]).([0-9]{4})$", 2, 0, 1, ".");
	luga.validator.dateSpecs["M.D.YYYY"] = luga.validator.createDateSpecObj("^([0-1]?[0-9]).([0-3]?[0-9]).([0-9]{4})$", 2, 0, 1, ".");
	luga.validator.dateSpecs["MM/DD/YYYY"] = luga.validator.createDateSpecObj("^([0-1][0-9])\/([0-3][0-9])\/([0-9]{4})$", 2, 0, 1, "/");
	luga.validator.dateSpecs["M/D/YYYY"] = luga.validator.createDateSpecObj("^([0-1]?[0-9])\/([0-3]?[0-9])\/([0-9]{4})$", 2, 0, 1, "/");
	luga.validator.dateSpecs["MM-DD-YYYY"] = luga.validator.createDateSpecObj("^([0-21][0-9])-([0-3][0-9])-([0-9]{4})$", 2, 0, 1, "-");
	luga.validator.dateSpecs["M-D-YYYY"] = luga.validator.createDateSpecObj("^([0-1]?[0-9])-([0-3]?[0-9])-([0-9]{4})$", 2, 0, 1, "-");
	luga.validator.dateSpecs["DD.MM.YYYY"] = luga.validator.createDateSpecObj("^([0-3][0-9]).([0-1][0-9]).([0-9]{4})$", 2, 1, 0, ".");
	luga.validator.dateSpecs["D.M.YYYY"] = luga.validator.createDateSpecObj("^([0-3]?[0-9]).([0-1]?[0-9]).([0-9]{4})$", 2, 1, 0, ".");
	luga.validator.dateSpecs["DD/MM/YYYY"] = luga.validator.createDateSpecObj("^([0-3][0-9])\/([0-1][0-9])\/([0-9]{4})$", 2, 1, 0, "/");
	luga.validator.dateSpecs["D/M/YYYY"] = luga.validator.createDateSpecObj("^([0-3]?[0-9])\/([0-1]?[0-9])\/([0-9]{4})$", 2, 1, 0, "/");
	luga.validator.dateSpecs["DD-MM-YYYY"] = luga.validator.createDateSpecObj("^([0-3][0-9])-([0-1][0-9])-([0-9]{4})$", 2, 1, 0, "-");
	luga.validator.dateSpecs["D-M-YYYY"] = luga.validator.createDateSpecObj("^([0-3]?[0-9])-([0-1]?[0-9])-([0-9]{4})$", 2, 1, 0, "-");

	/**
	 * Attach form validators to any suitable form inside the document
	 */
	luga.validator.initForms = function(){
		jQuery(luga.validator.CONST.FORM_SELECTOR).each(function(index, item){
			var formNode = jQuery(item);
			/* istanbul ignore else */
			if(formNode.attr(luga.validator.CONST.CUSTOM_ATTRIBUTES.VALIDATE) === "true"){
				formNode.submit(function(event){
					var formValidator = new luga.validator.FormValidator({
						formNode: formNode
					});
					formValidator.validate(event);
				});
			}
		});
	};

	/* API */

	luga.namespace("luga.validator.api");

	/**
	 * @typedef {object} luga.validator.api.validateForm.options
	 *
	 * @property {jquery} formNode       Either a jQuery object wrapping the form or the naked DOM object. Required
	 * @property {function} error        Name of the function to be invoked to handle/display validation messages.
	 *                                   Default to luga.validator.errorAlert
	 */

	/**
	 * Programmatically validate a form
	 * @param {luga.validator.api.validateForm.options}
	 * @returns {boolean}
	 */
	luga.validator.api.validateForm = function(options){
		var formValidator = new luga.validator.FormValidator(options);
		formValidator.validate();
		return formValidator.isValid();
	};

	/**
	 * @typedef {object} luga.validator.api.validateField.options
	 *
	 * @property {jquery} fieldNode      Either a jQuery object wrapping the field or the naked DOM object. Required
	 * @property {function} error        Function to be invoked to handle/display validation messages.
	 *                                   Default to luga.validator.errorAlert
	 */

	/**
	 * Programmatically validate a field
	 * @param {luga.validator.api.validateField.options}
	 * @returns {boolean}
	 * @throws {Exception}
	 */
	luga.validator.api.validateField = function(options){
		if(luga.form.utils.isInputField(options.fieldNode) === false){
			throw(luga.validator.CONST.MESSAGES.FIELD_CANT_BE_VALIDATED);
		}
		/* istanbul ignore else */
		if(options.error === undefined){
			options.error = luga.validator.CONST.HANDLERS.FORM_ERROR;
		}
		var dirtyValidators = [];
		var fieldValidator = new luga.validator.fieldValidatorFactory.getInstance(options);
		fieldValidator.validate(null);
		if(fieldValidator.isValid() === true){
			var callBack = luga.lookupFunction(options.error);
			dirtyValidators.push(fieldValidator);
			callBack(null, []);
		}
		return fieldValidator.isValid();
	};

	/**
	 * @typedef {object} luga.validator.api.validateField.options
	 *
	 * @property {jquery} fields      A jQuery object wrapping the collection of fields. Required
	 * @property {function} error     Function to be invoked to handle/display validation messages.
	 *                                Default to luga.validator.errorAlert
	 */

	/**
	 * Programmatically validate a collection of fields
	 * @param {luga.validator.api.validateFields.options}
	 * @returns {boolean}
	 */
	luga.validator.api.validateFields = function(options){
		/* istanbul ignore else */
		if(!options.error){
			options.error = luga.validator.CONST.HANDLERS.FORM_ERROR;
		}
		var validators = [];
		var executedValidators = {};
		var dirtyValidators = [];

		for(var i = 0; i < options.fields.length; i++){
			/* istanbul ignore else */
			if(luga.form.utils.isInputField(options.fields[i]) === true){
				validators.push(luga.validator.fieldValidatorFactory.getInstance({
					fieldNode: options.fields[i]
				}));
			}
		}
		for(var j = 0; j < validators.length; j++){
			/* istanbul ignore else */
			if(validators[j] && validators[j].validate){
				if(executedValidators[validators[j].name] !== undefined){
					// Already validated checkbox or radio, skip it
					continue;
				}
				if(validators[j].validate() === true){
					dirtyValidators.push(validators[j]);
				}
				executedValidators[validators[j].name] = true;
			}
		}
		if(dirtyValidators.length > 0){
			var callBack = luga.lookupFunction(options.error);
			callBack.apply(null, [options.formNode, dirtyValidators]);
		}
		return dirtyValidators.length === 0;
	};

	/**
	 * @typedef {object} luga.validator.api.validateFields.options
	 *
	 * @property {jquery} rootNode    A jQuery object wrapping the root node. Required
	 * @property {function} error     Function to be invoked to handle/display validation messages.
	 *                                Default to luga.validator.errorAlert
	 */

	/**
	 * Programmatically validate all fields contained inside a given node
	 * @param {luga.validator.api.validateFields.options}
	 * @returns {boolean}
	 */
	luga.validator.api.validateChildFields = function(options){
		var fields = luga.form.utils.getChildFields(options.rootNode);
		return luga.validator.api.validateFields({
			fields: fields,
			error: options.error
		});
	};

	jQuery(document).ready(function(){
		luga.validator.initForms();
	});

}());