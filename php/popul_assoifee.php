<?php
include 'conn.php';
$stmt = $dbh->prepare("SELECT DISTINCT nom_dou FROM mehdi_ali.population_non_desservie;");
$stmt->execute();
$lignes = $stmt->fetchAll();
if (count($lignes) == 0) {
    echo "No";
} else {
    $html = "";
    foreach ($lignes as $ligne) {
        $html .= "<option value='".$ligne['nom_dou']."'>".$ligne['nom_dou']."</option>";
    }
    echo $html;
}
?>