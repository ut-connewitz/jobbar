<?php

namespace App\Jobs;

use Illuminate\Support\Facades\DB;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

use Sabre\VObject;
use it\thecsea\simple_caldav_client\SimpleCalDAVClient;

use App\Job;

class CaldavSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $caldavClient = null;

    private $syncFromDate = null;

    private $syncToDate = null;

    private $alreadyImportedJobs = [];

    private $syncedEvents = 0;

    /**
     * Table where to save meta values (synced jobs)
     *
     * @var string
     */
    private $metaTable = "jobs_caldavsync";


    /**
     * Sync only events with categories from this array
     *
     * @var array
     */
    private $include_only_categories = [];

    /**
     * Exclude event categories from sync.
     * if $include_only_categories is not empty, exclude_categories will be ignored
     *
     * @var array
     */
    private $exclude_categories = [];

    public function __construct() {
        $this->caldavClient = new SimpleCalDAVClient();
        $this->syncFromDate = date('Ymd\T000000\Z');
        $this->syncToDate = date('Ymt\T000000\Z', strtotime("+2 months", strtotime($this->syncFromDate)));

    }

    // public function MayHandle() {
    //     // sleep(20);
    //     // return $this->syncedEvents;

    //     $time = time();

    //     $lastUpdate = $this->getLastUpdate();
    //     $lastUpdate = $lastUpdate ? intval($lastUpdate) : 0;
    //     $updatePeriod = $this->getUpdatePeriod();
    //     if ($time - $updatePeriod >= $lastUpdate) {
    //         $this->handle();
    //         $this->setLastUpdate($time);
    //     }
    // }

    // private function test()  {
    //     DB::table('activity')->insert(
    //         ['type' => 'info', 'target_type' => 'caldavsync', 'message' => time()]
    //     );
    // }

    public function handle() {
        $calendars = $this->getCalendars();

        if (empty($calendars)) {
            return;
        }

        // get already by caldav imported jobs
        $alreadyImportedJobs = DB::table($this->metaTable)
            ->where("meta_key", "caldav_sync")
            ->get();

        foreach ($alreadyImportedJobs as $key => $job) {
            $this->alreadyImportedJobs[] = array_merge( json_decode($job->meta_value, true), ["job_id" => $job->job_id] );
        }

        $eventsToImport = [];
        $insertErrors = [];

        foreach ($calendars as $key => $calendar) {
            $this->syncCalendar($calendar);
        }
    }

    private function syncCalendar($calendar = []) {
        $events = $this->fetchEventsFromCalendar($calendar, $this->syncFromDate, $this->syncToDate);
        if (empty($events))  {
            return null;
        }
        foreach ($events as $key => $event) {
            $event = $event->getData();
            $vcard = VObject\Reader::read($event);
            $event = $vcard->VEVENT;

            // echo $event->serialize();
            // echo "<br>";

            $eventId = $event->UID;
            $calendarId = $calendar['calendar'];

            $exists = array_filter(
                $this->alreadyImportedJobs,
                function($v) use ($eventId, $calendarId) {
                    return $v['calendar'] == $calendarId && $v['eventId'] == $eventId;
                }
            );
            if (empty($exists)) {
                // $eventsToImport[] = $event;
                $this->syncEvent($calendar, $event);
            }
        }
    }

    private function syncEvent($calendar, $event) {
        if (!$event->UID || !$event->SUMMARY) {
            return;
        }
        $uid = $event->UID->getValue();

        $start = $event->DTSTART ? $event->DTSTART->getDateTime() : null;
        $end = $event->DTEND ? $event->DTEND->getDateTime() : null;
        $jobData = [
            "title" => $event->SUMMARY->getValue(),
            "description" => $event->DESCRIPTION ? $event->DESCRIPTION->getValue() : null,
            "start_date" => $start ? $start->format('Y-m-d') : null,
            "start_time" => $start ? $start->format('H:i') : null,
            "end_date" => $end ? $end->format('Y-m-d') : null,
            "end_time" => $end ? $end->format('H:i') : null,
            // TODO "creator" => ???
            // TODO category as add ($event->CATEGORIES)
            // TODO location as add ($event->LOCATION)
        ];

        // var_dump($jobData);

        // if ($event->CATEGORIES) {
        //     $categories = explode(",", $event->CATEGORIES->getValue());
        //     // var_dump($categories);
        // }

        $job = Job::create($jobData);
        $metaData = [
            "job_id" => $job->id,
            "meta_key" => "caldav_sync",
            "meta_value" => json_encode([
                "calendar" => $calendar['calendar'],
                "eventId" => $uid,
                "imported_at" => date("Y-m-d H:i:s")
            ])
        ];
        $this->syncedEvents++;
        DB::table($this->metaTable)->insert($metaData);
    }

    private function fetchEventsFromCalendar($calendar = [], $fromDate = null, $toDate = null) {
        $events = null;
        try {
            $this->caldavClient->connect($calendar['host'], $calendar['username'], $calendar['password']);
            $arrayOfCalendars = $this->caldavClient->findCalendars();
            $this->caldavClient->setCalendar($arrayOfCalendars[$calendar['calendar']]);
            $events = $this->caldavClient->getEvents($fromDate, $toDate);
        } catch (Exception $e) {
            // throw new Exception($e->__toString());
            return null;
        }
        return $events;
    }

    private function getCalendars() {
        return config('caldav', []);
    }

    private function getLastUpdate() {
        $lastUpdate = DB::table('system')
            ->where("name", "cronjob-caldavsync-last-update")
            ->value("value");
        $this->lastUpdate = $lastUpdate;
        return $lastUpdate;
    }

    private function setLastUpdate($time = null) {
        if ($time === null) {
            $time = time();
        }
        $lastUpdate = !$this->lastUpdate
            ? $this->getLastUpdate()
            : $this->lastUpdate;
        $initialSync = $lastUpdate == null ? true : false;
        if ($initialSync) {
            DB::table('system')->insert(
                ['name' => 'cronjob-caldavsync-last-update', 'value' => $time]
            );

        } else {
            DB::table('system')
                ->where('name', "cronjob-caldavsync-last-update")
                ->update(['value' => $time]);
        }
    }

    private function getUpdatePeriod () {
        return 60*60*24;
    }
}

?>