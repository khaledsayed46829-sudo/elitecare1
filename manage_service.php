<?php
// إضافة / تعديل / حذف خدمة - يتطلب صلاحية أدمن
// الاستخدام: POST مع action = add | update | delete

require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$action = $data['action'] ?? '';
$pdo = getDB();
$features = json_encode($data['features'] ?? [], JSON_UNESCAPED_UNICODE);

switch ($action) {
    case 'add':
        $stmt = $pdo->prepare(
            'INSERT INTO services (icon, title, short_desc, full_desc, features) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            cleanInput($data['icon'] ?? ''),
            cleanInput($data['title'] ?? ''),
            cleanInput($data['shortDesc'] ?? ''),
            cleanInput($data['fullDesc'] ?? ''),
            $features,
        ]);
        jsonResponse(['success' => true, 'message' => 'تم إضافة الخدمة بنجاح', 'id' => $pdo->lastInsertId()]);
        break;

    case 'update':
        if (empty($data['id'])) jsonResponse(['success' => false, 'message' => 'رقم الخدمة مطلوب']);
        $stmt = $pdo->prepare(
            'UPDATE services SET icon=?, title=?, short_desc=?, full_desc=?, features=? WHERE id=?'
        );
        $stmt->execute([
            cleanInput($data['icon'] ?? ''),
            cleanInput($data['title'] ?? ''),
            cleanInput($data['shortDesc'] ?? ''),
            cleanInput($data['fullDesc'] ?? ''),
            $features,
            $data['id'],
        ]);
        jsonResponse(['success' => true, 'message' => 'تم تحديث الخدمة']);
        break;

    case 'delete':
        if (empty($data['id'])) jsonResponse(['success' => false, 'message' => 'رقم الخدمة مطلوب']);
        $stmt = $pdo->prepare('DELETE FROM services WHERE id = ?');
        $stmt->execute([$data['id']]);
        jsonResponse(['success' => true, 'message' => 'تم حذف الخدمة']);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'إجراء غير معروف'], 400);
}
