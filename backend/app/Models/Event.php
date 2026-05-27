<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'program_id', 'organization_id', 'title', 'description', 'location',
        'start_datetime', 'end_datetime', 'volunteer_needed', 'status', 'banner_image',
    ];

    protected $casts = [
        'start_datetime' => 'datetime',
        'end_datetime'   => 'datetime',
    ];

    public function program()              { return $this->belongsTo(Program::class); }
    public function organization()         { return $this->belongsTo(Organization::class); }
    public function volunteerAssignments() { return $this->hasMany(EventVolunteer::class); }
    public function volunteers()
    {
        return $this->belongsToMany(Volunteer::class, 'event_volunteers')
            ->withPivot('status', 'tasks', 'notes')
            ->withTimestamps();
    }
    public function attendance() { return $this->hasMany(VolunteerAttendance::class); }
}
