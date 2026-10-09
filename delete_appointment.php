<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

$data = getRequestData();
$appointmentId = $data['id'] ?? ($_GET['id'] ?? null);

if (!$appointmentId) {
    jsonResponse(['success' => false, 'message' => 'رقم الموعد مطلوب']);
}

$pdo = getDB();
$stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ?');
$stmt->execute([$appointmentId]);

jsonResponse(['success' => true, 'message' => 'تم حذف الموعد']);
