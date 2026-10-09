<?php
// ============================================
// دوال مساعدة مشتركة لكل الملفات
// ============================================

// إرجاع رد JSON موحّد وإنهاء التنفيذ
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// قراءة بيانات الطلب سواء JSON أو form-data
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        return $data ?? [];
    }
    return $_POST;
}

// بدء الجلسة إن لم تكن بدأت
function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

// التأكد إن المستخدم مسجل دخول - وإلا يرجع خطأ 401
function requireLogin() {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً'], 401);
    }
    return $_SESSION['user_id'];
}

// التأكد إن المستخدم أدمن - وإلا يرجع خطأ 403
function requireAdmin() {
    startSecureSession();
    if (empty($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
        jsonResponse(['success' => false, 'message' => 'غير مصرح لك بالدخول'], 403);
    }
    return $_SESSION['user_id'];
}

// تنظيف المدخلات النصية
function cleanInput($value) {
    return trim(htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8'));
}

// التحقق من صحة الإيميل
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// السماح بطلبات CORS أثناء التطوير (شيلها أو ضبطها لو الفرونت والباك على نفس الدومين)
function allowCors() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
