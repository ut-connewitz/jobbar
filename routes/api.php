<?php

use Illuminate\Http\Request;
use App\Article;
use App\Job;

use Illuminate\Auth\AuthenticationException;
use App\Http\Middleware\AuthenticateAdmin;
use App\Http\Middleware\AuthenticateAuthor;
use App\Http\Middleware\AuthenticateUser;
use App\Http\Controllers\JobController;

use App\Jobs\CaldavSync;

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

// Route::any('/{any}', function (Request $request, Closure $next) {
//     // do something

//     return var_dump($next);

//     // return $next($request);
// });

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
Route::middleware(['cron'])->group(function () {
    /*
    | get all jobs (for author/admin)
    | get only public jobs (for authenticated) */
    Route::get('jobs', function(Request $request) {
        if (AuthenticateAuthor::checkAuth($request)) {
            return (new JobController)->getAll($request);
        }
        if (AuthenticateUser::checkAuth($request)) {
            return (new JobController)->getAllPublic($request);
        }
        // return abort(404);
        throw new AuthenticationException;
    });
});

Route::middleware(['auth.author'])->group(function () {
    Route::get('jobs/caldavsync', function(Request $request) {
        // $cs = new CaldavSync();
        // $res = $cs->MayHandle();
        // return $res;
        //CaldavSync::dispatch();
        Artisan::call('schedule:run');
        // shell_exec('cd /var/www && php artisan schedule:run >> /dev/null 2>&1');
        return "ok";
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




// Route::middleware(['cron', 'auth.author'])->group(function () {
//     // edit jobs, templates, ...
// });



Route::get('test', function() {
    // $value = env('CALDAV_HOST');
    $value = config('caldav', []);
    var_dump($value);

    return "OK";
});

Route::middleware(['cron'])->group(function () {
    Route::get('cronjob', function() {
        return "OK";
    });
});

/*
| Run cronjobs helper endpoint
| if cron is not available on the server, this endpoint can be called, eg. with a service every minute */
// Route::get('/cron', function () {
//     Artisan::call('schedule:run');
//     return "OK";
// });

// Route::middleware(['cron', 'auth:api'])->group(function () {

Route::middleware(['cron', 'auth:api'])->group(function () {

    /*
    | Get all jobs */
    // Route::get('jobs', 'JobController@getAll');

    // /*
    // | Get specific job by id */
    // Route::get('jobs/{job}', 'JobController@get')->where('job', '[0-9]+');

    // /*
    // | Create a new job */
    // Route::post('jobs', 'JobController@create');

    // /*
    // | Update a specific job by id */
    // Route::put('jobs/{job}', 'JobController@update');

    // /*
    // | Delete a specific job by id */
    // Route::delete('jobs/{job}', 'JobController@delete')->where('job', '[0-9]+');

    // /*
    // | Add a user as subscriber to a job */
    // Route::post('jobs/{job}/subscriber', 'JobController@addUser')->where('job', '[0-9]+');

    // /*
    // | remove a user from subscribers from a job */
    // Route::delete('jobs/{job}/subscriber', 'JobController@deleteUser')->where('job', '[0-9]+');

    /*
    | Get all templates */
    // Route::get('templates', 'TemplateController@getAll');

    // /*
    // | Get specific template by id */
    // Route::get('templates/{template}', 'TemplateController@get');

    // /*
    // | Create a new template */
    // Route::post('templates', 'TemplateController@create');

    // /*
    // | Update a specific template by id */
    // Route::put('templates/{template}', 'TemplateController@update');

    // /*
    // | Delete a specific template by id */
    // Route::delete('templates/{template}', 'TemplateController@delete')->where('template', '[0-9]+');

    // /*
    // | register a new user */
    // Route::post('user/register', 'UserController@register');

    // /*
    // | get details of a user by access token */
    // Route::get('user/details', 'UserController@details');

});



// Route::view('/{path?}', 'app')->where('path', '^((?!api).)*');

// Route::fallback(function () {
//     return response()->json([
//         'error' => 'Resource not found'
//       ], 404);
// });