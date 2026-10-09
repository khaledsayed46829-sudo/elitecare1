<?php
require_once __DIR__ . 'functions.php';

allowCors();
startSecureSession();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path']);
}
session_destroy();

jsonResponse(['success' => true, 'message' => 'تم تسجيل الخروج بنجاح']);
