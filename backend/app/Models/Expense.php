<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id', 'program_id', 'user_id', 'title', 'description',
        'amount', 'category', 'expense_date', 'status', 'bill_attachment',
        'approved_by', 'approved_at',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'approved_at'  => 'datetime',
        'amount'       => 'decimal:2',
    ];

    public function organization() { return $this->belongsTo(Organization::class); }
    public function program()      { return $this->belongsTo(Program::class); }
    public function user()         { return $this->belongsTo(User::class); }
}
