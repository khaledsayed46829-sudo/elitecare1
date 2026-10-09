<?php
// بحث حي عبر: الدكاترة، الخدمات، وصفحات ثابتة
// الاستخدام: GET search.php?q=كلمة البحث

require_once __DIR__ . 'db.php';
require_once __DIR__ . 'functions.php';

allowCors();

$query = trim(cleanInput($_GET['q'] ?? ''));

if ($query === '') {
    jsonResponse(['success' => true, 'results' => []]);
}

$pdo = getDB();
$like = '%' . $query . '%';
$results = [];

// ----- بحث في الدكاترة -----
$stmt = $pdo->prepare('SELECT id, name, specialty FROM doctors WHERE name LIKE ? OR specialty LIKE ? LIMIT 5');
$stmt->execute([$like, $like]);
foreach ($stmt->fetchAll() as $d) {
    $results[] = [
        'title' => $d['name'] . ' - ' . $d['specialty'],
        'category' => 'طبيب',
        'page' => 'doctors',
        'icon' => 'fa-user-md',
    ];
}

// ----- بحث في الخدمات -----
$stmt = $pdo->prepare('SELECT id, title, icon FROM services WHERE title LIKE ? OR short_desc LIKE ? LIMIT 5');
$stmt->execute([$like, $like]);
foreach ($stmt->fetchAll() as $s) {
    $results[] = [
        'title' => $s['title'],
        'category' => 'خدمة',
        'page' => 'services',
        'icon' => $s['icon'] ?: 'fa-stethoscope',
    ];
}

// ----- صفحات ثابتة (زي الفهرس الموجود في main.js) -----
$staticPages = [
    ['title' => 'الصفحة الرئيسية', 'page' => 'home', 'icon' => 'fa-home'],
    ['title' => 'عن المستشفى', 'page' => 'about', 'icon' => 'fa-info-circle'],
    ['title' => 'حجز موعد', 'page' => 'appointments', 'icon' => 'fa-calendar-check'],
    ['title' => 'تواصل معنا', 'page' => 'contact', 'icon' => 'fa-envelope'],
    ['title' => 'الأسئلة الشائعة', 'page' => 'faq', 'icon' => 'fa-question-circle'],
];
foreach ($staticPages as $p) {
    if (mb_stripos($p['title'], $query) !== false) {
        $results[] = [
            'title' => $p['title'],
            'category' => 'صفحة',
            'page' => $p['page'],
            'icon' => $p['icon'],
        ];
    }
}

jsonResponse(['success' => true, 'results' => array_slice($results, 0, 8)]);
