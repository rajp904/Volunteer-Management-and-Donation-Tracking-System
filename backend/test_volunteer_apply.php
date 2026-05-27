<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$req = Illuminate\Http\Request::create('/api/public/volunteer-apply', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
    'name' => 'John Doe Test',
    'email' => 'john.doe.test' . rand() . '@example.com',
    'phone' => '1234567890',
    'city' => 'New York',
    'skills' => ['Teaching'],
    'availability' => ['Weekends']
]));
$res = $kernel->handle($req);
echo 'Status: ' . $res->getStatusCode() . "\n";
echo 'Response: ' . $res->getContent() . "\n";
