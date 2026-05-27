<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Firebase authentication columns
            $table->string('firebase_uid')->nullable()->unique()->after('email');
            $table->string('auth_provider')->nullable()->after('firebase_uid'); // google, email, phone
            $table->string('photo_url')->nullable()->after('avatar');           // Google profile picture URL
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['firebase_uid', 'auth_provider', 'photo_url']);
        });
    }
};
