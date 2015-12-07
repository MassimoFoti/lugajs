describe("luga.data.Dataset", function(){

	"use strict";

	var baseDs, loadedDs, testRecords, removeUk, removeAus, removeBrasil, removeAll, testObserver;
	beforeEach(function(){

		baseDs = new luga.data.DataSet({id: "test"});
		testRecords = getJSONFixture("data/ladies.json");
		loadedDs = new luga.data.DataSet({id: "myDs", records: testRecords});

		removeUk = function(dataSet, row, rowIndex){
			if(row.country === "UK"){
				return null;
			}
			return row;
		};
		removeAus = function(dataSet, row, rowIndex){
			if(row.country === "Australia"){
				return null;
			}
			return row;
		};
		removeBrasil = function(dataSet, row, rowIndex){
			if(row.country === "Brasil"){
				return null;
			}
			return row;
		};
		removeAll = function(dataSet, row, rowIndex){
			return null;
		};

		testObserver = {
			onDataChangedHandler: function(){
			},
			onCurrentRowChangedHandler: function(){
			}
		};
		baseDs.addObserver(testObserver);
		spyOn(testObserver, "onDataChangedHandler");
		spyOn(testObserver, "onCurrentRowChangedHandler");
	});

	it("Is the base dataSet class", function(){
		expect(jQuery.isFunction(luga.data.DataSet)).toBeTruthy();
	});

	it("Implements the Notifier interface", function(){
		expect(jQuery.isFunction(baseDs.addObserver)).toBeTruthy();
		expect(jQuery.isFunction(baseDs.notifyObservers)).toBeTruthy();
		expect(jQuery.isArray(baseDs.observers)).toBeTruthy();
	});

	describe("Accepts an Options object as single argument", function(){

		describe("options.id", function(){
			it("Acts as unique identifier that will be stored inside a global registry", function(){
				var ds = new luga.data.DataSet({id: "myDs"});
				expect(luga.data.dataSourceRegistry.myDs).toEqual(ds);
			});
			it("Throws an exception if not specified", function(){
				expect(function(){
					new luga.data.DataSet({});
				}).toThrow();
			});
		});

		describe("options.filter", function(){
			it("Is null by default", function(){
				expect(baseDs.filter).toBeNull();
			});

			it("Will cause the filter to be applied as soon as any record is loaded", function(){
				var filteredDs = new luga.data.DataSet({id: "test", filter: removeAus});
				filteredDs.insert(testRecords);
				expect(testRecords.length).toEqual(7);
				// Minus one, since Aussies get filtered out
				expect(filteredDs.getRecordsCount()).toEqual(6);
			});

			it("Throws an exception if the passed filter is not a function", function(){
				expect(function(){
					var ds = new luga.data.DataSet({id: "myDs", filter: "test"});
				}).toThrow();
			});
		});

		describe("options.records", function(){
			it("Pre-load data inside the dataSet", function(){
				var ds = new luga.data.DataSet({id: "myDs", records: testRecords});
				expect(ds.select()).toEqual(testRecords);
			});
			it("If not specified the dataSet is empty", function(){
				expect(baseDs.records).toEqual([]);
				expect(baseDs.select().length).toEqual(0);
			});
			describe("Can be either:", function(){
				it("An array of name/value pairs", function(){
					var arrayRecords = [];
					arrayRecords.push({name: "Nicole"});
					arrayRecords.push({name: "Kate"});
					var ds = new luga.data.DataSet({id: "myDs", records: arrayRecords});
					expect(ds.records).toEqual(arrayRecords);
					expect(ds.getRecordsCount()).toEqual(2);
				});
				it("Or a single object containing value/name pairs", function(){
					var recObj = {name: "Ciccio", lastname: "Pasticcio"};
					var ds = new luga.data.DataSet({id: "myDs", records: recObj});
					expect(ds.select().length).toEqual(1);
				});
			});

			describe("Throws an exception if:", function(){
				it("The passed array contains one primitive value", function(){
					var arrayRecords = [];
					arrayRecords.push({name: "Nicole"});
					// Simple value!
					arrayRecords.push("Kate");
					expect(function(){
						var ds = new luga.data.DataSet({id: "myDs", records: arrayRecords});
					}).toThrow();
				});
				it("The passed single object is a primitive value", function(){
					expect(function(){
						var ds = new luga.data.DataSet({id: "myDs", records: "test"});
					}).toThrow();
				});
			});
		});

	});

	describe("Once initialized", function(){
		it("Calls luga.data.setDataSource()", function(){
			spyOn(luga.data, "setDataSource").and.callFake(function(){
			});
			var ds = new luga.data.DataSet({id: "test"});
			expect(luga.data.setDataSource).toHaveBeenCalledWith("test", ds);
		});
	});

	describe(".clearFilter()", function(){
		beforeEach(function(){
			baseDs.insert(testRecords);
			baseDs.setFilter(removeUk);
		});

		describe("First:", function(){
			it("Deletes current filter", function(){
				expect(baseDs.getRecordsCount()).toEqual(5);
				baseDs.clearFilter();
				expect(baseDs.filter).toBeNull();
			});
		});
		describe("Then:", function(){
			it("Resets the records to their unfiltered status", function(){
				baseDs.clearFilter();
				expect(baseDs.getRecordsCount()).toEqual(7);
				expect(baseDs.select()).toEqual(testRecords);
			});
		});
		describe("Finally:", function(){
			it("Triggers a 'dataChanged' notification", function(){
				baseDs.clearFilter();
				expect(testObserver.onDataChangedHandler).toHaveBeenCalledWith({dataSource: baseDs});
			});
		});

	});

	describe(".delete()", function(){

		it("Delete all records", function(){
			baseDs.insert(testRecords);
			expect(baseDs.getRecordsCount()).toEqual(7);
			baseDs.delete();
			expect(baseDs.getRecordsCount()).toEqual(0);
		});

		describe("Accepts an optional filter function as an argument", function(){
			it("If specified only records matching the filter will be deleted", function(){
				var ds = new luga.data.DataSet({id: "myDs", records: testRecords});
				ds.delete(removeUk);
				expect(ds.getRecordsCount()).toEqual(5);
			});
			it("Throws an exception if the passed filter is not a function", function(){
				expect(function(){
					baseDs.delete("test");
				}).toThrow();
			});
		});

		describe("First:", function(){
			it("Reset the currentRow", function(){
				spyOn(baseDs, "resetCurrentRow").and.callFake(function(){
				});
				baseDs.insert(testRecords);
				baseDs.delete();
				expect(baseDs.resetCurrentRow).toHaveBeenCalled();
			});
		});

		describe("Then:", function(){
			it("Triggers a 'dataChanged' notification", function(){
				baseDs.insert(testRecords);
				baseDs.delete();
				expect(testObserver.onDataChangedHandler).toHaveBeenCalledWith({dataSource: baseDs});
			});
		});

	});

	describe(".getContext()", function(){

		it("Returns an object with the 'context' key containing current records", function(){
			baseDs.insert(testRecords);
			expect(baseDs.getContext()).toEqual({context: baseDs.select()});
		});

	});

	describe(".getCurrentRow()", function(){

		it("Returns first row object on a newly created dataSet", function(){
			baseDs.insert(testRecords);
			expect(baseDs.getCurrentRow()).toEqual(baseDs.recordsHash["lugaPk_0"]);
		});
		it("Returns the current row object if it was changed at run-time", function(){
			baseDs.insert(testRecords);
			baseDs.setCurrentRowId("lugaPk_2");
			expect(baseDs.getCurrentRow()).toEqual(baseDs.recordsHash["lugaPk_2"]);
		});

		describe("Returns the first row among filtered records if:", function(){
			it("The dataSet has a filter associated with it", function(){
				var noAussieDs = new luga.data.DataSet({id: "test", filter: removeAus});
				noAussieDs.insert(testRecords);
				expect(noAussieDs.getCurrentRow()).toEqual(noAussieDs.filteredRecords[0]);
			});
			it("A filter is set at run-time", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRow()).toEqual(baseDs.recordsHash["lugaPk_0"]);
				baseDs.setFilter(removeAus);
				expect(baseDs.getCurrentRow()).toEqual(baseDs.filteredRecords[0]);
			});
		});

		describe("Returns null if:", function(){
			it("The dataSet is empty", function(){
				expect(baseDs.getCurrentRow()).toBeNull();
			});
			it("All the records are filtered out", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRow()).toEqual(baseDs.recordsHash["lugaPk_0"]);
				baseDs.setFilter(removeAll);
				expect(baseDs.getCurrentRow()).toBeNull();
			});
		});

	});

	describe(".getCurrentRowId()", function(){

		it("Returns the rowId of the current row", function(){
			baseDs.insert(testRecords);
			baseDs.setCurrentRowId("lugaPk_2");
			expect(baseDs.getCurrentRowId()).toEqual("lugaPk_2");
		});

		describe("Returns zero if:", function(){
			it("Records are added to the dataSet", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRowId()).toEqual("lugaPk_0");
			});
			it("A filter was just applied to the dataSet", function(){
				baseDs.insert(testRecords);
				baseDs.setCurrentRowId("lugaPk_2");
				baseDs.setFilter(removeUk);
				expect(baseDs.getCurrentRowId()).toEqual("lugaPk_0");
			});
		});

		describe("Returns null if:", function(){
			it("The dataSet is empty", function(){
				expect(baseDs.getCurrentRowId()).toBeNull();
			});
			it("All the records are filtered out", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRow()).toEqual(baseDs.recordsHash["lugaPk_0"]);
				baseDs.setFilter(removeAll);
				expect(baseDs.getCurrentRowId()).toBeNull();
			});
		});
	});

	describe(".getCurrentRowIndex()", function(){

		it("Returns a zero-based index at which the current row can be found", function(){
			baseDs.insert(testRecords);
			baseDs.setCurrentRowId("lugaPk_2");
			expect(baseDs.getCurrentRowIndex()).toEqual(2);
		});

		describe("Returns 0 if:", function(){
			it("Records are added to the dataSet", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRowIndex()).toEqual(0);
			});
			it("A filter was just applied to the dataSet", function(){
				baseDs.insert(testRecords);
				baseDs.setCurrentRowId("lugaPk_2");
				baseDs.setFilter(removeUk);
				expect(baseDs.getCurrentRowIndex()).toEqual(0);
			});
		});

		describe("Returns -1 if:", function(){
			it("The dataSet is empty", function(){
				expect(baseDs.getCurrentRowIndex()).toEqual(-1);
			});
			it("All the records are filtered out", function(){
				baseDs.insert(testRecords);
				expect(baseDs.getCurrentRowIndex()).toEqual(0);
				baseDs.setFilter(removeAll);
				expect(baseDs.getCurrentRowIndex()).toEqual(-1);
			});
		});
	});

	describe(".getRecordsCount()", function(){
		it("Returns the number of records in the dataSet", function(){
			baseDs.insert(testRecords);
			expect(baseDs.getRecordsCount()).toEqual(7);
		});
		it("If the dataSet has a filter, returns the number of filtered records", function(){
			baseDs.insert(testRecords);
			baseDs.setFilter(removeUk);
			expect(baseDs.getRecordsCount()).toEqual(5);
		});
		it("Returns zero on an empty dataSet", function(){
			expect(baseDs.getRecordsCount()).toEqual(0);
		});
	});

	describe(".getRowById()", function(){
		it("Returns the row object associated with the given rowId", function(){
			baseDs.insert(testRecords);
			var row = baseDs.getRowById("lugaPk_2");
			expect(row).toEqual(testRecords[2]);
		});
		describe("Returns null if:", function(){
			it("The dataSet is empty", function(){
				var row = baseDs.getRowById(2);
				expect(row).toBeNull();
			});
			it("No available record matches the given rowId", function(){
				baseDs.insert(testRecords);
				var row = baseDs.getRowById(99);
				expect(row).toBeNull();
			});
		});
	});

	describe(".getRowByIndex()", function(){

		describe("Given a zero-based index:", function(){

			describe("Returns the row object at the given index:", function(){
				it("Among records", function(){
					baseDs.insert(testRecords);
					expect(baseDs.getRowByIndex(2)).toEqual(testRecords[2]);
				});
				it("Or filtered records", function(){
					baseDs.insert(testRecords);
					baseDs.setFilter(removeAus);
					expect(baseDs.getRowByIndex(2)).toEqual(testRecords[3]);
				});
			});

			describe("Throws an exception if:", function(){
				it("The dataSet is empty", function(){
					expect(function(){
						baseDs.getRowByIndex(1);
					}).toThrow();
				});
				it("The given index is out of range", function(){
					baseDs.insert(testRecords);
					expect(function(){
						baseDs.getRowByIndex(99);
					}).toThrow();
				});
			});
		});

	});

	describe(".getRowIndex()", function(){

		describe("Given a row:", function(){

			describe("Returns a zero-based index at which a row can be found:", function(){
				it("Among records", function(){
					var row = loadedDs.getRowById("lugaPk_2"); // Jennifer
					expect(loadedDs.getRowIndex(row)).toEqual(2);
				});
				it("Or filtered records", function(){
					baseDs.insert(testRecords);
					baseDs.setFilter(removeUk);
					var row = baseDs.getRowById("lugaPk_2");
					expect(loadedDs.getRowIndex(row)).toEqual(2);
				});
			});

			describe("Returns -1 if:", function(){
				it("The dataSet is empty", function(){
					var row = loadedDs.getRowById(2);
					expect(baseDs.getRowIndex(row)).toEqual(-1);
				});
				it("No available record matches the given row", function(){
					var arrayRecords = [];
					arrayRecords.push({name: "Nicole"});
					arrayRecords.push({name: "Kate"});
					var ds = new luga.data.DataSet({id: "myDs", records: arrayRecords});
					var row = loadedDs.getRowById(2);
					expect(ds.getRowIndex(row)).toEqual(-1);
				});
			});
		});

	});

	describe(".getSortColumn()", function(){

		describe("If no sort operation has been performed yet:", function(){
			it("Returns an empty string ", function(){
				expect(baseDs.getSortColumn()).toEqual("");
			});
		});

		describe("Else:", function(){
			it("Returns the name of the column most recently used for sorting", function(){
				loadedDs.sort("firstName")
				expect(loadedDs.getSortColumn()).toEqual("firstName");
				loadedDs.sort("country")
				expect(loadedDs.getSortColumn()).toEqual("country");
			});
		});

	});

	describe(".getSortOrder()", function(){

		describe("If no sort operation has been performed yet:", function(){
			it("Returns an empty string ", function(){
				expect(baseDs.getSortOrder()).toEqual("");
			});
		});

		describe("Else:", function(){
			it("Returns the most recently used sort order", function(){
				loadedDs.sort("firstName")
				expect(loadedDs.getSortOrder()).toEqual("ascending");
				loadedDs.sort("firstName")
				expect(loadedDs.getSortOrder()).toEqual("descending");
			});
		});

	});

	describe(".insert()", function(){

		it("Adds records to a dataSet", function(){
			baseDs.insert({firstName: "Nicole", lastName: "Kidman"});
			baseDs.insert({firstName: "Elisabeth", lastName: "Banks"});
			expect(baseDs.getRecordsCount()).toEqual(2);
		});
		it("Fires a 'dataChanged' notification. Sending the whole dataSet along the way", function(){
			baseDs.insert(testRecords);
			expect(testObserver.onDataChangedHandler).toHaveBeenCalled();
			expect(testObserver.onDataChangedHandler).toHaveBeenCalledWith({dataSource: baseDs});
		});
		it("Automatically add a PK field that is the equivalent of the row's index within the array", function(){
			baseDs.insert(testRecords);
			expect(baseDs.records[0][luga.data.CONST.PK_KEY]).toEqual("lugaPk_0");
			expect(baseDs.records[6][luga.data.CONST.PK_KEY]).toEqual("lugaPk_6");
		});

		describe("Accepts either:", function(){
			it("An array of name/value pairs", function(){
				expect(baseDs.getRecordsCount()).toEqual(0);
				baseDs.insert(testRecords);
				expect(baseDs.getRecordsCount()).toEqual(7);
			});
			it("Or a single object containing value/name pairs", function(){
				expect(baseDs.getRecordsCount()).toEqual(0);
				baseDs.insert({firstName: "Nicole", lastName: "Kidman"});
				expect(baseDs.getRecordsCount()).toEqual(1);
			});
		});

		describe("Throws an exception if:", function(){
			it("The passed array contains one primitive value", function(){
				var arrayRecords = [];
				arrayRecords.push({name: "Nicole"});
				// Simple value!
				arrayRecords.push("Kate");
				expect(function(){
					baseDs.insert(arrayRecords);
				}).toThrow();
			});
			it("The passed single object is a primitive value", function(){
				expect(function(){
					baseDs.insert(new Date());
				}).toThrow();
			});
		});

	});

	describe(".resetCurrentRow()", function(){

		it("Set currentRowId to 'lugaPk_0'", function(){
			baseDs.insert(testRecords);
			baseDs.setCurrentRowId("lugaPk_2");
			baseDs.resetCurrentRow();
			expect(baseDs.getCurrentRowId()).toEqual("lugaPk_0");
		});

		it("Set currentRowId to the rowId of the first filtered record if the dataSet is associated with a filter", function(){
			var noAussieDs = new luga.data.DataSet({id: "test", filter: removeAus});
			noAussieDs.insert(testRecords);
			expect(noAussieDs.getCurrentRowId()).toEqual("lugaPk_1");
			noAussieDs.setCurrentRowId("lugaPk_2");
			expect(noAussieDs.getCurrentRowId()).toEqual("lugaPk_2");
			noAussieDs.resetCurrentRow();
			expect(noAussieDs.getCurrentRowId()).toEqual("lugaPk_1");
		});

		describe("Set currentRowId to null if:", function(){
			it("The dataSet is empty", function(){
				baseDs.resetCurrentRow();
				expect(baseDs.getCurrentRowId()).toBeNull();
			});
			it("All the records are filtered out", function(){
				baseDs.insert(testRecords);
				baseDs.setFilter(removeAll);
				baseDs.resetCurrentRow();
				expect(baseDs.getCurrentRowId()).toBeNull();
			});
		});

	});

	describe(".select()", function(){
		it("Returns an array of the internal row objects stored inside the dataSet", function(){
			var ds = new luga.data.DataSet({id: "myDs", records: testRecords});
			expect(ds.select()).toEqual(testRecords);
			expect(ds.select().length).toEqual(7);
		});
		it("If the dataSet contains a filter function, returns the row objects matching the filter", function(){
			var ds = new luga.data.DataSet({id: "myDs", records: testRecords, filter: removeUk});
			expect(ds.select().length).toEqual(5);
		});
		describe("Accepts an optional filter function as an argument", function(){
			it("In this case, only records matching the filter will be returned", function(){
				var ds = new luga.data.DataSet({id: "myDs", records: testRecords});
				expect(ds.select(removeUk).length).toEqual(5);
			});
			it("Throws an exception if the passed filter is not a function", function(){
				expect(function(){
					baseDs.select("test");
				}).toThrow();
			});
		});
	});

	describe(".setCurrentRow()", function(){

		describe("Given a row:", function(){

			describe("First:", function(){
				it("Sets the current row of the dataSet to the one matching the given row", function(){
					baseDs.insert(testRecords);
					var row3 = baseDs.getRowById("lugaPk_3");
					baseDs.setCurrentRow(row3);
					expect(baseDs.getCurrentRowId()).toEqual("lugaPk_3");
				});
			});

			describe("Then:", function(){
				it("Triggers a 'currentRowChanged' notification", function(){
					baseDs.insert(testRecords);
					var row3 = baseDs.getRowById("lugaPk_3");
					baseDs.setCurrentRow(row3);
					expect(testObserver.onCurrentRowChangedHandler).toHaveBeenCalled();
				});
			});

			describe("Throws an exception if:", function(){
				it("The dataSet is empty", function(){
					var row = loadedDs.getRowById("lugaPk_2");
					expect(function(){
						baseDs.setCurrentRow(row);
					}).toThrow();
				});
				it("No available record matches the given row", function(){
					var arrayRecords = [];
					arrayRecords.push({name: "Nicole"});
					arrayRecords.push({name: "Kate"});
					var ds = new luga.data.DataSet({id: "myDs", records: arrayRecords});
					var row = loadedDs.getRowById("lugaPk_2");
					expect(function(){
						ds.setCurrentRow(row);
					}).toThrow();
				});
			});

		});

	});

	describe(".setCurrentRowId()", function(){

		it("Throws an exception if the given rowId is invalid", function(){
			expect(function(){
				baseDs.setCurrentRowId("test");
			}).toThrow();
		});

		describe("First:", function(){
			it("Sets the current row of the dataSet to the row matching the given rowId", function(){
				baseDs.insert(testRecords);
				baseDs.setCurrentRowId("lugaPk_3");
				expect(baseDs.getCurrentRowId()).toEqual("lugaPk_3");
			});
		});

		describe("Then:", function(){
			it("Triggers a 'currentRowChanged' notification", function(){
				baseDs.insert(testRecords);
				baseDs.setCurrentRowId("lugaPk_3");
				expect(testObserver.onCurrentRowChangedHandler).toHaveBeenCalled();
			});
		});

	});

	describe(".setCurrentRowIndex()", function(){

		describe("Given a zero-based index:", function(){

			describe("First:", function(){
				it("Sets the current row of the dataSet to the one matching the given index", function(){
					baseDs.insert(testRecords);
					baseDs.setCurrentRowIndex(3);
					expect(baseDs.getCurrentRowIndex()).toEqual(3);
				});
			});

			describe("Then:", function(){
				it("Triggers a 'currentRowChanged' notification", function(){
					baseDs.insert(testRecords);
					var row3 = baseDs.getRowById("lugaPk_3");
					baseDs.setCurrentRow(row3);
					expect(testObserver.onCurrentRowChangedHandler).toHaveBeenCalled();
				});
			});

			describe("Throws an exception if:", function(){
				it("The dataSet is empty", function(){
					expect(function(){
						baseDs.setCurrentRowIndex(1);
					}).toThrow();
				});
				it("The given index is out of range", function(){
					baseDs.insert(testRecords);
					expect(function(){
						baseDs.setCurrentRowIndex(99);
					}).toThrow();
				});
			});

		});

	});

	describe(".setFilter()", function(){
		beforeEach(function(){
			baseDs.insert(testRecords);
			baseDs.setFilter(removeUk);
		});
		it("Throws an exception if the given filter is not a function", function(){
			expect(function(){
				baseDs.setFilter("test");
			}).toThrow();
		});

		describe("First:", function(){
			it("Replaces current filter (if any), with a new filter functions", function(){
				baseDs.setFilter(removeBrasil);
				expect(baseDs.filter).toEqual(removeBrasil);
			});
		});
		describe("Then:", function(){
			it("Apply the new filter to the records", function(){
				expect(baseDs.getRecordsCount()).toEqual(5);
				baseDs.setFilter(removeBrasil);
				expect(baseDs.getRecordsCount()).toEqual(6);
			});
		});
		describe("Finally", function(){
			it("Triggers a 'dataChanged' notification", function(){
				baseDs.setFilter(removeBrasil);
				expect(testObserver.onDataChangedHandler).toHaveBeenCalledWith({dataSource: baseDs});
			});
		});

	});

});