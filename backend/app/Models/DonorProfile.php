<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DonorProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'organization_id', 'donor_id', 'name', 'email', 'phone',
        'address', 'city', 'state', 'country', 'pan_number', 'donor_type',
        'is_anonymous', 'total_donated', 'is_recurring', 'notes',
    ];

    protected $casts = [
        'is_anonymous'  => 'boolean',
        'is_recurring'  => 'boolean',
        'total_donated' => 'decimal:2',
    ];

    public function user()         { return $this->belongsTo(User::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
    public function donations()    { return $this->hasMany(Donation::class); }
}
