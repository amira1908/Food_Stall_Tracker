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
            so.username,
            so.phone,
            so.isApproved,
            sl.latitude,
            sl.longitude,
            sl.addressDescription
        FROM stall_profile sp
        JOIN stall_owner so
        ON sp.stallID = so.stallID
        LEFT JOIN stall_location sl
        ON sp.stallID = sl.stallID
        WHERE so.isApproved = 1
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