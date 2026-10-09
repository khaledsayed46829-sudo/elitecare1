<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
$userId = requireLogin();

$pdo = getDB();
$stmt = $pdo->prepare(
    'SELECT id, doctor_id, doctor_name, specialty, appointment_date, appointment_time, status, notes, created_at
     FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC, id DESC'
);
$stmt->execute([$userId]);
$rows = $stmt->fetchAll();

$appointments = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'doctorId' => $row['doctor_id'] ? (int) $row['doctor_id'] : null,
        'doctorName' => $row['doctor_name'],
        'specialty' => $row['specialty'],
        'date' => $row['appointment_date'],
        'time' => $row['appointment_time'],
        'status' => $row['status'],
        'notes' => $row['notes'],
        'createdAt' => $row['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'appointments' => $appointments]);
