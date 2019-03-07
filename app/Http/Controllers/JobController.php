<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Validator;
use Carbon\Carbon;

use App\Job;
use App\User;

class JobController extends Controller
{
    /**
     * Get all (parent) jobs
     * Could limited by some given parameters like from_Date, to_date, ...
     *
     * @param Request $request
     * @return Collection of jobs
     */
    public function getAll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'state' => 'string|in:private,public,deleted',
            'from_date' => 'date',
            'to_date' => 'date',
            'order' => 'string|in:asc,desc'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $jobs = Job::where("type", "job");
        $jobs->where("parent_id", null );

        if ($request->has('state')) {
            $jobs->where("state", $request->state );
        } else {
            $jobs->where("state", "not like", "deleted" );
        }

        if ($request->has('from_date')) {
            $jobs->where("start_date", ">=", $request->from_date );
        }
        if ($request->has('to_date')) {
            $jobs->where("start_date", "<=", $request->to_date );
        }

        $order = $request->has('order') ? $request->order : "ASC";
        $jobs->orderByRaw("case when start_date is null then 0 else 1 end, start_date $order");
        $jobs = $jobs->get();

        $jobs = $jobs->map(function($job) {
            $job->setCreator();
            $job->setSubscribers();
            $job->setChilds();
            unset($job->parent_id);
            return $job;
        });

