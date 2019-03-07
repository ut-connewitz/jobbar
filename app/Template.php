<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

use App\User;

class Template extends Model
{
    /**
     * Overide default models table name
     *
     * @var string
     */
    protected $table = 'laravel_jobs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'type',
        'title',
        'description',
        'state',
        'start_time',
        'end_time',
        // 'creator',
        'users_required',
        'users_subscribed',
        'parent_id'
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'type', 'state', 'start_date', 'end_date'
    ];

    public function getSubscribedUsers() {
        $users = $this->users_subscribed ? json_decode($this->users_subscribed, true) : [];
        // TODO handle json_last_error();
        return $users;
    }

    public function createSubscribedUsers($users) {
        return json_encode($users);
    }

    public function setCreator() {
        if ($this->creator) {
            $this->creator = User::where("id", $this->creator)->first();
        }
    }

    public static function getCreator($template) {
        return $template->creator ? User::where("id", $template->creator)->first() : null;
    }

    public function setChilds() {
        $childs = Template::where("parent_id", $this->id)->get();

        $this->has_jobs = $childs->map(function($child) {
            $child->setCreator();
            $child->setSubscribers();
            return $child;
        });
    }

    public function setSubscribers() {
        $this->users_subscribed = $this->users_subscribed ? json_decode($this->users_subscribed, true) : [];
    }

    public static function getSubscribers($template) {
        return $template->users_subscribed ? json_decode($template->users_subscribed, true) : [];
    }

    public static function getSubscribersFromRequest($data, Request $request) {
        if ($request->has('users_subscribed')) {
            $data['users_subscribed'] = is_array($request->users_subscribed)
                ? json_encode($request->users_subscribed)
                : $request->users_subscribed;
        }
        return $data;
    }

}
