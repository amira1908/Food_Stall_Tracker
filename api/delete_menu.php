<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$foodID = trim($data["foodID"] ?? "");

if ($foodID === "") {
    echo json_encode([
        "success" => false,
        "message" => "Missing foodID"
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        DELETE FROM food_item
        WHERE foodID = ?
    ");

    $stmt->execute([$foodID]);

    echo json_encode([
        "success" => true,
        "message" => "Menu item deleted successfully"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete menu item",
        "error" => $e->getMessage()
    ]);
}
?>