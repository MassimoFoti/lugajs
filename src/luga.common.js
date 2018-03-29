/* globals ActiveXObject */

/* istanbul ignore if */
if(typeof(jQuery) === "undefined"){
	throw("Unable to find jQuery");
}
/* istanbul ignore else */
if(typeof(luga) === "undefined"){
	window.luga = {};
}

(function(){
	"use strict";

	/**
	 * Creates namespaces to be used for scoping variables and classes so that they are not global.
	 * Specifying the last node of a namespace implicitly creates all other nodes.
	 * Based on Nicholas C. Zakas's code
	 * @param {String} ns                   Namespace as dot-delimited string
	 * @param {Object} [rootObject=window]  Optional root object. Default to window
	 * @return {Object}
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

	luga.namespace("luga.common");
	luga.common.version = "0.9.7";

	/**
	 * Offers a simple solution for inheritance among classes
	 *
	 * @param {function} baseFunc  Parent constructor function. Required
	 * @param {function} func      Child constructor function. Required
	 * @param {Array}    [args]    An array of arguments that will be passed to the parent's constructor. Optional
	 */
	luga.extend = function(baseFunc, func, args){
		baseFunc.apply(func, args);
	};

	/**
	 * Return true if an object is a plain object (created using "{}" or "new Object"). False otherwise
	 * Based on jQuery.isPlainObject()
	 * @param {*} obj
	 * @return {Boolean}
	 */
	luga.isPlainObject = function(obj){
		// Detect obvious negatives
		// Use Object.prototype.toString to catch host objects
		if(Object.prototype.toString.call(obj) !== "[object Object]"){
			return false;
		}

		var proto = Object.getPrototypeOf(obj);

		// Objects with no prototype (e.g., Object.create(null)) are plain
		if(proto === null){
			return true;
		}

		// Objects with prototype are plain if they were constructed by a global Object function
		var constructor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
		return typeof (constructor === "function") && (Function.toString.call(constructor) === Function.toString.call(Object));
	};

	/**
	 * Given the name of a function as a string, return the relevant function, if any
	 * Returns undefined, if the reference has not been found
	 * Supports namespaces (if the fully qualified path is passed)
	 * @param {String} path            Fully qualified name of a function
	 * @return {function|undefined}   The javascript reference to the function, undefined if nothing is fund or if it's not a function
	 */
	luga.lookupFunction = function(path){
		if(!path){
			return undefined;
		}
		var reference = luga.lookupProperty(window, path);
		if(luga.type(reference) === "function"){
			return reference;
		}
		return undefined;
	};

	/**
	 * Given an object and a path, returns the property located at the given path
	 * If nothing exists at that location, returns undefined
	 * Supports unlimited nesting levels (if the fully qualified path is passed)
	 * @param {Object} object  Target object
	 * @param {String} path    Dot-delimited string
	 * @return {*|undefined}
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
	 *
	 * @param {Object} target     An object that will receive the new properties
	 * @param {Object} source     An object containing additional properties to merge in
	 */
	luga.merge = function(target, source){
		for(var x in source){
			if(source.hasOwnProperty(x) === true){
				target[x] = source[x];
			}
		}
	};

	/**
	 * Given an object, a path and a value, set the property located at the given path to the given value
	 * If the path does not exists, it creates it
	 * @param {Object} object  Target object
	 * @param {String} path    Fully qualified property name
	 * @param {*}      value
	 */
	luga.setProperty = function(object, path, value){
		var parts = path.split(".");
		if(parts.length === 1){
			object[path] = value;
		}
		while(parts.length > 0){
			var part = parts.shift();
			if(object[part] !== undefined){
				if(parts.length === 0){
					// Update
					object[part] = value;
					break;
				}
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

	var class2type = {};
	["Array", "Boolean", "Date", "Error", "Function", "Number", "Object", "RegExp", "String", "Symbol"].forEach(function(element, i, collection){
		class2type["[object " + element + "]"] = element.toLowerCase();
	});

	/**
	 * Determine the internal JavaScript [[Class]] of an object
	 * Based on jQuery.type()
	 * @param {*} obj
	 * @return {String}
	 */
	luga.type = function(obj){
		if(obj === null){
			return "null";
		}
		var rawType = typeof obj;
		if((rawType === "object") || (rawType === "function")){
			/* http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/ */
			var stringType = Object.prototype.toString.call(obj);
			return class2type[stringType];
		}
		return rawType;
	};

	/**
	 * @typedef {Object} luga.eventObserverMap
	 *
	 * @property {Object} observer
	 * @property {String} methodName
	 */

	luga.NOTIFIER_CONST = {
		ERROR_MESSAGES: {
			NOTIFIER_ABSTRACT: "It's forbidden to use luga.Notifier directly, it must be used as a base class instead",
			INVALID_GENERIC_OBSERVER_PARAMETER: "addObserver(): observer parameter must be an object",
			INVALID_EVENT_OBSERVER_PARAMETER: "addObserver(): eventName and methodName must be strings",
			INVALID_DATA_PARAMETER: "notifyObserver(): data parameter is required and must be an object"
		}
	};

	/**
	 * Provides the base functionality necessary to maintain a list of observers and send notifications to them.
	 * It's forbidden to use this class directly, it can only be used as a base class.
	 * The Notifier class does not define any notification messages, so it is up to the developer to define the notifications sent via the Notifier.
	 * @throw {Exception}
	 */
	luga.Notifier = function(){
		if(this.constructor === luga.Notifier){
			throw(luga.NOTIFIER_CONST.ERROR_MESSAGES.NOTIFIER_ABSTRACT);
		}

		/**
		 * @type {Array.<Object>}
		 */
		this.observers = [];

		/**
		 * @type {Object.<String, Array.<luga.eventObserverMap>>}
		 */
		this.eventObservers = {};

		var prefix = "on";
		var suffix = "Handler";

		// Turns "complete" into "onComplete"
		var generateGenericMethodName = function(eventName){
			var str = prefix;
			str += eventName.charAt(0).toUpperCase();
			str += eventName.substring(1);
			str += suffix;
			return str;
		};

		/**
		 * Register an observer object.
		 * This method is overloaded. You can either invoke it with one or three arguments
		 *
		 * If you only pass one argument, the given object will be registered as "generic" observer
		 * "Generic" observer objects should implement a method that matches a naming convention for the events they are interested in.
		 * For an event named "complete" they must implement a method named: "onCompleteHandler"
		 * The interface for this methods is as follows:
		 * observer.onCompleteHandler = function(data){};
		 *
		 * If you pass three arguments, the first is the object that will be registered as "event" observer
		 * The second argument is the event name
		 * The third argument is the method of the object that will be invoked once the given event is triggered
		 *
		 * The interface for this methods is as follows:
		 * observer[methodName] = function(data){};
		 *
		 * @param  {Object} observer  Observer object
		 * @param {String} [eventName]
		 * @param {String} [methodName]
		 * @throw {Exception}
		 */
		this.addObserver = function(observer, eventName, methodName){
			if(luga.type(observer) !== "object"){
				throw(luga.NOTIFIER_CONST.ERROR_MESSAGES.INVALID_GENERIC_OBSERVER_PARAMETER);
			}
			if(arguments.length === 1){
				this.observers.push(observer);
			}
			if(arguments.length === 3){
				if(luga.type(eventName) !== "string" || luga.type(methodName) !== "string"){
					throw(luga.NOTIFIER_CONST.ERROR_MESSAGES.INVALID_EVENT_OBSERVER_PARAMETER);
				}
				/**
				 * @type {luga.eventObserverMap}
				 */
				var eventMap = {
					observer: observer,
					methodName: methodName
				};
				// First entry for the given event
				if(this.eventObservers[eventName] === undefined){
					this.eventObservers[eventName] = [eventMap];
				}
				else{
					if(findObserverIndex(this.eventObservers[eventName], eventMap) === -1){
						this.eventObservers[eventName].push(eventMap);
					}
				}
			}
		};

		/**
		 * @param {Array.<luga.eventObserverMap>} eventArray
		 * @param {luga.eventObserverMap} eventMap
		 * @return {Number}
		 */
		var findObserverIndex = function(eventArray, eventMap){
			for(var i = 0; i < eventArray.length; i++){
				/**
				 * @type {luga.eventObserverMap}
				 */
				var currentMap = eventArray[i];
				if(currentMap.observer === eventMap.observer && currentMap.methodName === eventMap.methodName){
					return i;
				}
			}
			return -1;
		};

		/**
		 * Sends a notification to all relevant observers
		 *
		 * @method
		 * @param {String}  eventName  Name of the event
		 * @param {Object}  payload    Object containing data to be passed from the point of notification to all interested observers.
		 *                             If there is no relevant data to pass, use an empty object.
		 * @throw {Exception}
		 */
		this.notifyObservers = function(eventName, payload){
			if(luga.type(payload) !== "object"){
				throw(luga.NOTIFIER_CONST.ERROR_MESSAGES.INVALID_DATA_PARAMETER);
			}
			// "Generic" observers
			var genericMethod = generateGenericMethodName(eventName);
			this.observers.forEach(function(element, i, collection){
				if((element[genericMethod] !== undefined) && (luga.type(element[genericMethod]) === "function")){
					element[genericMethod](payload);
				}
			});
			// "Event" observers
			var eventObservers = this.eventObservers[eventName];
			if(eventObservers !== undefined){
				eventObservers.forEach(function(element, i, collection){
					if(luga.type(element.observer[element.methodName]) === "function"){
						element.observer[element.methodName](payload);
					}
				});
			}
		};

		/**
		 * Removes the given observer object.
		 * This method is overloaded. You can either invoke it with one or three arguments
		 *
		 * If you only pass one argument, the given observer will be removed as "generic" observer
		 *
		 * If you pass three arguments, the given observer will be removed as "event" observer associated with the given event and method
		 *
		 * @method
		 * @param {Object} observer
		 * @param {String} [eventName]
		 * @param {String} [methodName]
		 */
		this.removeObserver = function(observer, eventName, methodName){
			if(arguments.length === 1){
				for(var i = 0; i < this.observers.length; i++){
					if(this.observers[i] === observer){
						this.observers.splice(i, 1);
						break;
					}
				}
			}
			if(arguments.length === 3){
				if(this.eventObservers[eventName] !== undefined){
					/**
					 * @type {luga.eventObserverMap}
					 */
					var eventMap = {
						observer: observer,
						methodName: methodName
					};
					var index = findObserverIndex(this.eventObservers[eventName], eventMap);
					// We have a matching entry
					/* istanbul ignore else */
					if(index !== -1){
						this.eventObservers[eventName].splice(index, 1);
						// Delete empty entries
						if(this.eventObservers[eventName].length === 0){
							delete this.eventObservers[eventName];
						}
					}
				}
			}
		};
	};

	/* DOM */

	luga.namespace("luga.dom.nodeIterator");

	/**
	 * Static factory to create a cross-browser either DOM NodeIterator or TreeWalker
	 *
	 * @param {String}                   type. Either "NodeIterator" or "TreeWalker"
	 * @param {HTMLElement}              rootNode    Start node. Required
	 * @param {function} [filterFunc]    Optional filter function.
	 * @return {NodeIterator|TreeWalker}
	 */
	var getIteratorInstance = function(type, rootNode, filterFunc){

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
		if(type === "TreeWalker"){
			return document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT, safeFilter, false);
		}
		else{
			return document.createNodeIterator(rootNode, NodeFilter.SHOW_ELEMENT, safeFilter, false);
		}

	};

	/**
	 * Static factory to create a cross-browser DOM NodeIterator
	 * https://developer.mozilla.org/en-US/docs/Web/API/NodeIterator
	 *
	 * @param {HTMLElement}              rootNode    Start node. Required
	 * @param {function} [filterFunc]    Optional filter function. If specified only nodes matching the filter will be accepted
	 *                                   The function will be invoked with this signature: filterFunc(node). Must return true|false
	 * @return {NodeIterator}
	 */
	luga.dom.nodeIterator.getInstance = function(rootNode, filterFunc){
		return getIteratorInstance("NodeIterator", rootNode, filterFunc);
	};

	luga.namespace("luga.dom.treeWalker");

	/**
	 * Static factory to create a cross-browser DOM TreeWalker
	 * https://developer.mozilla.org/en/docs/Web/API/TreeWalker
	 *
	 * @param {HTMLElement}              rootNode    Start node. Required
	 * @param {function} [filterFunc]    filterFunc  Optional filter function. If specified only nodes matching the filter will be accepted
	 *                                   The function will be invoked with this signature: filterFunc(node). Must return true|false
	 * @return {TreeWalker}
	 */
	luga.dom.treeWalker.getInstance = function(rootNode, filterFunc){
		return getIteratorInstance("TreeWalker", rootNode, filterFunc);
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
	 * @param {jQuery}   rootNode     jQuery object wrapping the root node
	 * @param {Boolean}  demoronize   MS Word's special chars are replaced with plausible substitutes. Default to false
	 * @return {Object}              A JavaScript object containing name/value pairs
	 * @throw {Exception}
	 */
	luga.form.toMap = function(rootNode, demoronize){

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
					else if(Array.isArray(map[fieldName]) === true){
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
	 * @param {jQuery} rootNode  jQuery object wrapping the form fields
	 * @return {json}
	 */
	luga.form.toJson = function(rootNode){
		var flatData = luga.form.toMap(rootNode);
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
	 * @param {jQuery}   rootNode     jQuery object wrapping the root node
	 * @param {Boolean}  demoronize   If set to true, MS Word's special chars are replaced with plausible substitutes. Default to false
	 * @return {String}               A URI encoded string
	 * @throw {Exception}
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
	 * @param {jQuery}  fieldNode
	 * @return {Boolean}
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
	 * @param {jQuery}  fieldNode
	 * @return {Boolean}
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
	 * @param {String} name         Name of the field. Mandatory
	 * @param {jQuery} [rootNode]   Root node, optional, default to document
	 * @return {jQuery}
	 */
	luga.form.utils.getFieldGroup = function(name, rootNode){
		var selector = "input[name='" + name + "']";
		return jQuery(selector, rootNode);
	};

	/**
	 * Returns an array of input fields contained inside a given root node
	 *
	 * @param {jQuery}  rootNode   Root node
	 * @return {Array.<jquery>}
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

	luga.namespace("luga.localStorage");

	/**
	 * Retrieve from localStorage the string corresponding to the given combination of root and path
	 * Returns undefined if nothing matches the given root/path
	 * @param {String} root    Top-level key inside localStorage
	 * @param {String} path    Dot-delimited string
	 * @return {*|undefined}
	 */
	luga.localStorage.retrieve = function(root, path){
		return luga.lookupProperty(getRootState(root), path.toString());
	};

	/**
	 * Persist the given string inside localStorage, under the given combination of root and path
	 * The ability to pass a dot-delimited path allow to protect the information from name clashes
	 * @param {String} root    Top-level key inside localStorage
	 * @param {String} path    Dot-delimited string
	 * @param {String} value   String to be persisted
	 */
	luga.localStorage.persist = function(root, path, value){
		var json = getRootState(root);
		luga.setProperty(json, path.toString(), value);
		setRootState(root, json);
	};

	var setRootState = function(root, json){
		localStorage.setItem(root, JSON.stringify(json));
	};

	var getRootState = function(root){
		var rootJson = localStorage.getItem(root);
		if(rootJson === null){
			return {};
		}
		return JSON.parse(rootJson);
	};

	luga.namespace("luga.string");

	/**
	 * Replace MS Word's non-ISO characters with plausible substitutes
	 *
	 * @param {String} str   String containing MS Word's garbage
	 * @return {String}      The de-moronized string
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
	 * @param  {String}  str                   String containing placeholders
	 * @param  {Object|Array.<String>} args    Either an array of strings or an objects containing name/value pairs in string format
	 * @return {String} The newly assembled string
	 */
	luga.string.format = function(str, args){
		var pattern = null;
		if(Array.isArray(args) === true){
			for(var i = 0; i < args.length; i++){
				pattern = new RegExp("\\{" + i + "\\}", "g");
				str = str.replace(pattern, args[i]);
			}
		}
		if(luga.isPlainObject(args) === true){
			for(var x in args){
				pattern = new RegExp("\\{" + x + "\\}", "g");
				str = str.replace(pattern, args[x]);
			}
		}
		return str;
	};

	/**
	 * Given a string in querystring format, return a JavaScript object containing name/value pairs
	 * @param {String} str  The querystring
	 * @return {Object}
	 */
	luga.string.queryToMap = function(str){
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
			else if(Array.isArray(map[fieldName]) === true){
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
	 * populating the placeholders with the strings contained inside the second argument keys
	 * Unlike luga.string.format, placeholders can match nested properties too. But it's slower
	 *
	 * Example:
	 * luga.string.format("My name is {firstName} {lastName}", {firstName: "Ciccio", lastName: "Pasticcio"});
	 * => "My name is Ciccio Pasticcio"
	 *
	 * Example with nested properties:
	 * var nestedObj = { type: "people", person: { firstName: "Ciccio", lastName: "Pasticcio" } };
	 * luga.string.populate("My name is {person.firstName} {person.lastName}", nestedObj)
	 * => "My name is Ciccio Pasticcio"
	 *
	 * @param  {String} str   String containing placeholders
	 * @param  {Object} obj   An objects containing name/value pairs in string format
	 * @return {String} The newly assembled string
	 */
	luga.string.populate = function(str, obj){
		if(luga.isPlainObject(obj) === true){
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
	 * @param {jQuery} node
	 * @return {String}
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
	 * @param {jQuery}  node   Target node
	 */
	luga.utils.removeDisplayBox = function(node){
		var boxId = generateBoxId(jQuery(node));
		var oldBox = jQuery("#" + boxId);
		// If an error display is already there, get rid of it
		/* istanbul ignore else */
		if(oldBox.length > 0){
			oldBox.remove();
		}
	};

	/**
	 * Display a message box above a given node
	 * @param {jQuery}  node   Target node
	 * @param {String}  html   HTML/Text code to inject
	 * @return {jQuery}
	 */
	luga.utils.displayMessage = function(node, html){
		return luga.utils.displayBox(node, html, luga.utils.CONST.CSS_CLASSES.MESSAGE);
	};

	/**
	 * Display an error box above a given node
	 * @param {jQuery}  node   Target node
	 * @param {String}  html   HTML/Text code to inject
	 * @return {jQuery}
	 */
	luga.utils.displayErrorMessage = function(node, html){
		return luga.utils.displayBox(node, html, luga.utils.CONST.CSS_CLASSES.ERROR_MESSAGE);
	};

	/**
	 * Display a box with a message associated with a given node
	 * Overwrite this method if you want to change the way luga.utils.displayMessage and luga.utils.displayErrorMessage behaves
	 * @param {jQuery}  node                       Target node
	 * @param {String}  html                       HTML/Text code to inject
	 * @param {String}  [cssClass="luga_message"]  CSS class attached to the box. Default to "luga_message"
	 * @return {jQuery}
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

	/* XHR */

	luga.namespace("luga.xhr");

	/**
	 * @typedef {Object} luga.xhr.header
	 *
	 * @property {String}  header       Name of the HTTP header
	 * @property {String}  value        Value to be used
	 */

	/**
	 * @typedef {Object} luga.xhr.options
	 *
	 * @property {String}  method                   HTTP method. Default to GET
	 * @property {Number}  timeout                  The number of milliseconds a request can take before automatically being terminated
	 * @property {Boolean} async                    Indicate that the request should be handled asynchronously. Default to true
	 * @property {Boolean} cache                    If set to false, it will force requested pages not to be cached by the browser. Will only work correctly with HEAD and GET requests
	 *                                              It works by appending "_={timestamp}" to the GET parameters. Default to true
	 * @property {Array.<luga.xhr.header>} headers  An array of header/value pairs to be used for the request. Default to an empty array
	 * @property {String}  requestedWith            Value to be used for the "X-Requested-With" request header. Default to "XMLHttpRequest"
	 * @property {String}  contentType              MIME type to use instead of the one specified by the server. Default to "text/plain"
	 *                                              See also: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/overrideMimeType
	 */

	var xhrSettings = {
		method: "GET",
		timeout: 5000,
		async: true,
		cache: true,
		headers: [],
		requestedWith: "XMLHttpRequest",
		contentType: "text/plain"
	};

	luga.XHR_CONST = {
		POST_CONTENT_TYPE : "application/x-www-form-urlencoded"
	};

	/**
	 * Change current configuration
	 * @param {luga.xhr.options} options
	 * @return {luga.xhr.options}
	 */
	luga.xhr.setup = function(options){
		luga.merge(xhrSettings, options);
		return xhrSettings;
	};

	luga.xhr.Request = function(options){
		var config = luga.xhr.setup();
		if(options !== undefined) {
			config = luga.merge(config, options);
		}
		if(config.method.toUpperCase() === "POST") {
			config.method = luga.XHR_CONST.POST_CONTENT_TYPE;
		}

		var self = this;
		self.request = new XMLHttpRequest();

		this.send = function(url, params) {
			if(params === undefined){
				params = null;
			}
			// TODO add anti-cache

			self.request.open(config.method, url, config.async);

			self.request.timeout = config.timeout;
			self.request.setRequestHeader("Content-Type", config.contentType);
			self.request.setRequestHeader("X-Requested-With", config.requestedWith);
			config.headers.forEach(function(item){
				self.request.setRequestHeader(item.header, item.value);
			});

			self.request.send(params);
		};

	};

}());