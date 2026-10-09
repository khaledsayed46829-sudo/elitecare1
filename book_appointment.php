<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'طريقة الطلب غير مسموحة'], 405);
}

$data = getRequestData();
$doctorId   = $data['doctorId'] ?? null;
$doctorName = cleanInput($data['doctorName'] ?? '');
$specialty  = cleanInput($data['specialty'] ?? '');
$date       = cleanInput($data['date'] ?? '');
$time       = cleanInput($data['time'] ?? '');
$notes      = cleanInput($data['notes'] ?? '');

if (!$doctorName || !$date || !$time) {
    jsonResponse(['success' => false, 'message' => 'من فضلك اختر الطبيب والتاريخ والوقت']);
}

// تاريخ الموعد لازم يكون في المستقبل
if (strtotime($date) < strtotime(date('Y-m-d'))) {
    jsonResponse(['success' => false, 'message' => 'لا يمكن حجز موعد في تاريخ سابق']);
}

$pdo = getDB();
$stmt = $pdo->prepare(
    'INSERT INTO appointments (user_id, doctor_id, doctor_name, specialty, appointment_date, appointment_time, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, "pending", ?)'
);
$stmt->execute([$userId, $doctorId ?: null, $doctorName, $specialty, $date, $time, $notes]);
$appointmentId = $pdo->lastInsertId();

// إشعار للمستخدم
$stmt = $pdo->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
$stmt->execute([$userId, "تم حجز موعدك مع $doctorName بتاريخ $date الساعة $time بنجاح، بانتظار التأكيد"]);

jsonResponse([
    'success' => true,
    'message' => 'تم حجز الموعد بنجاح',
    'appointment' => [
        'id' => $appointmentId,
        'doctorName' => $doctorName,
        'specialty' => $specialty,
        'date' => $date,
        'time' => $time,
        'status' => 'pending',
    ],
]);
