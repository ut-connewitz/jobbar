<?php

use Illuminate\Http\Request;
use App\Http\Controllers\JobController;

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

/*
| login and get access token */
Route::post('login', 'UserController@login');

/*
| get details of a user by access token */
Route::get('user', 'UserController@details');

/*
| register a new user */
Route::post('user/register', 'UserController@register')->middleware('auth.admin');

/*
|--------------------------------------------------------------------------
| Job Routes
|--------------------------------------------------------------------------
*/

// If cron works -> enable route /jobs with cron-middleware to init cronjobs (caldav sync)
// Route::middleware(['cron'])->group(function () {
// });

Route::middleware(['auth.author'])->group(function () {
    Route::get('jobs/caldavsync', function(Request $request) {
        Artisan::call('schedule:run');
        return "OK";
    });

    /*
    | get all jobs (for author/admin) */
    Route::get('jobs', function(Request $request) {
        return (new JobController)->getAll($request);
    });

    /*
    | Get specific job by id */
    Route::get('jobs/{job}', 'JobController@get')->where('job', '[0-9]+');

    /*
    | Create a new job */
    Route::post('jobs', 'JobController@create');

    /*
    | Update a specific job by id */
    Route::put('jobs/{job}', 'JobController@update');

    /*
    | Delete a specific job by id */
    Route::delete('jobs/{job}', 'JobController@delete')->where('job', '[0-9]+');

    /*
    | Get specific job by id */
    Route::get('jobs/{job}/activities', 'JobController@getActivities')->where('job', '[0-9]+');
});

Route::middleware(['auth.user'])->group(function () {
    /*
    | get only public jobs (for authenticated user) */
    Route::get('jobs', function(Request $request) {
        return (new JobController)->getAllPublic($request);
    });
    /*
    | Add a user as subscriber to a job */
    Route::post('jobs/{job}/subscriber', 'JobController@addSubscriber')->where('job', '[0-9]+');

    /*
    | remove a user from subscribers from a job */
    Route::delete('jobs/{job}/subscriber', 'JobController@deleteSubscriber')->where('job', '[0-9]+');
});


/*
|--------------------------------------------------------------------------
| Template Routes
|--------------------------------------------------------------------------*/
Route::middleware(['auth.user'])->group(function () {
    /*
    | Get all templates */
    Route::get('templates', 'TemplateController@getAll');
});


Route::middleware(['auth.author'])->group(function () {
    /*
    | Get specific template by id */
    Route::get('templates/{template}', 'TemplateController@get');

    /*
    | Create a new template */
    Route::post('templates', 'TemplateController@create');

    /*
    | Update a specific template by id */
    Route::put('templates/{template}', 'TemplateController@update');

    /*
    | Delete a specific template by id */
    Route::delete('templates/{template}', 'TemplateController@delete')->where('template', '[0-9]+');
});