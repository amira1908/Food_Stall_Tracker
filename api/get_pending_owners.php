<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "connect_db.php";

try {
    $stmt = $pdo->prepare("
        SELECT 
            so.userID,
            so.username,
            so.phone,
            so.stallID,
            sp.stallName
        FROM stall_owner so
        JOIN stall_profile sp
        ON so.stallID = sp.stallID
        WHERE so.isApproved = 0
        ORDER BY so.userID DESC
    ");

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "pending" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to load pending owners",
        "error" => $e->getMessage()
    ]);
}
?>