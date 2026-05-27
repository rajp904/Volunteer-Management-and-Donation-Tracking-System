<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Organization extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'description', 'logo', 'email', 'phone',
        'website', 'address', 'city', 'state', 'country', 'pincode',
        'registration_number', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function volunteers()
    {
        return $this->hasMany(Volunteer::class);
    }

    public function programs()
    {
        return $this->hasMany(Program::class);
    }

    public function donations()
    {
        return $this->hasMany(Donation::class);
    }

    public function donorProfiles()
    {
        return $this->hasMany(DonorProfile::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
