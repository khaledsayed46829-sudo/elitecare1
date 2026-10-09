<?php
// إضافة / تعديل / حذف طبيب - يتطلب صلاحية أدمن
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

switch ($action) {
    case 'add':
        $stmt = $pdo->prepare(
            'INSERT INTO doctors (name, specialty, category, image, rating, rating_count, degree, experience, languages, schedule_day, schedule_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            cleanInput($data['name'] ?? ''),
            cleanInput($data['specialty'] ?? ''),
            cleanInput($data['category'] ?? ''),
            cleanInput($data['image'] ?? ''),
            $data['rating'] ?? 5.0,
            $data['ratingCount'] ?? 0,
            cleanInput($data['degree'] ?? ''),
            cleanInput($data['experience'] ?? ''),
            cleanInput($data['languages'] ?? ''),
            cleanInput($data['scheduleDay'] ?? ''),
            cleanInput($data['scheduleTime'] ?? ''),
        ]);
        jsonResponse(['success' => true, 'message' => 'تم إضافة الطبيب بنجاح', 'id' => $pdo->lastInsertId()]);
        break;

    case 'update':
        if (empty($data['id'])) jsonResponse(['success' => false, 'message' => 'رقم الطبيب مطلوب']);
        $stmt = $pdo->prepare(
            'UPDATE doctors SET name=?, specialty=?, category=?, image=?, rating=?, rating_count=?, degree=?, experience=?, languages=?, schedule_day=?, schedule_time=? WHERE id=?'
        );
        $stmt->execute([
            cleanInput($data['name'] ?? ''),
            cleanInput($data['specialty'] ?? ''),
            cleanInput($data['category'] ?? ''),
            cleanInput($data['image'] ?? ''),
            $data['rating'] ?? 5.0,
            $data['ratingCount'] ?? 0,
            cleanInput($data['degree'] ?? ''),
            cleanInput($data['experience'] ?? ''),
            cleanInput($data['languages'] ?? ''),
            cleanInput($data['scheduleDay'] ?? ''),
            cleanInput($data['scheduleTime'] ?? ''),
            $data['id'],
        ]);
        jsonResponse(['success' => true, 'message' => 'تم تحديث بيانات الطبيب']);
        break;

    case 'delete':
        if (empty($data['id'])) jsonResponse(['success' => false, 'message' => 'رقم الطبيب مطلوب']);
        $stmt = $pdo->prepare('DELETE FROM doctors WHERE id = ?');
        $stmt->execute([$data['id']]);
        jsonResponse(['success' => true, 'message' => 'تم حذف الطبيب']);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'إجراء غير معروف'], 400);
}
