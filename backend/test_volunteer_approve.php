<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$volunteer = \App\Models\Volunteer::where('status', 'pending')->first();
if ($volunteer) {
    echo "Found pending volunteer: " . $volunteer->id . "\n";
    $req = Illuminate\Http\Request::create('/api/volunteers/' . $volunteer->id . '/status', 'PATCH', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], json_encode([
        'status' => 'active'
    ]));
    // We need to bypass auth or authenticate as admin
    $admin = \App\Models\User::where('email', 'admin@volunteerhub.org')->first();
    $req->setUserResolver(function () use ($admin) { return $admin; });
    
    $res = $kernel->handle($req);
    echo "Status: " . $res->getStatusCode() . "\n";
    echo "Response: " . $res->getContent() . "\n";
} else {
    echo "No pending volunteers found.\n";
}
