<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$stallID = trim($data["stallID"] ?? "");
$status = strtoupper(trim($data["status"] ?? ""));

$allowed = ["OPEN", "CLOSED", "BUSY", "INACTIVE"];

if ($stallID === "" || !in_array($status, $allowed)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid stallID or status"
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE stall_profile
        SET stallStatus = ?
        WHERE stallID = ?
    ");

    $stmt->execute([$status, $stallID]);

    echo json_encode([
        "success" => true,
        "message" => "Stall status updated"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update stall status",
        "error" => $e->getMessage()
    ]);
}
?>