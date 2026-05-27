<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VolunteerHour extends Model
{
    use HasFactory;
    protected $fillable = ['volunteer_id', 'program_id', 'event_id', 'hours', 'date', 'description', 'is_approved'];
    protected $casts = ['date' => 'date', 'is_approved' => 'boolean', 'hours' => 'decimal:2'];
    public function volunteer() { return $this->belongsTo(Volunteer::class); }
    public function program() { return $this->belongsTo(Program::class); }
    public function event() { return $this->belongsTo(Event::class); }
}

