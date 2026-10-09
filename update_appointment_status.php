<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$appointmentId = $data['id'] ?? null;
$status = $data['status'] ?? '';

$allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
if (!$appointmentId || !in_array($status, $allowedStatuses)) {
    jsonResponse(['success' => false, 'message' => 'بيانات غير صحيحة']);
}

$pdo = getDB();
$stmt = $pdo->prepare('UPDATE appointments SET status = ? WHERE id = ?');
$stmt->execute([$status, $appointmentId]);

jsonResponse(['success' => true, 'message' => 'تم تحديث حالة الموعد']);
