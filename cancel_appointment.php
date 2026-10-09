<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

$data = getRequestData();
$appointmentId = $data['id'] ?? ($_GET['id'] ?? null);

if (!$appointmentId) {
    jsonResponse(['success' => false, 'message' => 'رقم الموعد مطلوب']);
}

$pdo = getDB();

// التأكد إن الموعد ده تابع للمستخدم نفسه قبل التعديل
$stmt = $pdo->prepare('SELECT id FROM appointments WHERE id = ? AND user_id = ?');
$stmt->execute([$appointmentId, $userId]);
if (!$stmt->fetch()) {
    jsonResponse(['success' => false, 'message' => 'الموعد غير موجود'], 404);
}

$stmt = $pdo->prepare('UPDATE appointments SET status = "cancelled" WHERE id = ? AND user_id = ?');
$stmt->execute([$appointmentId, $userId]);

jsonResponse(['success' => true, 'message' => 'تم إلغاء الموعد بنجاح']);
