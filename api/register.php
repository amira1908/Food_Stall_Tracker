<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$stallName = trim($data["stallName"] ?? "");
$phone = trim($data["phone"] ?? "");
$password = trim($data["password"] ?? "");

if ($username === "" || $stallName === "" || $phone === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all fields"
    ]);
    exit;
}

try {
    $check = $pdo->prepare("
        SELECT userID
        FROM stall_owner
        WHERE phone = ?
        LIMIT 1
    ");
    $check->execute([$phone]);

    if ($check->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Phone number already registered"
        ]);
        exit;
    }

    $lastOwner = $pdo->query("
        SELECT MAX(CAST(SUBSTRING(userID, 2) AS UNSIGNED)) AS lastNum
        FROM stall_owner
    ")->fetch(PDO::FETCH_ASSOC);

    $nextUserNum = ($lastOwner["lastNum"] ?? 0) + 1;
    $userID = "U" . str_pad($nextUserNum, 3, "0", STR_PAD_LEFT);

    $lastStall = $pdo->query("
        SELECT MAX(CAST(SUBSTRING(stallID, 2) AS UNSIGNED)) AS lastNum
        FROM stall_profile
    ")->fetch(PDO::FETCH_ASSOC);

    $nextStallNum = ($lastStall["lastNum"] ?? 0) + 1;
    $stallID = "S" . str_pad($nextStallNum, 3, "0", STR_PAD_LEFT);

    $lastMenu = $pdo->query("
        SELECT MAX(CAST(SUBSTRING(menuID, 2) AS UNSIGNED)) AS lastNum
        FROM stall_menu
    ")->fetch(PDO::FETCH_ASSOC);

    $nextMenuNum = ($lastMenu["lastNum"] ?? 0) + 1;
    $menuID = "M" . str_pad($nextMenuNum, 3, "0", STR_PAD_LEFT);

    $lastLocation = $pdo->query("
        SELECT MAX(CAST(SUBSTRING(locationID, 2) AS UNSIGNED)) AS lastNum
        FROM stall_location
    ")->fetch(PDO::FETCH_ASSOC);

    $nextLocationNum = ($lastLocation["lastNum"] ?? 0) + 1;
    $locationID = "L" . str_pad($nextLocationNum, 3, "0", STR_PAD_LEFT);

    $pdo->beginTransaction();

    $stmt1 = $pdo->prepare("
        INSERT INTO stall_profile
        (stallID, stallName, stallPicture, stallEmoji, stallStatus, stallDescription)
        VALUES (?, ?, NULL, '🏪', 'CLOSED', '')
    ");
    $stmt1->execute([$stallID, $stallName]);

    $stmt2 = $pdo->prepare("
        INSERT INTO stall_owner
        (userID, username, password, stallID, isApproved, phone)
        VALUES (?, ?, ?, ?, 0, ?)
    ");
    $stmt2->execute([
        $userID,
        $username,
        $password,
        $stallID,
        $phone
    ]);

    $stmt3 = $pdo->prepare("
        INSERT INTO stall_menu
        (menuID, stallID)
        VALUES (?, ?)
    ");
    $stmt3->execute([$menuID, $stallID]);

    $stmt4 = $pdo->prepare("
        INSERT INTO stall_location
        (locationID, stallID, latitude, longitude, addressDescription)
        VALUES (?, ?, NULL, NULL, '')
    ");
    $stmt4->execute([$locationID, $stallID]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registration submitted"
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => "Registration failed",
        "error" => $e->getMessage()
    ]);
}
?>