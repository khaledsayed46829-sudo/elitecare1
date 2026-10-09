<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

$pdo = getDB();
$stmt = $pdo->query(
    'SELECT a.*, u.first_name, u.last_name, u.email
     FROM appointments a JOIN users u ON u.id = a.user_id
     ORDER BY a.id DESC'
);
$rows = $stmt->fetchAll();

$appointments = array_map(function ($a) {
    return [
        'id' => (int) $a['id'],
        'patientName' => trim($a['first_name'] . ' ' . $a['last_name']),
        'patientEmail' => $a['email'],
        'doctorName' => $a['doctor_name'],
        'specialty' => $a['specialty'],
        'date' => $a['appointment_date'],
        'time' => $a['appointment_time'],
        'status' => $a['status'],
        'notes' => $a['notes'],
    ];
}, $rows);

jsonResponse(['success' => true, 'appointments' => $appointments]);
