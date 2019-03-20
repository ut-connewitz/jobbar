<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Laravel\Passport\ClientRepository;
use Illuminate\Support\Facades\DB;
use App\User;

class JobTest extends TestCase
{

    /**
     * Create a user with specific role
     *
     * @param string $role
     * @return User
     */
    private function getUser($role = "user") {
        // create user
        $user = factory(User::class)->create();
        $user->role = $role;
        return $user;
    }

    public function testCannotCreateJobsWithoutUser() {
        $this->json('POST', '/api/jobs') // $his->post gives 500, why? $this->json gives correct 401
            ->assertStatus(401);
    }

    public function testCannotCreateJobsAsUser() {
        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('user'),
            ['jobs']
        );

        $this->json('POST', '/api/jobs') // $his->post gives 500, why? $this->json gives correct 401
            ->assertStatus(401);
    }

    public function testCreateJobsAsAuthor() {
        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('author'),
            ['jobs']
        );

        $start = date('Y-m-d');
        $end = date('Y-m-d');
        $payload = [
            'title' => 'Lorem',
            'description' => 'Ipsum',
            'start_date' => $start,
            'end_date' => $end,
            'has_jobs' => [
                [
                    'title' => 'Lorem',
                    'description' => 'Ipsum',
                    'users_required' => 2
                ]
            ]
        ];

        $this->post('/api/jobs', $payload)
            ->assertStatus(201)
            ->assertJson([
                'id' => 1,
                'title' => 'Lorem',
                'description' => 'Ipsum',
                'start_date' => $start,
                'end_date' => $end,
                'has_jobs' => [
                    ['title' => 'Lorem', 'description' => 'Ipsum', 'users_required' => 2]
                ]
            ]);
    }

    public function testGetNoJobsWithoutUser() {
        $this->json('GET', '/api/jobs') // $his->post gives 500, why? $this->json gives correct 401
            ->assertStatus(401);
    }

    public function testGetAllJobsAsAuthor() {
        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('author'),
            ['jobs']
        );

        $this->post('/api/jobs', [
            'title' => 'Lorem 1',
            'description' => 'Ipsum 1',
            'state' => 'private',
        ]);

        $this->post('/api/jobs', [
            'title' => 'Lorem 2',
            'description' => 'Ipsum 2',
            'state' => 'public',
        ]);

        $t = $this->get('/api/jobs')
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJson([
                ['id' => 1, 'title' => 'Lorem 1', 'description' => 'Ipsum 1', 'state' => 'private'],
                ['id' => 2, 'title' => 'Lorem 2', 'description' => 'Ipsum 2', 'state' => 'public']
            ]);
    }

    public function testGetOnlyPublicJobsAsUser() {
        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('author'),
            ['jobs']
        );

        $this->post('/api/jobs', [
            'title' => 'Lorem 1',
            'description' => 'Ipsum 1',
            'state' => 'private',
        ]);

        $this->post('/api/jobs', [
            'title' => 'Lorem 2',
            'description' => 'Ipsum 2',
            'state' => 'public',
        ]);

        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('user'),
            ['jobs']
        );

        $this->get('/api/jobs')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJson([
                ['id' => 2, 'title' => 'Lorem 2', 'description' => 'Ipsum 2', 'state' => 'public']
            ]);
    }

    public function testUpdateJob() {
        // allow passport access to /api/jobs
        Passport::actingAs(
            $this->getUser('author'),
            ['jobs']
        );

        $this->post('/api/jobs', [
            'title' => 'Lorem'
        ]);

        $this->put('/api/jobs/1', [
            'title' => 'Merol'
        ]);
        $this->get('/api/jobs')
            ->assertStatus(200)
            ->assertJson([
                ['id' => 1, 'title' => 'Merol' ]
            ]);
    }

    // TODO delete test doest not work yet
    //      instead 204 we get 500
    //      something is wrong with DB::table(laravel_job_meta)...delete()
    // public function testDeleteJob() {
    //     // allow passport access to /api/jobs
    //     Passport::actingAs(
    //         $this->getUser('author'),
    //         ['jobs']
    //     );

    //     $this->post('/api/jobs', [
    //         'title' => 'Lorem'
    //     ])
    //     ->assertStatus(201);

    //     $this->delete('/api/jobs/1')
    //         ->assertStatus(204);

    //     $this->get('/api/jobs')
    //         ->assertStatus(200)
    //         ->assertJsonCount(0);
    // }
}
