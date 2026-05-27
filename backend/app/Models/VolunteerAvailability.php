<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VolunteerAvailability extends Model
{
    use HasFactory;
    protected $fillable = ['volunteer_id', 'day_of_week', 'start_time', 'end_time'];
    public function volunteer() { return $this->belongsTo(Volunteer::class); }
}

