<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "connect_db.php";

$stallID = $_GET["stallID"] ?? "";

if (empty($stallID)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing stallID"
    ]);
    exit;
}

try {

    // GET STALL PROFILE + LOCATION
    $stmt = $pdo->prepare("
        SELECT 
            sp.stallID,
            sp.stallName,
            sp.stallPicture,
            sp.stallEmoji,
            sp.stallStatus,
            sp.stallDescription,
            sl.latitude,
            sl.longitude,
            sl.addressDescription
        FROM stall_profile sp
        LEFT JOIN stall_location sl
        ON sp.stallID = sl.stallID
        WHERE sp.stallID = ?
    ");

    $stmt->execute([$stallID]);
    $stall = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$stall) {
        echo json_encode([
            "success" => false,
            "message" => "Stall not found"
        ]);
        exit;
    }

    // GET MENU ITEMS
    $menuStmt = $pdo->prepare("
        SELECT 
            fi.foodID,
            fi.foodName,
            fi.foodPrice,
            fi.foodCategory,
            fi.foodPicture,
            fi.foodStatus
        FROM stall_menu sm
        LEFT JOIN food_item fi
        ON sm.menuID = fi.menuID
        WHERE sm.stallID = ?
    ");

    $menuStmt->execute([$stallID]);
    $stall["menu"] = $menuStmt->fetchAll(PDO::FETCH_ASSOC);

    // GET OPERATING SCHEDULE
    $scheduleStmt = $pdo->prepare("
        SELECT 
            scheduleID,
            operatingDay,
            openingTime,
            closingTime,
            isClosed
        FROM operating_schedule
        WHERE stallID = ?
        ORDER BY FIELD(
            operatingDay,
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY'
        )
    ");

    $scheduleStmt->execute([$stallID]);
    $stall["schedule"] = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "stall" => $stall
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load stall detail",
        "error" => $e->getMessage()
    ]);

}

?>