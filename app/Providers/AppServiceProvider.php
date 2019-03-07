<?php

namespace App\Providers;

use Validator;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        /*
        | extend validator to test if a given request param is a string OR an array */
        Validator::extend('arrayORstring', function($attribute, $value, $parameters, $validator) {
            return is_string($value) || is_array($value);
        });

        /*
        | FIX: too long unique keys in DB
        | @see https://laravel-news.com/laravel-5-4-key-too-long-error */
        Schema::defaultStringLength(191);
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
