<?php

use Illuminate\Database\Migrations\Migration;

// MongoDB is schemaless — no ALTER TABLE needed.
// Fields (role, hours_logged, feedback, assigned_at, confirmed_at, attended_at)
// will simply be stored as document fields in the event_volunteers collection.
return new class extends Migration
{
    public function up(): void
    {
        // No-op for MongoDB: fields are stored dynamically in documents
    }

    public function down(): void
    {
        // No-op for MongoDB
    }
};
