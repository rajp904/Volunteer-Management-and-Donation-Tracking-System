<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Traits\RefreshesPermissionCache;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model implements PermissionContract
{
    use RefreshesPermissionCache;

    protected $fillable = ['name', 'guard_name'];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            config('permission.table_names.role_has_permissions', 'role_has_permissions'),
            config('permission.column_names.permission_pivot_key', 'permission_id'),
            config('permission.column_names.role_pivot_key', 'role_id')
        );
    }

    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            User::class,
            'model',
            config('permission.table_names.model_has_permissions', 'model_has_permissions'),
            config('permission.column_names.permission_pivot_key', 'permission_id'),
            config('permission.column_names.model_morph_key', 'model_id')
        );
    }

    public static function findByName(string $name, ?string $guardName): \Spatie\Permission\Contracts\Permission
    {
        $permission = static::where('name', $name)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $permission) {
            throw new \Spatie\Permission\Exceptions\PermissionDoesNotExist($name, $guardName ?? '');
        }
        return $permission;
    }

    public static function findById(int|string $id, ?string $guardName): \Spatie\Permission\Contracts\Permission
    {
        $permission = static::where('id', $id)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $permission) {
            throw new \Spatie\Permission\Exceptions\PermissionDoesNotExist('', $guardName ?? '');
        }
        return $permission;
    }

    public static function findOrCreate(string $name, ?string $guardName): \Spatie\Permission\Contracts\Permission
    {
        $permission = static::where('name', $name)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $permission) {
            $permission = static::create(['name' => $name, 'guard_name' => $guardName ?? config('auth.defaults.guard')]);
        }
        return $permission;
    }
}
