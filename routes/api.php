<?php

use Illuminate\Http\Request;

use App\Article;
use App\Job;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

/*
| Get all jobs */
Route::get('jobs', 'JobsController@getAll');

/*
| Get specific job by id */
Route::get('jobs/{job}', 'JobsController@get');

/*
| Create a new job */
Route::post('jobs', 'JobsController@create');

/*
| Update a specific job by id */
Route::put('jobs/{job}', 'JobsController@update');

/*
| Delete a specific job by id */
Route::delete('jobs/{job}', 'JobsController@delete');

Route::post('jobs/{job}/subscriber', 'JobsController@addUser');
Route::delete('jobs/{job}/subscriber', 'JobsController@deleteUser');


Route::post('login', 'UserController@login');
Route::post('register', 'UserController@register');

Route::post('details', 'UserController@details')->middleware('auth:api');

/*
| Run cronjobs helper endpoint
| if cron is not available on the server, this endpoint can be called, eg. with a service every minute */
Route::get('/cron', function () {
    Artisan::call('schedule:run');
    return "OK";
});