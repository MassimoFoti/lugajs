if(typeof(luga) === "undefined"){
	throw("Unable to find Luga JS Core");
}

/**
 * @typedef {object} luga.data.dataSourceChanged
 *
 * @property {luga.data.DataSet|luga.data.DetailSet} dataSource
 */

(function(){
	"use strict";

	luga.namespace("luga.data");

	luga.data.version = "0.2.5";
	/** @type {hash.<luga.data.DataSet>} */
	luga.data.dataSourceRegistry = {};

	luga.data.CONST = {
		PK_KEY: "rowId",
		PK_KEY_PREFIX: "lugaPk_",
		COL_TYPES: ["date", "number", "string"],
		DEFAULT_REGION_TYPE: "luga.data.region.Handlebars",
		CUSTOM_ATTRIBUTES: {
			REGION: "data-lugads-region",
			REGION_TYPE: "data-lugads-regiontype",
			TEMPLATE: "data-lugads-template",
			DATA_SOURCE: "data-lugads-datasource"
		},
		EVENTS: {
			CURRENT_ROW_CHANGED: "currentRowChanged",
			DATA_CHANGED: "dataChanged",
			DATA_SORTED: "dataSorted",
			DATA_LOADING: "dataLoading",
			PRE_DATA_SORTED: "preDataSorted",
			STATE_CHANGED: "stateChanged",
			XHR_ERROR: "xhrError"
		},
		SELECTORS: {
			REGION: "*[data-lugads-region]"
		},
		ERROR_MESSAGES: {
			INVALID_STATE: "luga.data.utils.assembleStateDescription: Unsupported state: {0}",
			MISSING_DATA_SOURCE_ATTRIBUTE: "Missing required data-lugads-datasource attribute inside region",
			MISSING_DATA_SOURCE: "Unable to find datasource {0}",
			MISSING_REGION_TYPE_FUNCTION: "Failed to create region. Unable to find a constructor function named: {0}"
		},
		USER_AGENT: "luga.data",
		XHR_TIMEOUT: 10000 // Keep this accessible to everybody
	};

	/**
	 * Returns a dataSource from the registry
	 * Returns null if no source matches the given id
	 * @param {string} id
	 * @returns {luga.data.DataSet|luga.data.DetailSet}
	 */
	luga.data.getDataSource = function(id){
		if(luga.data.dataSourceRegistry[id] !== undefined){
			return luga.data.dataSourceRegistry[id];
		}
		return null;
	};

	/**
	 * Adds a dataSource inside the registry
	 * @param {string}                                id
	 * @param {luga.data.DataSet|luga.data.DetailSet} dataSource
	 */
	luga.data.setDataSource = function(id, dataSource){
		luga.data.dataSourceRegistry[id] = dataSource;
	};

	/**
	 * Given a jQuery object wrapping an HTML node, initialize the relevant Region handler
	 * @param {jquery} node
	 * @throws
	 */
	luga.data.initRegion = function(node){
		var dataSourceId = node.attr(luga.data.CONST.CUSTOM_ATTRIBUTES.DATA_SOURCE);
		if(dataSourceId === undefined){
			throw(luga.data.CONST.ERROR_MESSAGES.MISSING_DATA_SOURCE_ATTRIBUTE);
		}
		var dataSource = luga.data.getDataSource(dataSourceId);
		if(dataSource === null){
			throw(luga.string.format(luga.data.CONST.ERROR_MESSAGES.MISSING_DATA_SOURCE, [dataSourceId]));
		}
		var regionType = node.attr(luga.data.CONST.CUSTOM_ATTRIBUTES.REGION_TYPE);
		if(regionType === undefined){
			regionType = luga.data.CONST.DEFAULT_REGION_TYPE;
		}
		var RegionClass = luga.lookupFunction(regionType);
		if(RegionClass === undefined){
			throw(luga.string.format(luga.data.CONST.ERROR_MESSAGES.MISSING_REGION_TYPE_FUNCTION, [regionType]));
		}
		new RegionClass({node: node});
	};

	/**
	 * @typedef {string} luga.data.STATE
	 * @enum {string}
	 */
	luga.data.STATE = {
		ERROR: "error",
		LOADING: "loading",
		READY: "ready"
	};

	luga.namespace("luga.data.utils");

	/**
	 * @typedef {object} luga.data.stateDescription
	 *
	 * @property {null|luga.data.STATE}  state
	 * @property {boolean}          isStateLoading
	 * @property {boolean}          isStateError
	 * @property {boolean}          isStateReady
	 */

	/**
	 * Given a state string, returns an object containing a boolean field for each possible state
	 * @param {null|luga.data.STATE} state
	 * @returns {luga.data.stateDescription}
	 */
	luga.data.utils.assembleStateDescription = function(state){
		if((state !== null) && (luga.data.utils.isValidState(state) === false)){
			throw(luga.string.format(luga.data.CONST.ERROR_MESSAGES.INVALID_STATE, [state]));
		}
		return {
			state: state,
			isStateError: (state === luga.data.STATE.ERROR),
			isStateLoading: (state === luga.data.STATE.LOADING),
			isStateReady: (state === luga.data.STATE.READY)
		};
	};

	/**
	 * Return true if the passed state is supported
	 * @param {string}  state
	 * @returns {boolean}
	 */
	luga.data.utils.isValidState = function(state){
		for(var key in luga.data.STATE){
			if(luga.data.STATE[key] === state){
				return true;
			}
		}
		return false;
	};

	luga.namespace("luga.data.region");

	jQuery(document).ready(function(){
		jQuery(luga.data.CONST.SELECTORS.REGION).each(function(index, item){
			luga.data.initRegion(jQuery(item));
		});
	});

}());