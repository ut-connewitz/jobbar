<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class JobTest extends TestCase
{
    public function testsJobsAreCreatedCorrectly() {
        $headers = [];
        $payload = [
            'title' => 'Lorem',
            'description' => 'Ipsum',
        ];

        $this->json('POST', '/api/jobs', $payload, $headers)
            ->assertStatus(201)
            ->assertJson(['id' => 1, 'title' => 'Lorem', 'description' => 'Ipsum']);
    }
}
