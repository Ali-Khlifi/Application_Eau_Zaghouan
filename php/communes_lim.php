<?php
include 'conn.php';
$stmt = $dbh->prepare("SELECT St_AsGeoJSON(St_SnapToGrid(St_Transform(geom, 4326), 0.00001)) as com FROM mehdi_ali.communes;");
$stmt->execute();
$lignes = $stmt->fetchAll();
if (count($lignes) == 0) {
    echo "No";
} else {
    echo json_encode($lignes);
}
?>