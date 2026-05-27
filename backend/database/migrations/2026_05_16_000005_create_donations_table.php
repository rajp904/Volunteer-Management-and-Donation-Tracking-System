<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('donor_id')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('pan_number')->nullable();
            $table->enum('donor_type', ['individual', 'corporate', 'trust', 'government', 'ngo', 'other'])->default('individual');
            $table->boolean('is_anonymous')->default(false);
            $table->decimal('total_donated', 15, 2)->default(0);
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id']);
        });

        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('receipt_number')->unique();
            $table->decimal('amount', 15, 2)->default(0);
            $table->enum('donation_type', ['cash', 'cheque', 'online', 'in_kind', 'bank_transfer', 'upi'])->default('cash');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('currency')->default('INR');
            $table->date('donation_date');
            $table->text('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('cheque_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->boolean('is_tax_exempted')->default(true);
            $table->boolean('is_anonymous')->default(false);
            $table->string('acknowledgement_sent_at')->nullable();
            $table->string('receipt_path')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'status']);
            $table->index(['donation_date']);
        });

        Schema::create('donation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->constrained()->cascadeOnDelete();
            $table->string('item_name');
            $table->integer('quantity')->default(1);
            $table->string('unit')->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('recurring_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('frequency', ['weekly', 'monthly', 'quarterly', 'yearly'])->default('monthly');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('next_due_date');
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->string('payment_method')->nullable();
            $table->timestamps();
        });

        Schema::create('fund_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->text('notes')->nullable();
            $table->date('allocated_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_allocations');
        Schema::dropIfExists('recurring_donations');
        Schema::dropIfExists('donation_items');
        Schema::dropIfExists('donations');
        Schema::dropIfExists('donor_profiles');
    }
};
