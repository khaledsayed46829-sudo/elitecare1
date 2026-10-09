<?php
require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();
requireAdmin();

$pdo = getDB();
$rows = $pdo->query(
    'SELECT id, first_name, last_name, email, phone, is_admin, created_at FROM users ORDER BY id DESC'
)->fetchAll();

$users = array_map(function ($u) {
    return [
        'id' => (int) $u['id'],
        'firstName' => $u['first_name'],
        'lastName' => $u['last_name'],
        'email' => $u['email'],
        'phone' => $u['phone'],
        'isAdmin' => (bool) $u['is_admin'],
        'createdAt' => $u['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'users' => $users]);
