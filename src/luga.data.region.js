(function(){
	"use strict";

	luga.namespace("luga.data.region");

	luga.data.region.CONST = {
		CUSTOM_ATTRIBUTES: {
			DATA_SOURCE: "data-lugads-datasource",
			REGION: "data-lugads-region",
			REGION_REFERENCE: "luga-region-reference",
			REGION_TYPE: "data-lugads-regiontype",
			TEMPLATE: "data-lugads-template",
			TRAITS: "data-lugads-traits"
		},
		DEFAULT_REGION_TYPE: "luga.data.region.Handlebars",
		DEFAULT_TRAITS: [
			"luga.data.region.traits.select",
			"luga.data.region.traits.setRowId",
			"luga.data.region.traits.setRowIndex",
			"luga.data.region.traits.sort"
		],
		ERROR_MESSAGES: {
			MISSING_DATA_SOURCE_ATTRIBUTE: "Missing required data-lugads-datasource attribute inside region",
			MISSING_DATA_SOURCE: "Unable to find datasource {0}",
			MISSING_REGION_TYPE_FUNCTION: "Failed to create region. Unable to find a constructor function named: {0}"
		},
		EVENTS: {
			REGION_RENDERED: "regionRendered"
		},
		SELECTORS: {
			REGION: "*[data-lugads-region]"
		}
	};

	/**
	 * Given a jQuery object wrapping an HTML node, returns the region object associated to it
	 * Returns undefined if the node is not a region
	 * @param {jquery} node
	 * @returns {undefined|luga.data.region.Base}
	 */
	luga.data.region.getReferenceFromNode = function(node){
		return node.data(luga.data.region.CONST.CUSTOM_ATTRIBUTES.REGION_REFERENCE);
	};

	/**
	 * Given a jQuery object wrapping an HTML node, initialize the relevant Region handler
	 * @param {jquery} node
	 * @throws
	 */
	luga.data.region.init = function(node){
		var dataSourceId = node.attr(luga.data.region.CONST.CUSTOM_ATTRIBUTES.DATA_SOURCE);
		if(dataSourceId === undefined){
			throw(luga.data.region.CONST.ERROR_MESSAGES.MISSING_DATA_SOURCE_ATTRIBUTE);
		}
		var dataSource = luga.data.getDataSource(dataSourceId);
		if(dataSource === null){
			throw(luga.string.format(luga.data.region.CONST.ERROR_MESSAGES.MISSING_DATA_SOURCE, [dataSourceId]));
		}
		var regionType = node.attr(luga.data.region.CONST.CUSTOM_ATTRIBUTES.REGION_TYPE);
		if(regionType === undefined){
			regionType = luga.data.region.CONST.DEFAULT_REGION_TYPE;
		}
		var RegionClass = luga.lookupFunction(regionType);
		if(RegionClass === undefined){
			throw(luga.string.format(luga.data.region.CONST.ERROR_MESSAGES.MISSING_REGION_TYPE_FUNCTION, [regionType]));
		}
		new RegionClass({node: node});
	};

	luga.namespace("luga.data.region.utils");

	/**
	 * @typedef {object} luga.data.region.description
	 *
	 * @property {jquery}                                node   A jQuery object wrapping the node containing the region.
	 * @property {luga.data.DataSet|luga.data.DetailSet} ds     DataSource
	 */

	/**
	 * Given a region instance, returns an object containing its critical data
	 * @param {luga.data.region.Base} region
	 * @returns {luga.data.region.description}
	 */
	luga.data.region.utils.assembleRegionDescription = function(region){
		return {
			node: region.config.node,
			ds: region.dataSource
		};
	};

	jQuery(document).ready(function(){
		jQuery(luga.data.region.CONST.SELECTORS.REGION).each(function(index, item){
			luga.data.region.init(jQuery(item));
		});
	});

}());