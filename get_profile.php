<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE id = ?');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    jsonResponse(['success' => false, 'message' => 'المستخدم غير موجود'], 404);
}

// عدد المواعيد هذا الشهر (يُستخدم في إحصائيات البروفايل)
$stmt = $pdo->prepare(
    "SELECT COUNT(*) AS cnt FROM appointments
     WHERE user_id = ? AND MONTH(appointment_date) = MONTH(CURDATE()) AND YEAR(appointment_date) = YEAR(CURDATE())"
);
$stmt->execute([$userId]);
$monthlyCount = (int) $stmt->fetch()['cnt'];

jsonResponse([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'memberSince' => $user['created_at'],
    ],
    'stats' => [
        'appointmentsThisMonth' => $monthlyCount,
    ],
]);
