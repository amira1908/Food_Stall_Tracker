<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$phone = trim($data["phone"] ?? ($data["username"] ?? ""));
$password = trim($data["password"] ?? "");

if (empty($phone) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all fields"
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            so.userID,
            so.username,
            so.password,
            so.stallID,
            so.isApproved,
            so.phone,
            sp.stallName,
            sp.stallStatus,
            sp.stallEmoji
        FROM stall_owner so
        JOIN stall_profile sp
        ON so.stallID = sp.stallID
        WHERE so.phone = ?
    ");

    $stmt->execute([$phone]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $password !== $user["password"]) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid phone number or password"
        ]);
        exit;
    }

    if ($user["isApproved"] == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Your account is not approved yet"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => [
            "userID" => $user["userID"],
            "username" => $user["username"],
            "phone" => $user["phone"],
            "stallID" => $user["stallID"],
            "stallName" => $user["stallName"],
            "stallStatus" => $user["stallStatus"],
            "stallEmoji" => $user["stallEmoji"]
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Login failed",
        "error" => $e->getMessage()
    ]);
}
?>