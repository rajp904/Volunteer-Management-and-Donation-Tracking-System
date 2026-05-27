<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Contracts\Role as RoleContract;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\RefreshesPermissionCache;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model implements RoleContract
{
    use HasPermissions, RefreshesPermissionCache;

    protected $fillable = ['name', 'guard_name'];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            config('permission.table_names.role_has_permissions', 'role_has_permissions'),
            config('permission.column_names.role_pivot_key', 'role_id'),
            config('permission.column_names.permission_pivot_key', 'permission_id')
        );
    }

    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            User::class,
            'model',
            config('permission.table_names.model_has_roles', 'model_has_roles'),
            config('permission.column_names.role_pivot_key', 'role_id'),
            config('permission.column_names.model_morph_key', 'model_id')
        );
    }

    public static function findByName(string $name, ?string $guardName): \Spatie\Permission\Contracts\Role
    {
        $role = static::where('name', $name)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $role) {
            throw new \Spatie\Permission\Exceptions\RoleDoesNotExist($name, $guardName ?? '');
        }
        return $role;
    }

    public static function findById(int|string $id, ?string $guardName): \Spatie\Permission\Contracts\Role
    {
        $role = static::where('id', $id)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $role) {
            throw new \Spatie\Permission\Exceptions\RoleDoesNotExist('', $guardName ?? '');
        }
        return $role;
    }

    public static function findOrCreate(string $name, ?string $guardName): \Spatie\Permission\Contracts\Role
    {
        $role = static::where('name', $name)->where('guard_name', $guardName ?? config('auth.defaults.guard'))->first();
        if (! $role) {
            $role = static::create(['name' => $name, 'guard_name' => $guardName ?? config('auth.defaults.guard')]);
        }
        return $role;
    }

    public function hasPermissionTo($permission, ?string $guardName = null): bool
    {
        return $this->permissions->contains('name', is_string($permission) ? $permission : $permission->name);
    }
}
