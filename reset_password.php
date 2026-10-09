<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data        = getRequestData();
$token       = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (!$token || strlen($newPassword) < 6) {
    jsonResponse(['success' => false, 'message' => 'بيانات غير صحيحة، تأكد من كلمة المرور (6 أحرف على الأقل)']);
}

$pdo = getDB();
$stmt = $pdo->prepare(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
);
$stmt->execute([$token]);
$reset = $stmt->fetch();

if (!$reset) {
    jsonResponse(['success' => false, 'message' => 'رابط الاستعادة غير صالح أو منتهي الصلاحية'], 400);
}

$passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?');
$stmt->execute([$passwordHash, $reset['email']]);

// حذف كل التوكنز الخاصة بالإيميل ده بعد الاستخدام
$stmt = $pdo->prepare('DELETE FROM password_resets WHERE email = ?');
$stmt->execute([$reset['email']]);

jsonResponse(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن']);
