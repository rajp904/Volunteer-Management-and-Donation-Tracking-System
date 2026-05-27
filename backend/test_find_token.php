<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tokenStr = '6a09d52c23a01667c00cdc06|JWTCse13ZID8lsbxIWBfnGZDlElrBvZrPKdvX4Ep';
[$id, $plainToken] = explode('|', $tokenStr, 2);

$instance = App\Models\PersonalAccessToken::find($id);
if ($instance) {
    echo "Found ID: $id\n";
    echo "DB Hash: " . $instance->token . "\n";
    echo "Computed Hash: " . hash('sha256', $plainToken) . "\n";
} else {
    echo "ID NOT FOUND: $id\n";
}
