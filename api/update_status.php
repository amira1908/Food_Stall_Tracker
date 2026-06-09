<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$stallID = trim($data["stallID"] ?? "");
$stallStatus = strtoupper(trim($data["stallStatus"] ?? ""));

$allowedStatus = [
    "OPEN",
    "CLOSED",
    "BUSY",
    "UNDER MAINTENANCE"
];

if (empty($stallID) || empty($stallStatus)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing stallID or stallStatus"
    ]);
    exit;
}

if (!in_array($stallStatus, $allowedStatus)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid stall status"
    ]);
    exit;
}

try {

    $stmt = $pdo->prepare("
        UPDATE stall_profile
        SET stallStatus = ?
        WHERE stallID = ?
    ");

    $stmt->execute([$stallStatus, $stallID]);

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Stall not found or status unchanged"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Stall status updated successfully",
        "stallID" => $stallID,
        "stallStatus" => $stallStatus
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to update stall status",
        "error" => $e->getMessage()
    ]);

}

?>