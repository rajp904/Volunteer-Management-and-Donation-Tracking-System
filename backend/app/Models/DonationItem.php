<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DonationItem extends Model
{
    use HasFactory;
    protected $fillable = ['donation_id', 'item_name', 'quantity', 'unit', 'estimated_value', 'description'];
    protected $casts    = ['estimated_value' => 'decimal:2'];
    public function donation() { return $this->belongsTo(Donation::class); }
}

class RecurringDonation extends Model
{
    use HasFactory;
    protected $fillable = ['donor_profile_id', 'organization_id', 'program_id', 'amount', 'frequency', 'start_date', 'end_date', 'next_due_date', 'status', 'payment_method'];
    protected $casts    = ['start_date' => 'date', 'end_date' => 'date', 'next_due_date' => 'date', 'amount' => 'decimal:2'];
    public function donorProfile() { return $this->belongsTo(DonorProfile::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
    public function program()      { return $this->belongsTo(Program::class); }
}

class FundAllocation extends Model
{
    use HasFactory;
    protected $fillable = ['donation_id', 'program_id', 'organization_id', 'amount', 'notes', 'allocated_date'];
    protected $casts    = ['amount' => 'decimal:2', 'allocated_date' => 'date'];
    public function donation() { return $this->belongsTo(Donation::class); }
    public function program()  { return $this->belongsTo(Program::class); }
}
