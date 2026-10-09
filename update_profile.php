<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$firstName = cleanInput($data['firstName'] ?? '');
$lastName  = cleanInput($data['lastName'] ?? '');
$phone     = cleanInput($data['phone'] ?? '');

if (!$firstName || !$lastName) {
    jsonResponse(['success' => false, 'message' => 'الاسم مطلوب']);
}

$pdo = getDB();
$stmt = $pdo->prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?');
$stmt->execute([$firstName, $lastName, $phone, $userId]);

// ----- تغيير كلمة المرور (اختياري) -----
if (!empty($data['newPassword'])) {
    $currentPassword = $data['currentPassword'] ?? '';
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!password_verify($currentPassword, $row['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'كلمة المرور الحالية غير صحيحة']);
    }
    if (strlen($data['newPassword']) < 6) {
        jsonResponse(['success' => false, 'message' => 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل']);
    }

    $newHash = password_hash($data['newPassword'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$newHash, $userId]);
}

jsonResponse(['success' => true, 'message' => 'تم تحديث البيانات بنجاح']);
