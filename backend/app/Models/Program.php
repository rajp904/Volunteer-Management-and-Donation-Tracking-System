<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id', 'name', 'slug', 'description', 'objectives',
        'budget', 'spent', 'banner_image', 'status', 'start_date', 'end_date',
        'location', 'volunteer_target',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'budget'     => 'decimal:2',
        'spent'      => 'decimal:2',
    ];

    public function organization()   { return $this->belongsTo(Organization::class); }
    public function events()         { return $this->hasMany(Event::class); }
    public function donations()      { return $this->hasMany(Donation::class); }
    public function expenses()       { return $this->hasMany(Expense::class); }
}
