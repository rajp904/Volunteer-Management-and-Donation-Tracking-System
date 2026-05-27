<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EventVolunteer extends Model
{
    use HasFactory;

    protected $table = 'event_volunteers';

    protected $fillable = [
        'event_id', 'volunteer_id', 'status', 'tasks', 'notes',
        'role', 'hours_logged', 'feedback', 'assigned_at', 'confirmed_at', 'attended_at',
    ];

    protected $casts = [
        'hours_logged' => 'decimal:2',
        'assigned_at'  => 'datetime',
        'confirmed_at' => 'datetime',
        'attended_at'  => 'datetime',
    ];

    public function volunteer() { return $this->belongsTo(Volunteer::class)->with('user'); }
    public function event()     { return $this->belongsTo(Event::class)->with('program'); }
}
