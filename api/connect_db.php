<?php

// =====================================
// DATABASE CONFIGURATION
// =====================================

$host = "localhost";
$dbname = "stall_tracker_system";
$username = "root";
$password = "";

// =====================================
// DATABASE CONNECTION
// =====================================

try {

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    // SHOW SQL ERRORS
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // FETCH MODE AS ASSOCIATIVE ARRAY
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {

    die(json_encode([
        "success" => false,
        "message" => "Database connection failed",
        "error" => $e->getMessage()
    ]));

}

?>