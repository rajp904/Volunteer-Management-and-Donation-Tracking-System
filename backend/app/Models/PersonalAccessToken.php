<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * Standard Sanctum PersonalAccessToken — stored in SQLite personal_access_tokens table.
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // Inherits everything from Sanctum's default implementation
}
