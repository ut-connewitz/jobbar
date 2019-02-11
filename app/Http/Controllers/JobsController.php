<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Validator;
use Carbon\Carbon;

use App\Job;
use App\User;

class JobsController extends Controller
{
    private $table = 'laravel_jobs';

    /**
     * Get all (parent) jobs
     * Could limited by some given parameters like from_Date, to_date, ...
     *
     * @param Request $request
     * @return Collection of jobs
     */
    public function getAll(Request $request)
    {
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

        $jobs->orderByRaw("case when start_date is null then 0 else 1 end, start_date ASC");
        $jobs = $jobs->get();

        $jobs = $jobs->map(function($job) {
            // $job = Job::buildJob($job);

            $job = $this->getJobMeta($job);

            return $job;
        });

        return $jobs;
        // return Job::getAll();
    }

    /**
     * Get a specific job
     *
     * @param Job $job
     * @return stdClass job
     */
    public function get(Job $job)
    {
        $job = $this->getJobMeta($job);
        return $job;
    }

    /**
     * Create a parent job, may with child jobs
     *
     * @param Request $request
     * @param Job $job
     * @return Response new created job
     */
    public function create(Request $request, Job $j)
    {
        $validator = Validator::make($request->all(), [
            'state' => 'string|in:private,public',
            'title' => 'required|string|max:255',
            'description' => 'string',
            'start_date' => 'date',
            'end_date' => 'date|nullable',
            'users_required' => 'integer',
            'users_subscribed' => 'string',
            'has_jobs' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        if ($request->has('users_subscribed')) {
            // $request->merge([
            //     'users_subscribed' => json_decode($request->users_subscribed, true)
            // ]);
        }

        DB::beginTransaction();
        $job = Job::create($request->all());
        $parentId = $job->id;

        if ($request->has('has_jobs')) {
            $has_jobs = array();
            foreach($request->has_jobs as $key => $childJob) {
                $r = new Request();
                $childJob['parent_id'] = $parentId;
                $r->merge($childJob);

                $childJob = $this->createChild($r);

                if ($childJob->status() !== 201) {
                    DB::rollBack();
                    return response()->json($childJob->getOriginalContent(), $childJob->status());
                }

                $has_jobs[] = $childJob->getOriginalContent();
            }
            $job->has_jobs = $has_jobs;
        }
        DB::commit();
        return response()->json($job, 201);
    }

    /**
     * Update a specific job, by given job id
     *
     * @param Request $request
     * @param Job $job
     * @return void
     */
    public function update(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'state' => 'string|in:private,public',
            'title' => 'string|max:255',
            'description' => 'string',
            'start_date' => 'date',
            'end_date' => 'date|nullable',
            'users_required' => 'integer',
            'users_subscribed' => 'string',
            'has_jobs' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        if ($request->has('users_subscribed')) {
            // TODO
            // $users = json_decode($job->users_subscribed, true)
            // $job->users_subscribed = $job->users_subscribed ? json_decode($job->users_subscribed, true) : [];

            // $request->merge([
            //     'users_subscribed' => $job-> json_decode($request->users_subscribed, true)
            // ]);
        }

        DB::beginTransaction();
        $job->update($request->all());
        $parentId = $job->id;

        if ($request->has('has_jobs')) {
            $has_jobs = array();
            foreach($request->has_jobs as $key => $chilRequest) {
                $r = new Request();
                $chilRequest['parent_id'] = $parentId;
                $r->merge($chilRequest);

                if (!$r->has('id')) {
                    DB::rollBack();
                    return response()->json("Job id required for child job", 500);
                }

                $childJob = Job::where("id", $r->id)
                    ->where("parent_id", $parentId)
                    ->first();

                if (!$childJob) {
                    DB::rollBack();
                    return response()->json("Child job not found", 500);
                }

                $newChildJob = $this->update($r, $childJob);

                if ($newChildJob->status() !== 200) {
                    DB::rollBack();
                    return response()->json("$newChildJob->getOriginalContent()", $newChildJob->status());
                }

                $has_jobs[] = $newChildJob->getOriginalContent();
            }
            $job->has_jobs = $has_jobs;
        }
        DB::commit();

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
    public function addUser(Request $request, Job $job) {
        $validator = Validator::make($request->all(), [
            'user' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $users = $job->getSubscribedUsers();
        $users[] = ['nick' => $request->user];

        $data = [
            'users_subscribed' => json_encode($users)
        ];

        $job->update($data);

        return response()->json($users, 200);
    }

    /**
     * Remove a subscribed user by user nick from a job (by id)
     *
     * @param Request $request
     * @param Job $job
     * @return void
     */
    public function deleteUser(Request $request, Job $job) {
        $validator = Validator::make($request->all(), [
            'user' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $user = null;
        $users = $job->getSubscribedUsers();
        $new = [];

        foreach ($users as $u) {
            if ($request->user !== $u['nick']) {
                $new[] = $u;
            }
        }

        if (count($new) === count($users)) {
            return response()->json("User not found", 404);
        }

        $data = [
            'users_subscribed' => $job->createSubscribedUsers($new)
        ];

        $job->update($data);

        return response()->json($new, 200);
    }

    /**
     * Get some values for a parent jobs like:
     * creator
     * child jobs
     * subscribed users
     *
     * @param [type] $job
     * @return Collection of jobs
     */
    private function getJobMeta($job) {
        // may get creator
        if ($job->creator) {
            $job->creator = User::where("id", $job->creator)
                ->first();
        }

        // get child jobs
        $job->has_jobs = Job::where("parent_id", $job->id)
            ->get();

        // get meta values of child jobs
        $job->has_jobs = $job->has_jobs->map(function($job) {
            $job = $this->getJobMeta($job);
            return $job;
        });

        // get subscribed users
        $job->users_subscribed = $job->getSubscribedUsers();

        return $job;
    }

    public function createChild(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'state' => 'string|in:private,public',
            'title' => 'required|string|max:255',
            'description' => 'string',
            'start_date' => 'date',
            'end_date' => 'date|nullable',
            'users_required' => 'integer',
            'users_subscribed' => 'string',
            'parent_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        if ($request->has('users_subscribed')) {
            $request->merge([
                'users_subscribed' => json_decode($request->users_subscribed, true)
            ]);
        }

        $job = Job::create($request->all());

        return response()->json($job, 201);
    }
}
