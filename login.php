<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
startSecureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$email    = strtolower(cleanInput($data['email'] ?? ''));
$password = $data['password'] ?? '';
$remember = !empty($data['remember']);

if (!$email || !$password) {
    jsonResponse(['success' => false, 'message' => 'من فضلك أدخل البريد الإلكتروني وكلمة المرور']);
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['success' => false, 'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة'], 401);
}

// ----- تفعيل الجلسة -----
$_SESSION['user_id']  = $user['id'];
$_SESSION['is_admin'] = (int) $user['is_admin'];

// ----- لو "تذكرني" مفعّلة، مدّد عمر الكوكي 30 يوم -----
if ($remember) {
    setcookie(session_name(), session_id(), time() + (30 * 24 * 60 * 60), '/');
}

jsonResponse([
    'success' => true,
    'message' => 'تم تسجيل الدخول بنجاح',
    'isAdmin' => (bool) $user['is_admin'],
    'user' => [
        'id' => $user['id'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
    ],
]);
