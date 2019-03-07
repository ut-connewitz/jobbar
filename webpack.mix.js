const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.react('resources/js/app.js', 'public/js');

// mix.setPublicPath('jobbar');

// mix.webpackConfig({
//   output: {
//       publicPath: 'jobbar'
//   },
// });

// options for hot module replacement
mix.options({
   hmrOptions: {
     host: '0.0.0.0',
     port: 8081
   }
 });