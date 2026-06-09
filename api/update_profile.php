<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$stallID = trim($data["stallID"] ?? "");
$stallName = trim($data["stallName"] ?? "");
$stallDescription = trim($data["stallDescription"] ?? "");
$stallPicture = trim($data["stallPicture"] ?? "");
$addressDescription = trim($data["addressDescription"] ?? "");
$latitude = trim($data["latitude"] ?? "");
$longitude = trim($data["longitude"] ?? "");
$phone = trim($data["phone"] ?? "");

if ($stallID === "" || $stallName === "") {
    echo json_encode([
        "success" => false,
        "message" => "Missing stallID or stallName"
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE stall_profile
        SET stallName = ?,
            stallDescription = ?,
            stallPicture = ?
        WHERE stallID = ?
    ");

    $stmt->execute([
        $stallName,
        $stallDescription,
        $stallPicture,
        $stallID
    ]);

    $loc = $pdo->prepare("
        UPDATE stall_location
        SET latitude = ?,
            longitude = ?,
            addressDescription = ?
        WHERE stallID = ?
    ");

    $loc->execute([
        $latitude,
        $longitude,
        $addressDescription,
        $stallID
    ]);

    if ($phone !== "") {
        $owner = $pdo->prepare("
            UPDATE stall_owner
            SET phone = ?
            WHERE stallID = ?
        ");

        $owner->execute([
            $phone,
            $stallID
        ]);
    }

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully"
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update profile",
        "error" => $e->getMessage()
    ]);
}
?>