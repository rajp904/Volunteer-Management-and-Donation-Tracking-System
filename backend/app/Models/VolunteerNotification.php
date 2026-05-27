<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerNotification extends Model
{
    protected $fillable = [
        'volunteer_id',
        'email',
        'type',
        'volunteer_name',
        'message',
        'read',
    ];

    protected $casts = [
        'read' => 'boolean',
    ];

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(Volunteer::class);
    }
}
