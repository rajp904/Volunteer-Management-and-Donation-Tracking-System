<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Donation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'donor_profile_id', 'organization_id', 'program_id', 'receipt_number',
        'amount', 'donation_type', 'status', 'currency', 'donation_date', 'purpose',
        'notes', 'transaction_id', 'razorpay_order_id', 'gateway',
        'cheque_number', 'bank_name', 'is_tax_exempted',
        'is_anonymous', 'acknowledgement_sent_at', 'receipt_path',
    ];

    protected $casts = [
        'donation_date'  => 'date',
        'amount'         => 'decimal:2',
        'is_tax_exempted'=> 'boolean',
        'is_anonymous'   => 'boolean',
    ];

    public function donorProfile() { return $this->belongsTo(DonorProfile::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
    public function program()      { return $this->belongsTo(Program::class); }
    public function items()        { return $this->hasMany(DonationItem::class); }
}
