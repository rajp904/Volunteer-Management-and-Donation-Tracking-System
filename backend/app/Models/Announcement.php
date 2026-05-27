<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id', 'user_id', 'title', 'content', 'type',
        'audience', 'is_published', 'published_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function user()         { return $this->belongsTo(User::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
}
