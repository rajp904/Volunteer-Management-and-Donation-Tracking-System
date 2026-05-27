<?php
$t = App\Models\PersonalAccessToken::latest()->first();
echo gettype($t->tokenable) . "\n";
print_r($t->tokenable);
