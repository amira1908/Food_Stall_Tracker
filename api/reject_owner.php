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
    $pdo->beginTransaction();

    $get = $pdo->prepare("
        SELECT stallID
        FROM stall_owner
        WHERE userID = ?
    ");
    $get->execute([$userID]);

    $row = $get->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(["success" => false, "message" => "Owner not found"]);
        exit;
    }

    $stallID = $row["stallID"];

    $delete = $pdo->prepare("
        DELETE FROM stall_profile
        WHERE stallID = ?
    ");
    $delete->execute([$stallID]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registration rejected"
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => "Reject failed",
        "error" => $e->getMessage()
    ]);
}
?>