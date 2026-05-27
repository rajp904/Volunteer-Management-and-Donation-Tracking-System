<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VolunteerAssignment extends Model
{
    use HasFactory;

    protected $table = 'volunteer_assignments';

    protected $fillable = [
        'volunteer_id', 'event_id', 'organization_id', 'role',
        'status', 'hours_logged', 'feedback', 'assigned_at',
        'confirmed_at', 'attended_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'attended_at' => 'datetime',
        'hours_logged' => 'decimal:2',
    ];

    public function volunteer()
    {
        return $this->belongsTo(Volunteer::class)->with('user');
    }

    public function event()
    {
        return $this->belongsTo(Event::class)->with('program');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}

