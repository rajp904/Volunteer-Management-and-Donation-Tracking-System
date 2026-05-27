<?php
// Quick script to replace MongoDB model references in all remaining PHP files
$dir = __DIR__ . '/app/Models';
$files = glob($dir . '/*.php');

$replacements = [
    "use MongoDB\\Laravel\\Eloquent\\Model;\n" => "use Illuminate\\Database\\Eloquent\\Model;\n",
    "use MongoDB\\Laravel\\Eloquent\\Model;\r\n" => "use Illuminate\\Database\\Eloquent\\Model;\r\n",
    "use MongoDB\\Laravel\\Eloquent\\SoftDeletes;\n" => "use Illuminate\\Database\\Eloquent\\SoftDeletes;\n",
    "use MongoDB\\Laravel\\Eloquent\\SoftDeletes;\r\n" => "use Illuminate\\Database\\Eloquent\\SoftDeletes;\r\n",
    "use MongoDB\\Laravel\\Auth\\User as Authenticatable;\n" => "use Illuminate\\Foundation\\Auth\\User as Authenticatable;\n",
    "use MongoDB\\Laravel\\Auth\\User as Authenticatable;\r\n" => "use Illuminate\\Foundation\\Auth\\User as Authenticatable;\r\n",
];

foreach ($files as $file) {
    $content = file_get_contents($file);
    $newContent = str_replace(array_keys($replacements), array_values($replacements), $content);
    if ($newContent !== $content) {
        file_put_contents($file, $newContent);
        echo "Fixed: " . basename($file) . PHP_EOL;
    } else {
        echo "Clean: " . basename($file) . PHP_EOL;
    }
}

// Also fix the Traits folder
$traitDir = __DIR__ . '/app/Traits';
// Delete HasMongoApiTokens.php since we no longer use it
$mongoTrait = $traitDir . '/HasMongoApiTokens.php';
if (file_exists($mongoTrait)) {
    unlink($mongoTrait);
    echo "Deleted: HasMongoApiTokens.php" . PHP_EOL;
}

echo PHP_EOL . "✅ All MongoDB references cleaned!" . PHP_EOL;
