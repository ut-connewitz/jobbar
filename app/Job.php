<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class Job extends Model
{
    /**
     * Overide default models table name
     *
     * @var string
     */
    protected $table = 'laravel_jobs';

    // private static $table = 'laravel_jobs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'type',
        'title',
        'description',
        'state', 'start_date', 'end_date', 'creator', 'users_required', 'users_subscribed', 'parent_id'
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'start_date',
        'end_date',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function getSubscribedUsers() {
        $users = $this->users_subscribed ? json_decode($this->users_subscribed, true) : [];
        // TODO handle json_last_error();
        return $users;
    }

    public function createSubscribedUsers($users) {
        return json_encode($users);
    }
}
