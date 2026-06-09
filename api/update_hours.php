<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

require_once "connect_db.php";

$data = json_decode(file_get_contents("php://input"), true);

$stallID = trim($data["stallID"] ?? "");
$schedule = $data["schedule"] ?? [];

if ($stallID === "" || !is_array($schedule)) {
    echo json_encode(["success" => false, "message" => "Missing stallID or schedule"]);
    exit;
}

try {
    foreach ($schedule as $row) {
        $day = strtoupper(trim($row["operatingDay"] ?? ""));
        $isClosed = !empty($row["isClosed"]) ? 1 : 0;

        $openingTime = $isClosed ? null : (($row["openingTime"] ?? "") . ":00");
        $closingTime = $isClosed ? null : (($row["closingTime"] ?? "") . ":00");

        $check = $pdo->prepare("
            SELECT scheduleID FROM operating_schedule
            WHERE stallID = ? AND operatingDay = ?
            LIMIT 1
        ");
        $check->execute([$stallID, $day]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE operating_schedule
                SET openingTime = ?, closingTime = ?, isClosed = ?
                WHERE stallID = ? AND operatingDay = ?
            ");
            $stmt->execute([$openingTime, $closingTime, $isClosed, $stallID, $day]);
        } else {
            $stmtLast = $pdo->prepare("
                SELECT MAX(CAST(SUBSTRING(scheduleID, 2) AS UNSIGNED)) AS lastNum
                FROM operating_schedule
            ");
            $stmtLast->execute();

            $rowLast = $stmtLast->fetch(PDO::FETCH_ASSOC);

            $nextNum = ($rowLast["lastNum"] ?? 0) + 1;

            $scheduleID = "O" . str_pad($nextNum, 4, "0", STR_PAD_LEFT);

            $stmt = $pdo->prepare("
                INSERT INTO operating_schedule
                (scheduleID, stallID, operatingDay, openingTime, closingTime, isClosed)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$scheduleID, $stallID, $day, $openingTime, $closingTime, $isClosed]);
        }
    }

    echo json_encode(["success" => true, "message" => "Operating hours saved"]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to save operating hours",
        "error" => $e->getMessage()
    ]);
}
?>