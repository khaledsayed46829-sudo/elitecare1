<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

$data = getRequestData();
$userId = $data['id'] ?? ($_GET['id'] ?? null);

if (!$userId) {
    jsonResponse(['success' => false, 'message' => 'رقم المستخدم مطلوب']);
}

$pdo = getDB();
// حذف المستخدم هيحذف تلقائياً مواعيده وتقييماته وإشعاراته (ON DELETE CASCADE)
$stmt = $pdo->prepare('DELETE FROM users WHERE id = ? AND is_admin = 0');
$stmt->execute([$userId]);

if ($stmt->rowCount() === 0) {
    jsonResponse(['success' => false, 'message' => 'لا يمكن حذف هذا المستخدم أو أنه غير موجود'], 400);
}

jsonResponse(['success' => true, 'message' => 'تم حذف المستخدم']);
