<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
// use Illuminate\Foundation\Http\Middleware\AuthenticateAdmin as Middleware;

class AuthenticateAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if (auth('api')->user() && auth('api')->user()->role == "admin") {
            return $next($request);
        }

        throw new AuthenticationException;
    }

    public static function checkAuth($request) {
        return auth('api')->user() && auth('api')->user()->role == "admin";
    }
}