        return $jobs;
    }

    /**
     * Get only public jobs
     *
     * @param Request $request
     * @return Collection of jobs
     */
    public function getAllPublic(Request $request)
    {
        $data = $request->all();
        $data['state'] = 'public';
        $r = new Request();
        $r->merge($data);
        return $this->getAll($r);
    }

    /**
     * Get a specific job
     *
     * @param Job $job
     * @return stdClass job
     */
    public function get(Job $job)
    {
        $job->setCreator();
        $job->setSubscribers();
        $job->setChilds();
        return $job;
    }

    /**
     * Create a parent job, may with child jobs
     *
     * @param Request $request
     * @return Response new created job
     */
    public function create(Request $request, $isParent = true)
    {
        $validator = Validator::make($request->all(), [
            'state' => $isParent ? 'string|in:private,public' : 'string|in:private,public|nullable',
            'title' => 'required|string|max:255',
            'description' => 'string|nullable',
            'users_required' => 'integer|nullable',
            'users_subscribed' => 'arrayORstring',
            'has_jobs' => 'array',
            'start_date' => 'date_format:Y-m-d|nullable',
            'start_time' => 'date_format:H:i|nullable',
            'end_date' => 'date_format:Y-m-d|nullable',
            'end_time' => 'date_format:H:i|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $data = $request->all();
        // $data = Job::getStartAtFromRequest($data, $request);
        // $data = Job::getEndAtFromRequest($data, $request);
        $data = Job::getSubscribersFromRequest($data, $request);

        DB::beginTransaction();
        $job = Job::create($data);

        if ($request->has('has_jobs')) {
            $parentId = $job->id;
            foreach($request->has_jobs as $key => $childJob) {
                $r = new Request();
                $childJob['parent_id'] = $parentId;
                $r->merge($childJob);

                $childJob = $this->createChild($r);

                if ($childJob->status() !== 201) {
                    DB::rollBack();
                    return response()->json($childJob->getOriginalContent(), $childJob->status());
                }
            }
        }
        DB::commit();
        // we need to fresh to get all job properties, and not only the updated
        $job = $job->fresh();
        $job->setCreator();
        $job->setSubscribers();
        $job->setChilds();
        return response()->json($job, 201);
    }

    /**
     * Update a specific job, by given job id
     *
     * @param Request $request
     * @param Job $job
     * @return void
     */
    public function update(Request $request, Job $job, $isParent = true)
    {
        $validator = Validator::make($request->all(), [
            'state' => $isParent ? 'string|in:private,public,deleted' : 'string|in:private,public,deleted|nullable',
            'title' => 'string|max:255',
            'description' => 'string|nullable',
            'users_required' => 'integer|nullable',
            'users_subscribed' => 'arrayORstring',
            'has_jobs' => 'array',
            'start_date' => 'date_format:Y-m-d|nullable',
            'start_time' => 'date_format:H:i|nullable',
            'end_date' => 'date_format:Y-m-d|nullable',
            'end_time' => 'date_format:H:i|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $data = $request->all();
        // $data = Job::getStartAtFromRequest($data, $request);
        // $data = Job::getEndAtFromRequest($data, $request);
        $data = Job::getSubscribersFromRequest($data, $request);

        DB::beginTransaction();
        $job->update($data);

        if ($request->has('has_jobs')) {
            $parentId = $job->id;

            // delete child jobs, those are not given in current request
            $prevChilds = Job::where("parent_id", $parentId)->get();
            $prevChildIds = array_map(function($v) { return isset($v['id']) ? $v['id'] : -1; }, $request->has_jobs);
            $toDeleteChilds = $prevChilds->whereNotIn('id', $prevChildIds);
            foreach ($toDeleteChilds as $key => $child) {
                $this->delete($child);
            }

            foreach($request->has_jobs as $key => $chilRequest) {
                $r = new Request();
                $chilRequest['parent_id'] = $parentId;
                $r->merge($chilRequest);

                // create a new child job or update existing
                if ($r->has('id')) {
                    $childJob = Job::find($r->id);
                    if (!$childJob) {
                        DB::rollBack();
                        return response()->json(array('code' =>  404, 'message' =>  "Childjob not found."), 404);
                    }
                    $childJob = $this->updateChild($r, $childJob);
                    if ($childJob->status() !== 200) {
                        DB::rollBack();
                        return response()->json($childJob->getOriginalContent(), $childJob->status());
                    }
                } else {
                    $childJob = $this->createChild($r);
                    if ($childJob->status() !== 201) {
                        DB::rollBack();
                        return response()->json($childJob->getOriginalContent(), $childJob->status());
                    }
                }
            }
        }
        DB::commit();
        $job->setCreator();
        $job->setSubscribers();
        $job->setChilds();
        return response()->json($job, 200);
    }

    /**
     * Delete a job by given id
     *
     * @param Job $job
     * @return void
     */
    public function delete(Job $job)
    {
        $job->setChilds(false);

        foreach($job->has_jobs as $key => $child) {
            $this->delete($child);
        }

        DB::table("laravel_job_meta")
            ->where("job_id", $job->id)
            ->delete();

        $job->delete();
        return response()->json(null, 204);
    }

    /**
     * Add a subscribed user nick to a job (by id)
     *
     * @param Request $request
     * @param Job $job
     * @return Response
     */
    public function addSubscriber(Request $request, Job $job) {
        $validator = Validator::make($request->all(), [
            'nick' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $job->setSubscribers();
        $subscribers = $job->users_subscribed;
        $subscribers[] = ['nick' => $request->nick];

        $data = [
            'users_subscribed' => json_encode($subscribers)
        ];

        $job->update($data);

        DB::table('laravel_job_meta')->insert([
            "job_id" => $job->id,
            "meta_key" => "activity",
            "meta_value" => "Add subscriber $request->nick",
        ]);

        return response()->json($subscribers, 200);
    }

    /**
     * Remove a subscribed user by user nick from a job (by id)
     *
     * @param Request $request
     * @param Job $job
     * @return void
     */
    public function deleteSubscriber(Request $request, Job $job) {
        $validator = Validator::make($request->all(), [
            'user' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $job->setSubscribers();
        $subscribers = $job->users_subscribed;

        if (!isset($subscribers[$request->user])) {
            return response()->json(array('code' =>  404, 'message' =>  "User not found."), 404);
        }
        $nick = $subscribers[$request->user]["nick"];
        array_splice($subscribers, $request->user, 1);
        $data = ['users_subscribed' => json_encode($subscribers)];

        $job->update($data);

        DB::table('laravel_job_meta')->insert([
            "job_id" => $job->id,
            "meta_key" => "activity",
            "meta_value" => "Remove subscriber $nick",
        ]);

        return response()->json($subscribers, 200);
    }

    /**
     * Get activities (like add/remove subscribers) of a job and its child jobs
     *
     * @param Job $job
     * @return void
     */
    public function getActivities(Job $job) {
        $job->setChilds(false);

        $activities = DB::table('laravel_job_meta')
            ->where("job_id", $job->id)
            ->where("meta_key", "activity")
            ->get();

        foreach($job->has_jobs as $key => $childJob) {
            $activities = $activities->merge(DB::table('laravel_job_meta')
                ->where("job_id", $childJob->id)
                ->where("meta_key", "activity")
                ->get()->toArray()
            );
        }
        return $activities;
    }

    /**
     * @deprecated version
     *
     * Get some values for a parent jobs like:
     * creator
     * child jobs
     * subscribed users
     *
     * @param [type] $job
     * @return Collection of jobs
     */
    // private function getJobMeta(Job $job) {
    //     // may get creator
    //     if ($job->creator) {
    //         $job->creator = User::where("id", $job->creator)
    //             ->first();
    //     }

    //     // get child jobs
    //     $job->has_jobs = Job::where("parent_id", $job->id)
    //         ->get();

    //     // get meta values of child jobs
    //     $job->has_jobs = $job->has_jobs->map(function($job) {
    //         $job = $this->getJobMeta($job);
    //         return $job;
    //     });

    //     // get subscribed users
    //     $job->users_subscribed = $job->getSubscribedUsers();

    //     return $job;
    // }

    private function createChild(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        if ($request->has('has_jobs') && count($request->has_jobs) > 0) {
            return response()->json(array('code' =>  500, 'message' =>  "Childjobs cannot have sub-childjobs."), 500);
        }

        $data = $request->all();
        $data['state'] = null;
        $data['has_jobs'] = [];
        $r = new Request();
        $r->merge($data);

        return $this->create($r, false);
    }

    private function updateChild(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        if ($request->has('has_jobs') && count($request->has_jobs) > 0) {
            return response()->json(array('code' =>  500, 'message' =>  "Childjobs cannot have sub-childjobs."), 500);
        }

        $data = $request->all();
        $data['state'] = null;
        $data['has_jobs'] = [];
        $r = new Request();
        $r->merge($data);

        return $this->update($r, $job, false);
    }
}
