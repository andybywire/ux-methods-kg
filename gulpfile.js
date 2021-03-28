"use strict";
// Load plugins
const gulp = require('gulp');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const shell = require('gulp-shell');
const connect = require('gulp-connect-php');
const gulpSass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync');

// Build Jekyll site (but do not compile CSS)
function jekyll (gulpCallBack){
    const jekyll = spawn('jekyll', ['build'], {stdio: 'inherit'});
    jekyll.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
    });
}

// Build Methods RDF from .gsheet with Methods.sparql
function methods (gulpCallBack){
    const methods = exec('tarql ~/repos/uxmd/_data/etl/Methods.sparql > ~/repos/uxmd/_data/etl/Methods.ttl', {stdio: 'inherit'});
    methods.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Methods Tarql process exited with code: '+code);
    });
}

// Build WebResources RDF from .gsheet with WebResources.sparql
function resources (gulpCallBack){
    const resources = exec('tarql ~/repos/uxmd/_data/etl/WebResources.sparql > ~/repos/uxmd/_data/etl/WebResources.ttl', {stdio: 'inherit'});
    resources.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Resources Tarql process exited with code: '+code);
    });
}

// SASS
 function sass() {
   return gulp.src('_sass/style.scss')
     .pipe(sourcemaps.init())
     .pipe(gulpSass({
       outputStyle: 'compressed' // compressed, expanded
     })
       .on('error', gulpSass.logError))
     .pipe(autoprefixer())
     .pipe(sourcemaps.write('./'))
     .pipe(gulp.dest('_site/css'))
     .pipe(browserSync.stream());
 }

// Start Browsersync with PHP
function php() {
  connect.server({
    base: './_site'
    },function (){
      browserSync({
        proxy: '127.0.0.1:8000',
        notify: false,
        port: 3333
      });
  });
}

// BrowserSync reload
function reload (done) {
  browserSync.reload({
  });
  done();
}

// Watch files
function watch() {
  gulp.watch("_sass/*.scss", sass);
  gulp.watch(
    [
      "**/*.html",
      "!_site/**/*.html",
      "js/*.js",
      "serviceworker.js",
      "**/*.md",
      "_config.yml",
      "!_data/**",
      "_data/UXMethods.owl"
    ],
    gulp.series(jekyll, reload)
  );
}

// Export tasks
exports.default = gulp.series(jekyll, sass, gulp.parallel(watch, php));
exports.etl = gulp.series(methods, resources);
