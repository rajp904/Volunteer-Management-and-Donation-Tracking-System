<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VolunteerAttendance extends Model
{
    use HasFactory;
    protected $table = 'volunteer_attendance';
    protected $fillable = ['volunteer_id', 'event_id', 'date', 'check_in', 'check_out', 'hours', 'notes', 'status', 'is_manual_entry'];
    protected $casts = ['date' => 'date', 'is_manual_entry' => 'boolean', 'hours' => 'decimal:2'];
    public function volunteer() { return $this->belongsTo(Volunteer::class); }
    public function event() { return $this->belongsTo(Event::class); }
}

