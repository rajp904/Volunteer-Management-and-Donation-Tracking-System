<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $client = \DB::connection('mongodb')->getMongoClient();
    $dbs = iterator_to_array($client->listDatabases());
    echo "✅ MongoDB Connected OK! Databases: " . count($dbs) . PHP_EOL;
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}
