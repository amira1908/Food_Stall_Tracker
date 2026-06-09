<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$foodID = trim($data["foodID"] ?? "");
$stallID = trim($data["stallID"] ?? "");
$foodName = trim($data["foodName"] ?? "");
$foodPrice = trim($data["foodPrice"] ?? "");
$foodCategory = trim($data["foodCategory"] ?? "Food");
$foodPicture = trim($data["foodPicture"] ?? "");
$foodStatus = strtoupper(trim($data["foodStatus"] ?? "AVAILABLE"));

$foodPrice = str_replace(["RM", "rm", ","], "", $foodPrice);

if ($foodName === "" || $foodPrice === "") {
    echo json_encode([
        "success" => false,
        "message" => "Missing foodName or foodPrice"
    ]);
    exit;
}

if (!is_numeric($foodPrice)) {
    echo json_encode([
        "success" => false,
        "message" => "Food price must be a number"
    ]);
    exit;
}

try {

    if ($foodID !== "") {
        $stmt = $pdo->prepare("
            UPDATE food_item
            SET foodName = ?,
                foodPrice = ?,
                foodCategory = ?,
                foodPicture = ?,
                foodStatus = ?
            WHERE foodID = ?
        ");

        $stmt->execute([
            $foodName,
            $foodPrice,
            $foodCategory,
            $foodPicture,
            $foodStatus,
            $foodID
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Menu item updated successfully",
            "foodID" => $foodID
        ]);
        exit;
    }

    if ($stallID === "") {
        echo json_encode([
            "success" => false,
            "message" => "Missing stallID for new menu item"
        ]);
        exit;
    }

    $menuStmt = $pdo->prepare("
        SELECT menuID
        FROM stall_menu
        WHERE stallID = ?
        LIMIT 1
    ");
    $menuStmt->execute([$stallID]);
    $menu = $menuStmt->fetch(PDO::FETCH_ASSOC);

    if ($menu) {
        $menuID = $menu["menuID"];
    } else {
        $menuID = "M" . date("His") . rand(10, 99);

        $createMenu = $pdo->prepare("
            INSERT INTO stall_menu (menuID, stallID)
            VALUES (?, ?)
        ");
        $createMenu->execute([$menuID, $stallID]);
    }

    $foodID = "F" . date("His") . rand(10, 99);

    $insert = $pdo->prepare("
        INSERT INTO food_item
        (foodID, menuID, foodName, foodPrice, foodCategory, foodPicture, foodStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $insert->execute([
        $foodID,
        $menuID,
        $foodName,
        $foodPrice,
        $foodCategory,
        $foodPicture,
        $foodStatus
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Menu item added successfully",
        "foodID" => $foodID,
        "menuID" => $menuID
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Menu operation failed",
        "error" => $e->getMessage()
    ]);
}
?>