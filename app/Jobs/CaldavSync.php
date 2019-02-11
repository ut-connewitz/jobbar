<?php

namespace App\Jobs;

use Illuminate\Support\Facades\DB;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;


class CaldavSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct() {

    }

    public function handle() {
        DB::table('activity')->insert(
            ["type" => "info", "target_type" => "plugin.caldav", "message" => "updated from caldav..."]
        );
        return "start...";
    }
}

?>