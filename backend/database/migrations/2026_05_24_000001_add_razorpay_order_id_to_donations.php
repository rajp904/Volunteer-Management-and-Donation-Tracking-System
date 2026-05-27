<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            // Add Razorpay-specific columns if they don't already exist
            if (!Schema::hasColumn('donations', 'razorpay_order_id')) {
                $table->string('razorpay_order_id')->nullable()->after('transaction_id');
            }
            if (!Schema::hasColumn('donations', 'gateway')) {
                $table->string('gateway')->nullable()->after('razorpay_order_id')->comment('razorpay, stripe, etc.');
            }
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumnIfExists('razorpay_order_id');
            $table->dropColumnIfExists('gateway');
        });
    }
};
