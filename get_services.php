<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

$pdo = getDB();
$rows = $pdo->query('SELECT * FROM services ORDER BY id')->fetchAll();

$services = array_map(function ($s) {
    return [
        'id' => (int) $s['id'],
        'icon' => $s['icon'],
        'title' => $s['title'],
        'shortDesc' => $s['short_desc'],
        'fullDesc' => $s['full_desc'],
        'features' => json_decode($s['features'] ?: '[]'),
    ];
}, $rows);

jsonResponse(['success' => true, 'services' => $services]);
