<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'user_id', 'organization_id', 'action', 'model_type', 'model_id',
        'old_values', 'new_values', 'ip_address', 'user_agent', 'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public static function record(
        string $action,
        $model = null,
        array $oldValues = [],
        array $newValues = [],
    ): void {
        try {
            $user = Auth::user();
            static::create([
                'user_id'         => $user?->id,
                'organization_id' => $user?->organization_id,
                'action'          => $action,
                'model_type'      => $model ? get_class($model) : null,
                'model_id'        => $model?->id ?? null,
                'old_values'      => $oldValues ?: null,
                'new_values'      => $newValues ?: null,
                'ip_address'      => Request::ip(),
                'user_agent'      => Request::userAgent(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AuditLog::record failed: ' . $e->getMessage());
        }
    }
}
