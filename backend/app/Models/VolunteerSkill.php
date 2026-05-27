<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VolunteerSkill extends Model
{
    use HasFactory;
    protected $fillable = ['volunteer_id', 'skill_name', 'proficiency'];
    public function volunteer() { return $this->belongsTo(Volunteer::class); }
}

