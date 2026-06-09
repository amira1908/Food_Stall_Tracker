<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "connect_db.php";

try {

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
        WHERE sp.stallStatus <> 'INACTIVE'
        ORDER BY sp.stallName ASC
    ");

    $stmt->execute();
    $stalls = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($stalls as &$stall) {

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

        $menuStmt->execute([$stall["stallID"]]);

        $stall["menu"] = $menuStmt->fetchAll(PDO::FETCH_ASSOC);

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

$scheduleStmt->execute([$stall["stallID"]]);

$stall["schedule"] = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "success" => true,
        "stalls" => $stalls
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load stalls",
        "error" => $e->getMessage()
    ]);

}

?>