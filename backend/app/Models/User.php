<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'avatar', 'bio',
        'address', 'city', 'state', 'country', 'pincode',
        'date_of_birth', 'gender', 'is_active', 'organization_id', 'last_login_at',
        // Firebase auth fields
        'firebase_uid', 'photo_url', 'auth_provider',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function volunteer()
    {
        return $this->hasOne(Volunteer::class);
    }

    public function donorProfile()
    {
        return $this->hasOne(DonorProfile::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
