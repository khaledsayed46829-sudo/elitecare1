<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

$pdo = getDB();
$stmt = $pdo->query(
    'SELECT r.id, r.doctor_name, r.rating, r.comment, r.created_at, u.first_name, u.last_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     ORDER BY r.id DESC LIMIT 50'
);
$rows = $stmt->fetchAll();

$reviews = array_map(function ($r) {
    return [
        'id' => (int) $r['id'],
        'patientName' => trim($r['first_name'] . ' ' . $r['last_name']),
        'doctorName' => $r['doctor_name'],
        'rating' => (int) $r['rating'],
        'comment' => $r['comment'],
        'date' => $r['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'reviews' => $reviews]);
