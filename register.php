<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
startSecureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();

$firstName = cleanInput($data['firstName'] ?? '');
$lastName  = cleanInput($data['lastName'] ?? '');
$email     = strtolower(cleanInput($data['email'] ?? ''));
$phone     = cleanInput($data['phone'] ?? '');
$password  = $data['password'] ?? '';
$confirm   = $data['confirmPassword'] ?? '';

// ----- تحقق من صحة البيانات -----
if (!$firstName || !$lastName || !$email || !$phone || !$password) {
    jsonResponse(['success' => false, 'message' => 'من فضلك املأ جميع الحقول المطلوبة']);
}
if (!isValidEmail($email)) {
    jsonResponse(['success' => false, 'message' => 'صيغة البريد الإلكتروني غير صحيحة']);
}
if (strlen($password) < 6) {
    jsonResponse(['success' => false, 'message' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل']);
}
if ($confirm !== '' && $password !== $confirm) {
    jsonResponse(['success' => false, 'message' => 'كلمتا المرور غير متطابقتين']);
}

$pdo = getDB();

// ----- التأكد إن الإيميل مش مستخدم قبل كده -----
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['success' => false, 'message' => 'البريد الإلكتروني مستخدم بالفعل']);
}

// ----- إضافة المستخدم -----
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare(
    'INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$firstName, $lastName, $email, $phone, $passwordHash]);
$userId = $pdo->lastInsertId();

// ----- تسجيل الدخول تلقائياً بعد إنشاء الحساب -----
$_SESSION['user_id']  = $userId;
$_SESSION['is_admin'] = 0;

jsonResponse([
    'success' => true,
    'message' => 'تم إنشاء الحساب بنجاح',
    'user' => [
        'id' => $userId,
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'phone' => $phone,
    ],
]);
