<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$doctorName = cleanInput($data['doctorName'] ?? '');
$rating     = (int) ($data['rating'] ?? 0);
$comment    = cleanInput($data['comment'] ?? '');

if (!$doctorName || $rating < 1 || $rating > 5) {
    jsonResponse(['success' => false, 'message' => 'من فضلك اختر الطبيب وتقييم من 1 إلى 5']);
}

$pdo = getDB();
$stmt = $pdo->prepare('INSERT INTO reviews (user_id, doctor_name, rating, comment) VALUES (?, ?, ?, ?)');
$stmt->execute([$userId, $doctorName, $rating, $comment]);

jsonResponse(['success' => true, 'message' => 'شكراً لتقييمك، تم إرسال رأيك بنجاح']);
