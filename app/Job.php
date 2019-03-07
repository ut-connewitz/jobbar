<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

use App\User;

class Job extends Model
{
    /**
     * Overide default models table name
     *
     * @var string
     */
    protected $table = 'laravel_jobs';

    protected $meta_table = 'laravel_jobs_meta';

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
        'state',
        // 'start_at',
        'start_date',
        'start_time',
        // 'end_at',
        'end_date',
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
        // 'start_at',
        // 'start_date',
        // 'start_time',
        // 'end_at',
        // 'end_date',
        // 'end_time',
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
        'type'
    ];

    /**
     * @deprecated version
     *
     * @param [type] $data
     * @param Request $request
     * @return void
     */
    public static function getStartAtFromRequest($data, Request $request) {
        if ($request->has('start_at')) {
            $data['start_at'] = Carbon::parse($request->start_at);
        }
        return $data;
    }

    /**
     * @deprecated version
     *
     * @param [type] $data
     * @param Request $request
     * @return void
     */
    public static function getEndAtFromRequest($data, Request $request) {
        if ($request->has('end_at')) {
            $data['end_at'] = Carbon::parse($request->end_at);
        }
        return $data;
    }

    public static function getSubscribersFromRequest($data, Request $request) {
        if ($request->has('users_subscribed')) {
            $data['users_subscribed'] = is_array($request->users_subscribed)
                ? json_encode($request->users_subscribed)
                : $request->users_subscribed;
        }
        return $data;
    }

    public function setCreator() {
        if ($this->creator) {
            $this->creator = User::where("id", $this->creator)->first();
        }
    }

    public function setSubscribers() {
        // TODO handle josn parse error
        $this->users_subscribed = $this->users_subscribed ? json_decode($this->users_subscribed, true) : [];
    }

    public function setChilds($setChildMeta = true) {
        $childs = Job::where("parent_id", $this->id)->get();
        $this->has_jobs = $childs->map(function($child) use ($setChildMeta) {
            unset($child->has_jobs);
            if ($setChildMeta) {
                $child->setCreator();
                $child->setSubscribers();
            }
            return $child;
        });
    }

    public function setMeta() {
        return DB::table($this->meta_table)
            ->where("job_id", $this->id)
            ->get();
    }
}
