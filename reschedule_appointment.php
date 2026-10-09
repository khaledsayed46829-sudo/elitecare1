<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$appointmentId = $data['id'] ?? null;
$newDate = cleanInput($data['date'] ?? '');
$newTime = cleanInput($data['time'] ?? '');

if (!$appointmentId || !$newDate || !$newTime) {
    jsonResponse(['success' => false, 'message' => 'من فضلك أدخل التاريخ والوقت الجديدين']);
}
if (strtotime($newDate) < strtotime(date('Y-m-d'))) {
    jsonResponse(['success' => false, 'message' => 'لا يمكن اختيار تاريخ سابق']);
}

$pdo = getDB();
$stmt = $pdo->prepare('SELECT id, status FROM appointments WHERE id = ? AND user_id = ?');
$stmt->execute([$appointmentId, $userId]);
$appt = $stmt->fetch();

if (!$appt) {
    jsonResponse(['success' => false, 'message' => 'الموعد غير موجود'], 404);
}
if (in_array($appt['status'], ['cancelled', 'completed'])) {
    jsonResponse(['success' => false, 'message' => 'لا يمكن تأجيل موعد ملغي أو منتهي']);
}

$stmt = $pdo->prepare(
    'UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = "pending" WHERE id = ? AND user_id = ?'
);
$stmt->execute([$newDate, $newTime, $appointmentId, $userId]);

jsonResponse(['success' => true, 'message' => 'تم تأجيل الموعد بنجاح']);
