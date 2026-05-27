<?php
// Test direct MongoDB connection bypassing SRV lookup
require __DIR__ . '/vendor/autoload.php';

// Try with tlsInsecure via direct MongoDB client
$uri = 'mongodb+srv://ragavendramogalapu_db_user:Nani%40123@cluster0.ukph5p1.mongodb.net/volunteer_hub?appName=Cluster0';

$options = [
    'tls' => true,
    'tlsInsecure' => true,
];

try {
    $client = new \MongoDB\Client($uri, $options);
    $dbs = iterator_to_array($client->listDatabases());
    echo "✅ MongoDB Connected with tlsInsecure option! Databases: " . count($dbs) . PHP_EOL;
} catch (Exception $e) {
    echo "❌ Error with tlsInsecure option: " . $e->getMessage() . PHP_EOL;
}

// Try without any TLS options (default)
echo PHP_EOL . "--- Trying with directConnection ---" . PHP_EOL;
try {
    $plainUri = 'mongodb+srv://ragavendramogalapu_db_user:Nani%40123@cluster0.ukph5p1.mongodb.net/volunteer_hub?appName=Cluster0';
    $client2 = new \MongoDB\Client($plainUri);
    $dbs2 = iterator_to_array($client2->listDatabases());
    echo "✅ Connected without extra options! Databases: " . count($dbs2) . PHP_EOL;
} catch (Exception $e) {
    echo "❌ Error without options: " . $e->getMessage() . PHP_EOL;
}
