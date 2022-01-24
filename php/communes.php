<?php
include 'conn.php';
$stmt = $dbh->prepare("SELECT DISTINCT nom FROM mehdi_ali.communes;");
$stmt->execute();
$lignes = $stmt->fetchAll();
if (count($lignes) == 0) {
    echo "No";
} else {
    $html = "";
    foreach ($lignes as $ligne) {
        $html .= "<option value='".$ligne['nom']."'>".$ligne['nom']."</option>";
    }
    echo $html;
}
?>