<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateJobsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('laravel_jobs', function (Blueprint $table) {
            $table->increments('id');
            $table ->string('type', 100)->default("job");
            $table->string('state', 100)->default("private")->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            // $table->dateTime('start_at')->nullable();
            // $table->dateTime('end_at')->nullable();
            $table->date('start_date')->nullable();
            $table->time('start_time')->nullable();
            $table->date('end_date')->nullable();
            $table->time('end_time')->nullable();


            $table->integer('creator')->nullable();
            $table->integer('users_required')->nullable();
            $table->longText('users_subscribed')->nullable(); // json is not compatible with mysql < xyz
            $table->integer('parent_id')->nullable();
            $table->timestamps(); // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('laravel_jobs');
    }
}
