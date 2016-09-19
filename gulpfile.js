'use strict';
/*
  Bootstrapify build tasks
*/

var gulp          = require('gulp'),
    gutil         = require('gulp-util'),
    plumber       = require('gulp-plumber'),
    argv          = require('yargs').argv,
    concat        = require('gulp-concat'),
    pjson         = require('./package.json'),
    zip           = require('gulp-zip'),
    SassImport    = require('./utils/sass_import.js'),
    sass          = require('gulp-sass');

// Basic error messages output to the console.
// Used with plumber so we don't stop the other tasks from running or kill the gulp process on an error
var onError = function (err) {
  gutil.beep();
  gutil.log(gutil.colors.red(err));
};

/*
  Default tasks
*/

// Default watch tasks for ease of development
// just run `gulp`
gulp.task('default', function () {
  // watch for sass changes
  gulp.watch([
    './src/scss/*.scss',
    './src/scss/*.scss.liquid',
    './src/scss/**/*.scss.liquid'
  ], ['sass']);

});

// Helper for sass tasks
gulp.task('sass', ['bootstrap_sass_test_build', 'sass_concat']);

// ALL THE TASKS!!! plus zipping up a fully built theme
gulp.task('build', ['sass', 'zip']);

// build sass to test build
gulp.task('bootstrap_sass_test_build', function () {
  return gulp.src('./bower_components/bootstrap/scss/bootstrap.scss')
    .pipe(sass().on('error', onError))
    .pipe(gulp.dest('./css'));
});

// SASS_CONCAT: Pull our scss files together and move them into the themes assets
gulp.task('sass_concat', function () {
  var paths = new SassImport('./src/scss/styles.scss');
  console.log(paths);
  return gulp.src(paths)
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(concat('styles.scss.liquid'))
    .pipe(gulp.dest('./theme/assets/'));
});

// ZIP: Cretae a zipped file of the theme that can be uploaded to Shopify
gulp.task('zip', function () {
  var theme = [
    'theme/assets/*',
    'theme/config/*',
    'theme/layout/*',
    'theme/locales/*',
    'theme/snippets/*',
    'theme/templates/*',
    'theme/templates/customers/*'
  ];

  return gulp.src(theme, {base: "."})
    .pipe(zip('JumpLink-Boilerplate-' + pjson.version + '.zip'))
    .pipe(gulp.dest('./'));
});