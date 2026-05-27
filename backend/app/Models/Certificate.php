<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'volunteer_id', 'organization_id', 'certificate_number', 'title',
        'description', 'hours_completed', 'issue_date', 'file_path',
    ];

    protected $casts = [
        'issue_date'      => 'date',
        'hours_completed' => 'decimal:2',
    ];

    public function volunteer()    { return $this->belongsTo(Volunteer::class)->with('user'); }
    public function organization() { return $this->belongsTo(Organization::class); }
}
