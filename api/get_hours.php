<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "connect_db.php";

$stallID = $_GET["stallID"] ?? "";

if ($stallID === "") {
    echo json_encode(["success" => false, "message" => "Missing stallID"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT operatingDay, openingTime, closingTime, isClosed
        FROM operating_schedule
        WHERE stallID = ?
    ");
    $stmt->execute([$stallID]);

    echo json_encode([
        "success" => true,
        "schedule" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to load hours",
        "error" => $e->getMessage()
    ]);
}
?>