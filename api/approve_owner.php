<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$userID = trim($data["userID"] ?? "");

if ($userID === "") {
    echo json_encode(["success" => false, "message" => "Missing userID"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE stall_owner
        SET isApproved = 1
        WHERE userID = ?
    ");

    $stmt->execute([$userID]);

    echo json_encode([
        "success" => true,
        "message" => "Owner approved"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Approve failed",
        "error" => $e->getMessage()
    ]);
}
?>