/* globals console, require */
"use strict";

var gulp = require("gulp");
var changed = require("gulp-changed");
var concat = require("gulp-concat");
var fs = require("fs");
var header = require("gulp-header");
var rename = require("gulp-rename");
var runSequence = require("run-sequence");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglify");
var zip = require("gulp-zip");

var pkg = require("./package.json");

var CONST = {
	SRC_FOLDER: "src",
	DIST_FOLDER: "dist",
	LIB_PREFIX: "luga.",
	DATA_PREFIX: "luga.data.",
	DATA_CORE_KEY: "core",
	JS_EXTENSION: ".js",
	MIN_SUFFIX: ".min.js",
	CONCATENATED_FILE: "luga.js",
	CONCATENATED_DATA_FILE: "luga.data.js",
	FOLDERS_TO_ARCHIVE: ["LICENSE", "dist/**/*", "docs/**/*", "lib/**/*", "src/**/*", "test/**/*"],
	ARCHIVE_FILE: "luga-js.zip",
	ARCHIVE_FOLDER: "archive",
	VERSION_PATTERN: new RegExp(".version = \"(\\d.\\d(.\\d\\d?)?)\";")
};

function assembleBanner(name, version){
	var now = new Date();
	var banner = [
		"/*! ",
		name + " " + version + " " + now.toISOString(),
		"Copyright 2013-" + now.getFullYear() + " " + pkg.author.name + " (" + pkg.author.email + ")",
		"Licensed under the Apache License, Version 2.0 | http://www.apache.org/licenses/LICENSE-2.0",
		" */",
		""].join("\n");
	return banner;
}

function getLibSrc(key){
	return CONST.SRC_FOLDER + "/" + CONST.LIB_PREFIX + key + CONST.JS_EXTENSION;
}

function getDataFragmentSrc(key){
	return CONST.SRC_FOLDER + "/" + CONST.DATA_PREFIX + key + CONST.JS_EXTENSION;
}

function getDataVersion(){
	var buffer = fs.readFileSync(getDataFragmentSrc(CONST.DATA_CORE_KEY));
	var fileStr = buffer.toString("utf8", 0, buffer.length);
	var version = CONST.VERSION_PATTERN.exec(fileStr)[1];
	return version;
}

function getLibVersion(key){
	var buffer = fs.readFileSync(getLibSrc(key));
	var fileStr = buffer.toString("utf8", 0, buffer.length);
	var version = CONST.VERSION_PATTERN.exec(fileStr)[1];
	return version;
}

function getAllLibsSrc(){
	var paths = [];
	for(var x in pkg.libs){
		paths.push(getLibSrc(x));
	}
	return paths;
}

function getAllDataFragmentsSrc(){
	var paths = [];
	for(var i = 0; i < pkg.dataLibFragments.length; i++){
		var path = getDataFragmentSrc(pkg.dataLibFragments[i]);
		paths.push(path);
	}
	return paths;
}

function copyLib(key){
	var libName = pkg.libs[key].name;

	var libVersion = pkg.libs[key].version;
	if(libVersion === undefined){
		libVersion = getLibVersion(key);
	}
	return gulp.src(getLibSrc(key))
		.pipe(changed(CONST.DIST_FOLDER))
		.pipe(header(assembleBanner(libName, libVersion)))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
}

function releaseLib(key){
	var libName = pkg.libs[key].name;

	var libVersion = pkg.libs[key].version;
	if(libVersion === undefined){
		libVersion = getLibVersion(key);
	}

	return gulp.src(getLibSrc(key))
		// The "changed" task needs to know the destination directory
		// upfront to be able to figure out which files changed
		.pipe(changed(CONST.DIST_FOLDER))
		.pipe(sourcemaps.init())
			.pipe(uglify({
				mangle: false
			}))
			.pipe(rename({
				extname: CONST.MIN_SUFFIX
			}))
			.pipe(header(assembleBanner(libName, libVersion)))
		.pipe(sourcemaps.write(".", {
			includeContent: true,
			sourceRoot: "."
		}))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
}

gulp.task("concatLibs", function(){
	return gulp.src(getAllLibsSrc())
		.pipe(sourcemaps.init())
			.pipe(concat(CONST.CONCATENATED_FILE))
			.pipe(changed(CONST.DIST_FOLDER))
			.pipe(header(assembleBanner(pkg.displayName, "")))
			.pipe(gulp.dest(CONST.DIST_FOLDER))
			.pipe(rename({
				extname: CONST.MIN_SUFFIX
			}))
			.pipe(uglify({
				mangle: false
			}))

		.pipe(sourcemaps.write(".", {
			includeContent: true,
			sourceRoot: "."
		}))
		.pipe(header(assembleBanner(pkg.displayName, "")))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
});

gulp.task("data", function(){
	var dataVersion = getDataVersion();
	return gulp.src(getAllDataFragmentsSrc())
		.pipe(sourcemaps.init())
			.pipe(concat(CONST.CONCATENATED_DATA_FILE))
			.pipe(changed(CONST.DIST_FOLDER))
			.pipe(gulp.dest(CONST.DIST_FOLDER))
			.pipe(rename({
				extname: CONST.MIN_SUFFIX
			}))
			.pipe(uglify({
				mangle: false
			}))
			.pipe(header(assembleBanner(pkg.dataLibDisplayName, dataVersion)))
		.pipe(sourcemaps.write(".", {
			includeContent: true,
			sourceRoot: "."
		}))
		.pipe(gulp.dest(CONST.DIST_FOLDER));
});

gulp.task("libs", function(){
	for(var x in pkg.libs){
		releaseLib(x);
		copyLib(x);
	}
});

gulp.task("zip", function(){
	return gulp.src(CONST.FOLDERS_TO_ARCHIVE, {base: "."})
		.pipe(zip(CONST.ARCHIVE_FILE))
		.pipe(gulp.dest(CONST.ARCHIVE_FOLDER));
});

gulp.task("default", function(callback){
	runSequence(
		"concatLibs",
		"libs",
		"zip",
		function(error){
			if(error){
				console.log(error.message);
			}
			else{
				console.log("BUILD FINISHED SUCCESSFULLY");
			}
			callback(error);
		});
});