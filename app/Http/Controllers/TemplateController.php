<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Validator;
use Carbon\Carbon;

use App\Template;
use App\User;

class TemplateController extends Controller
{
    public function getAll(Request $request)
    {
        $templates = Template::where("type", "template");
        $templates->where("parent_id", null );
        $templates = $templates->get();

        $templates = $templates->map(function($template) {
            $template->setCreator();
            $template->setChilds();
            $template->setSubscribers();
            return $template;
        });

        return $templates;
    }

    public function get(Template $template)
    {
        $template->setCreator();
        $template->setChilds();
        $template->setSubscribers();
        return $template;
    }

    public function create(Request $request, $isParent = true)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'string|nullable',
            'users_required' => 'integer|nullable',
            'users_subscribed' => 'arrayORstring',
            'has_jobs' => 'array',
            'start_time' => 'date_format:H:i|nullable',
            'end_time' => 'date_format:H:i|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $data = $request->all();
        $data['state'] = $isParent ? "public" : null;
        $data['type'] = "template";
        $data = Template::getSubscribersFromRequest($data, $request);

        DB::beginTransaction();
        $template = Template::create($data);

        if ($request->has('has_jobs')) {
            $parentId = $template->id;
            foreach($request->has_jobs as $key => $child) {
                $r = new Request();
                $child['parent_id'] = $parentId;
                $r->merge($child);

                $child = $this->createChild($r);

                if ($child->status() !== 201) {
                    DB::rollBack();
                    return response()->json($child->getOriginalContent(), $child->status());
                }
            }
        }
        DB::commit();
        $template = $template->fresh();
        $template->setCreator();
        $template->setChilds();
        $template->setSubscribers();
        return response()->json($template, 201);
    }

    public function update(Request $request, Template $template, $isParent = true)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'string|nullable',
            'users_required' => 'integer|nullable',
            'users_subscribed' => 'arrayORstring',
            'has_jobs' => 'array',
            'start_time' => 'date_format:H:i|nullable',
            'end_time' => 'date_format:H:i|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 500);
        }

        $data = $request->all();
        $data['state'] = $isParent ? "public" : null;
        $data['type'] = "template";
        $data = Template::getSubscribersFromRequest($data, $request);

        DB::beginTransaction();
        $template->update($data);

        if ($request->has('has_jobs')) {
            $parentId = $template->id;

            // delete child jobs, those are not given in current request
            $prevChilds = Template::where("parent_id", $parentId)->get();
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
                    $childJob = Template::find($r->id);
                    if (!$childJob) {
                        DB::rollBack();
                        return response()->json(array('code' =>  500, 'message' =>  "Childjob not found"), 500);

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
        $template->setCreator();
        $template->setChilds();
        $template->setSubscribers();
        return response()->json($template, 200);
    }

    public function delete(Template $template)
    {
        $template->setChilds(false);

        foreach($template->has_jobs as $key => $child) {
            $this->delete($child);
        }

        DB::table("laravel_job_meta")
            ->where("job_id", $template->id)
            ->delete();

        $template->delete();
        return response()->json(null, 204);
    }

    private function createChild(Request $request)
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

        return $this->create($request, false);
    }

    private function updateChild(Request $request, Template $template)
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

        return $this->update($request, $template, false);
    }

}
