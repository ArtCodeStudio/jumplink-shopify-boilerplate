# jumplink-shopify-boilerplate
Bootstrap 4 Boilerplate for Shopify

## Bootstrap 4
To make it possible to use Bootstrap 4 Sass files directly we have create a fork of Bootstrap 4 called [Bootstrap 4 Backward](https://github.com/JumpLinkNetwork/bootstrap-backward).

## Variables
All Bootstrap 4 Variables full customizable on runtime:

![Alt text](/theme_settings.png?raw=true "Optional Title")

## Contributing

* run `gulp sass_concat` to test if the scss files can be compiled
* run `gulp sass_concat` to pull our scss files together and move them into the themes assets
* run `gulp bootstrap_theme_settings_scss` to inject bootstrap theme settings to scss
* run `gulp bootstrap_theme_settings` tp create bootstrap variables for the settings_schema.json
* run `gulp theme_settings ` - to create settings_schema.json

## See also
 * [Bootstrap 4 Boilerplate for OctoberCMS](https://github.com/JumpLinkNetwork/jumplink-october-boilerplate)
