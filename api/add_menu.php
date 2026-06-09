<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$stallID = trim($data["stallID"] ?? "");
$foodName = trim($data["foodName"] ?? "");
$foodPrice = trim($data["foodPrice"] ?? "");
$foodCategory = trim($data["foodCategory"] ?? "");
$foodPicture = trim($data["foodPicture"] ?? "");

$foodStatus = strtoupper(trim($data["foodStatus"] ?? "AVAILABLE"));

$foodPrice = str_replace(["RM", "rm", ","], "", $foodPrice);

if ($stallID === "" || $foodName === "" || $foodPrice === "" || $foodCategory === "") {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
    exit;
}

try {
    $menuStmt = $pdo->prepare("SELECT menuID FROM stall_menu WHERE stallID = ? LIMIT 1");
    $menuStmt->execute([$stallID]);
    $menu = $menuStmt->fetch(PDO::FETCH_ASSOC);

    if ($menu) {
        $menuID = $menu["menuID"];
    } else {
        $menuID = "M" . date("His") . rand(10, 99);
        $createMenu = $pdo->prepare("INSERT INTO stall_menu (menuID, stallID) VALUES (?, ?)");
        $createMenu->execute([$menuID, $stallID]);
    }

    $getLast = $pdo->query("
    SELECT foodID 
    FROM food_item 
    ORDER BY foodID DESC 
    LIMIT 1
    ");

    $last = $getLast->fetch(PDO::FETCH_ASSOC);

    if ($last) {

        $num = intval(substr($last["foodID"], 1)) + 1;

    } else {

        $num = 1;

    }

    $foodID = "F" . str_pad($num, 3, "0", STR_PAD_LEFT);

        $stmt = $pdo->prepare("
            INSERT INTO food_item
            (foodID, menuID, foodName, foodPrice, foodCategory, foodPicture, foodStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

    $stmt->execute([
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
        "message" => "Menu added",
        "foodID" => $foodID
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Add menu failed",
        "error" => $e->getMessage()
    ]);
}
?>