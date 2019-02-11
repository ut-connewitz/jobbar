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

// mix.webpackConfig({
//    output: {
//       publicPath: 'http://0.0.0.0:8081/'
//     },
//    devServer: {
//       port: 8081,
//       host: '0.0.0.0',
//       // publicPath: "http://0.0.0.0:3000/",
//       // hot: true,
//       headers: { "Access-Control-Allow-Origin": "*" }
//     }
// });

mix.react('resources/js/app.js', 'public/js');

//   .sass('resources/sass/app.scss', 'public/css');

mix.options({
   hmrOptions: {
     host: '0.0.0.0',
     port: 8080
   }
 });