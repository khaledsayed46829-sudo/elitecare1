<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

$pdo = getDB();
$category = $_GET['category'] ?? '';

if ($category && $category !== 'all') {
    $stmt = $pdo->prepare('SELECT * FROM doctors WHERE category = ? ORDER BY id');
    $stmt->execute([$category]);
} else {
    $stmt = $pdo->query('SELECT * FROM doctors ORDER BY id');
}
$rows = $stmt->fetchAll();

$doctors = array_map(function ($d) {
    return [
        'id' => (int) $d['id'],
        'name' => $d['name'],
        'specialty' => $d['specialty'],
        'category' => $d['category'],
        'image' => $d['image'],
        'rating' => (float) $d['rating'],
        'ratingCount' => (int) $d['rating_count'],
        'degree' => $d['degree'],
        'experience' => $d['experience'],
        'languages' => $d['languages'],
        'scheduleDay' => $d['schedule_day'],
        'scheduleTime' => $d['schedule_time'],
    ];
}, $rows);

jsonResponse(['success' => true, 'doctors' => $doctors]);
