<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
// use Illuminate\Support\Facades\Auth;

class AuthenticateUser
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
        // $user = Auth::user();
        if (auth('api')->user()) {
            $role = auth('api')->user()->role;
            if ($role == "admin" || $role = "author" || $role = "user" || $role = "authenticated") {
                return $next($request);
            }
        }

        throw new AuthenticationException;
    }

    public static function checkAuth($request) {
        if (auth('api')->user()) {
            $role = auth('api')->user()->role;
            return $role == "admin" || $role = "author" || $role = "user" || $role = "authenticated";
        }
        return false;
    }
}
