<?php
// ============================================
// إعدادات الاتصال بقاعدة البيانات
// ============================================
// الإعدادات دي مظبوطة على MAMP الافتراضي (بورت 8889، يوزر/باسورد root).
// لو شغال XAMPP بدل كده، رجّعها لـ: DB_HOST = 'localhost' و DB_PASS = ''
// ملف الاتصال بقاعدة البيانات

define('DB_HOST', '127.0.0.1:3306');
define('DB_NAME', 'elitecare');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('DB_CHARSET', 'utf8mb4');


function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            // بنطبع رسالة الخطأ الحقيقية من MySQL عشان تعرف سبب المشكلة بالظبط
            // (بورت غلط / يوزر غلط / الداتابيز مش متعمولة import).
            // احذف السطر ده (أو خليه فاضي) قبل ما ترفع الموقع على استضافة حقيقية.
            die(json_encode([
                'success' => false,
                'message' => 'فشل الاتصال بقاعدة البيانات',
                'debug' => $e->getMessage(),
            ], JSON_UNESCAPED_UNICODE));
        }
    }
    return $pdo;
}
