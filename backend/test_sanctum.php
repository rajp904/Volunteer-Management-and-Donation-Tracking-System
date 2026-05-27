<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$token = '6a09d52c23a01667c00cdc06|H0uccTGgJmfTS6VOrBLUvnFRLNP885IhrKlhwyDp'; // We will get a new one

// First login
$payload = json_encode(['email' => 'admin@volunteerhub.org', 'password' => 'Admin@1234']);
$req1 = Illuminate\Http\Request::create('/api/auth/login', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], $payload);
$res1 = $kernel->handle($req1);
$body1 = json_decode($res1->getContent(), true);

if (!isset($body1['token'])) {
    die("Login failed!\n" . $res1->getContent());
}

$token = $body1['token'];
echo "Token generated: " . $token . "\n";

// Now test a protected route
$req2 = Illuminate\Http\Request::create('/api/auth/me', 'GET', [], [], [], [
    'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
    'HTTP_ACCEPT' => 'application/json'
]);

$res2 = $kernel->handle($req2);
echo "Auth/me Status: " . $res2->getStatusCode() . "\n";
echo "Response: " . $res2->getContent() . "\n";
