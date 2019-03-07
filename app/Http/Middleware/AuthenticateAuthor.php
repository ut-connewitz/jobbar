<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;

class AuthenticateAuthor
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
        if (auth('api')->user() && (auth('api')->user()->role == "admin" || auth('api')->user()->role == "author")) {
            return $next($request);
        }

        throw new AuthenticationException;

        return $next($request);
    }

    public static function checkAuth($request) {
        return auth('api')->user() && (auth('api')->user()->role == "admin" || auth('api')->user()->role == "author");
    }
}
