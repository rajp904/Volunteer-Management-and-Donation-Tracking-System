<?php

namespace App\Services;

use MongoDB\Client;
use MongoDB\Database;
use Illuminate\Support\Facades\Log;

/**
 * MongoDBService
 * Connects to MongoDB Atlas and provides helpers to store
 * user signups, logins, volunteer registrations, donations, and contact forms.
 */
class MongoDBService
{
    protected ?Database $db = null;

    public function __construct()
    {
        try {
            $uri    = config('database.mongodb.uri');
            $dbName = config('database.mongodb.database');

            $client   = new Client($uri);
            $this->db = $client->selectDatabase($dbName);
        } catch (\Throwable $e) {
            Log::error('[MongoDB] Connection failed: ' . $e->getMessage());
            $this->db = null;
        }
    }

    /** Safely insert a document into a collection */
    private function insert(string $collection, array $document): void
    {
        if (!$this->db) return;
        try {
            $document['created_at'] = new \MongoDB\BSON\UTCDateTime(now()->getTimestampMs());
            $this->db->selectCollection($collection)->insertOne($document);
        } catch (\Throwable $e) {
            Log::error("[MongoDB] Insert to [{$collection}] failed: " . $e->getMessage());
        }
    }

    // ── User signup ──────────────────────────────────────────────────────────
    public function storeSignup(array $data): void
    {
        $this->insert('users', [
            'type'    => 'signup',
            'name'    => $data['name']  ?? null,
            'email'   => strtolower(trim($data['email'] ?? '')),
            'phone'   => $data['phone'] ?? null,
            'role'    => $data['role']  ?? 'user',
        ]);
    }

    // ── User login ───────────────────────────────────────────────────────────
    public function storeLogin(array $data): void
    {
        $this->insert('users', [
            'type'  => 'login',
            'email' => strtolower(trim($data['email'] ?? '')),
            'name'  => $data['name']  ?? null,
            'role'  => $data['role']  ?? 'user',
        ]);
    }

    // ── Volunteer registration ───────────────────────────────────────────────
    public function storeVolunteer(array $data): void
    {
        $skills       = $data['skills']       ?? [];
        $availability = $data['availability'] ?? [];

        $this->insert('volunteers', [
            'name'         => $data['name']    ?? null,
            'email'        => strtolower(trim($data['email'] ?? '')),
            'phone'        => $data['phone']   ?? null,
            'city'         => $data['city']    ?? null,
            'skills'       => is_array($skills)       ? implode(', ', $skills)       : $skills,
            'availability' => is_array($availability) ? implode(', ', $availability) : $availability,
            'message'      => $data['message'] ?? null,
            'status'       => 'pending',
        ]);
    }

    // ── Donation ─────────────────────────────────────────────────────────────
    public function storeDonation(array $data): void
    {
        $this->insert('donations', [
            'name'           => $data['name']           ?? null,
            'email'          => strtolower(trim($data['email'] ?? '')),
            'phone'          => $data['phone']           ?? null,
            'amount'         => (float) ($data['amount'] ?? 0),
            'program'        => $data['program']         ?? 'General Donation',
            'program_id'     => $data['program_id']      ?? null,
            'message'        => $data['message']         ?? null,
            'transaction_id' => $data['transaction_id']  ?? null,
            'receipt_number' => $data['receipt_number']  ?? null,
            'status'         => 'completed',
        ]);
    }

    // ── Contact form ─────────────────────────────────────────────────────────
    public function storeContact(array $data): void
    {
        $this->insert('contact_forms', [
            'name'    => $data['name']    ?? null,
            'email'   => strtolower(trim($data['email'] ?? '')),
            'phone'   => $data['phone']   ?? null,
            'subject' => $data['subject'] ?? null,
            'message' => $data['message'] ?? null,
            'status'  => 'new',
        ]);
    }
}
