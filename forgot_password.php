<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data  = getRequestData();
$email = strtolower(cleanInput($data['email'] ?? ''));

if (!isValidEmail($email)) {
    jsonResponse(['success' => false, 'message' => 'صيغة البريد الإلكتروني غير صحيحة']);
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// ملاحظة أمنية: نرجّع نفس الرسالة سواء الإيميل موجود أو لأ، عشان محدش يقدر
// يستخدم الفورم ده لمعرفة إيميلات مسجلة في النظام
if ($user) {
    $token     = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // صالح لمدة ساعة

    $stmt = $pdo->prepare(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)'
    );
    $stmt->execute([$email, $token, $expiresAt]);

    // ----- TODO: ابعت الرابط ده فعلياً بإيميل باستخدام PHPMailer -----
    // $resetLink = "https://yourdomain.com/reset-password.html?token=$token";
    // mail($email, "استعادة كلمة المرور - Elite Care", "اضغط هنا: $resetLink");
}

jsonResponse([
    'success' => true,
    'message' => 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة تحتوي على رابط استعادة كلمة المرور',
]);
