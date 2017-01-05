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
    sass          = require('gulp-sass'),
    jsoncombine   = require('gulp-jsoncombine'),
    fs            = require('fs'),
    util          = require('util');

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
gulp.task('bootstrap_sass_test_build', ['sass_concat_test'], function () {
  return gulp.src('./dist/scss/theme.scss')
    .pipe(sass().on('error', onError))
    .pipe(gulp.dest('./dist/css'));
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

// SASS_CONCAT: Pull our scss files together and move them into the themes assets
//TODO use https://www.npmjs.com/package/gulp-shopify-sass
gulp.task('sass_concat', ['bootstrap_theme_settings_scss'], function () {
  var paths = new SassImport('./src/scss/theme.scss');
  console.log(paths);
  return gulp.src(paths)
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(concat('theme.scss.liquid'))
    .pipe(gulp.dest('./theme/assets/'));
});

// SASS_CONCAT_TEST: Pull our scss files together and move them into the themes assets
gulp.task('sass_concat_test', ['bootstrap_theme_settings_scss'], function () {
  var paths = new SassImport('./src/scss/theme-test.scss');
  console.log(paths);
  return gulp.src(paths)
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(concat('theme.scss'))
    .pipe(gulp.dest('./dist/scss/'));
});

// BOOTSTRAP_THEME_SETTINGS_SCSS: Inject bootstrap theme settings to scss
gulp.task('bootstrap_theme_settings_scss', ['theme_settings'], function () {

  var bsPkg = require('./bower_components/bootstrap-backward/package.json');
  var bootstrap = require('./settings_schema/bootstrap.json');
  var liquidString = "";


  bootstrap.settings.forEach(function(setting) {
    console.log("setting", setting);

    var liquidLine = null;
    switch (setting.type) {
      case 'color':
      case 'number':
      case 'checkbox':
      case 'text':
        // liquidLine = "{% unless settings.id == blank %} $value: {{settings.id}}; {% endunless %}";
        liquidLine = "$value: {{settings.id}};";
        liquidLine = liquidLine.replace(/id/g, setting.id);
        liquidLine = liquidLine.replace(/value/g, setting.id.replace('bs4-', ''));
        break;
      case 'header':
       case 'paragraph':
        liquidLine = "\n{% comment %} content {% endcomment %}".replace('content', setting.content);
        break;
      default:
        console.error("Unknown type: ",setting.type);
        break;
    }

    if(liquidLine) {
      liquidString += liquidLine + "\n";
    }
        
  }, this);

  // save scss file
  fs.writeFileSync('./src/scss/_bs4_variables.scss.liquid', liquidString , 'utf-8');

});

// BOOTSTRAP_THEME_SETTINGS: Create bootstrap variables for the settings_schema.json
gulp.task('bootstrap_theme_settings', function () {

  var bsPkg = require('./bower_components/bootstrap-backward/package.json');
  var bootstrap_variables = require('./bower_components/bootstrap-backward/variables.json');
  var bootstrap_theme_settings = {
    "name": "Bootstrap "+bsPkg.version,
    "settings": [
      {
        "type": "paragraph",
        "content": "Bootstrap 4 [fork](https:\/\/github.com\/JumpLinkNetwork\/bootstrap-backward) with backward compatibility for Shopify by [JumpLink](https:\/\/www.jumplink.eu)"
      }
    ]
  };

  var groups = {};
  
  // sort variables to groups
  bootstrap_variables.forEach(function(variableDefs) {
    console.log("variableDefs",variableDefs);

    if(variableDefs.context.scope == "private") {
      return;
    }

    if(!groups[variableDefs.group[0]]) {
      groups[variableDefs.group[0]] = [];
    }
    if(variableDefs.type) {
      variableDefs.type = variableDefs.type.toLowerCase();
    }

    switch (variableDefs.type) {
      case 'color':
        groups[variableDefs.group[0]].push({
          type: "color",
          id: 'bs4-'+variableDefs.context.name,
          label: variableDefs.context.name,
          default: variableDefs.context.value,
          info: variableDefs.description

        });
        break;
      case 'number':
        groups[variableDefs.group[0]].push({
          type: "number",
          id: 'bs4-'+variableDefs.context.name,
          label: variableDefs.context.name,
          default: Number(variableDefs.context.value),
          info: variableDefs.description

        });
        break;
      case 'bool':
      case 'boolean':
        groups[variableDefs.group[0]].push({
          type: "checkbox",
          id: 'bs4-'+variableDefs.context.name,
          label: variableDefs.context.name,
          default: variableDefs.context.value === 'true',
          info: variableDefs.description

        });
        break;
      case 'text':
      default:
        groups[variableDefs.group[0]].push({
          type: "text",
          id: 'bs4-'+variableDefs.context.name,
          label: variableDefs.context.name,
          default: variableDefs.context.value,
          info: variableDefs.description,

        });
        break;
    }
  }, this);

  var toTitleCase = function(str)
  {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  // write groups to settings and clean up 
  for(var name in groups) { 
    var group = groups[name];
    bootstrap_theme_settings.settings.push({
      "type": "header",
      "content": toTitleCase(name),
    });
    group.forEach(function(groupContext) {
      if(!groupContext.info || groupContext.info == "" || groupContext.info == "\n") {
        delete groupContext.info;
      }
      bootstrap_theme_settings.settings.push(groupContext);
    }, this);
  }

  // save settings to json file
  fs.writeFileSync('./settings_schema/bootstrap.json', JSON.stringify(bootstrap_theme_settings, null, 2) , 'utf-8');

});

// SHOPIFY_THEME_SETTINGS: Create settings_schema.json
gulp.task('theme_settings', ['bootstrap_theme_settings'], function () {

  // list of settings files to include, in order of inclusion
  var settings = [
    'bootstrap',
  ];

  return gulp.src('./settings_schema/*.json')
    .pipe(jsoncombine('settings_schema.json',function(data){
      // collect the json data and store it in the correct order
      var data_array = [];
      for (var i = 0; i < settings.length; i++) {
        var file = settings[i];
        data_array.push(data[file]);
      }

      return new Buffer(JSON.stringify(data_array, null, 2));
    }))
    .pipe(gulp.dest('./theme/config/'));
});