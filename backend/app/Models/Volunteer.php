<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Volunteer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'organization_id', 'volunteer_id', 'emergency_contact_name',
        'emergency_contact_phone', 'emergency_contact_relation', 'skills', 'interests',
        'notes', 'status', 'background_check_status', 'background_check_date',
        'total_hours', 'joined_date', 'document_id_proof', 'document_photo', 'is_verified',
    ];

    protected $casts = [
        'is_verified'           => 'boolean',
        'joined_date'           => 'date',
        'background_check_date' => 'date',
        'total_hours'           => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function skills()
    {
        return $this->hasMany(VolunteerSkill::class);
    }

    public function availability()
    {
        return $this->hasMany(VolunteerAvailability::class);
    }

    public function eventAssignments()
    {
        return $this->hasMany(EventVolunteer::class);
    }

    public function attendance()
    {
        return $this->hasMany(VolunteerAttendance::class);
    }

    public function hours()
    {
        return $this->hasMany(VolunteerHour::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
