<?php

namespace App\Http\Middleware;

use Closure;
use Artisan;

use Illuminate\Support\Facades\DB;
use App\Jobs\CaldavSync;

class ExecuteCron
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

        // Artisan::call('schedule:run');
        // Artisan::call('foo:bar');
        // exec('php -d register_argc_argv=On /var/www/artisan schedule:run');
        // $schedule->exec('php -d register_argc_argv=On /path/to/artisan newsletter:send')


        // $updatePeriod = 60*60*24;
        // $time = time();

        // $lastUpdate = DB::table('system')
        //     ->where("name", "cronjob-caldavsync-last-update")
        //     ->value("value");

        // $initialSync = $lastUpdate == null ? true : false;
        // $lastUpdate = $lastUpdate ? intval($lastUpdate) : 0;

        // if ($time - $updatePeriod >= $lastUpdate) {
        //     CaldavSync::dispatch();

        //     if ($initialSync) {
        //         DB::table('system')->insert(
        //             ['name' => 'cronjob-caldavsync-last-update', 'value' => $time]
        //         );

        //     } else {
        //         DB::table('system')
        //             ->where('name', "cronjob-caldavsync-last-update")
        //             ->update(['value' => $time]);
        //     }
        // }

        return $next($request);
    }
}
