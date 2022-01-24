<?php
include 'conn.php';
if (isset($_POST['commune']) and isset($_POST['type'])) {
    $content = [];
    $commune = filter_var($_POST['commune']);
    $type = filter_var($_POST['type']);
    $stmt = $dbh->prepare("SELECT pts.*, St_AsGeoJSON(St_SnapToGrid(St_Transform(pts.geom, 4326), 0.00001)) as geom FROM mehdi_ali.communes as c, mehdi_ali.".$type." as pts 
    WHERE ST_Within(pts.geom, c.geom) AND c.nom=:commune"); // requete spatiale pour afficher les pts d'eau existants dans la communes choisis! 
	$stmt->bindParam('commune', $commune);
    $stmt->execute();
    $lignes = $stmt->fetchAll();
    $stmt_commune = $dbh->prepare("SELECT St_AsGeoJSON(St_SnapToGrid(St_Transform(geom, 4326), 0.00001)) as geom FROM mehdi_ali.communes WHERE nom=:commune");
    $stmt_commune->bindParam('commune', $commune);
	$stmt_commune->execute();
    $lignes_commune = $stmt_commune->fetchAll();
    foreach ($lignes as $ligne) {
        $ligne['type'] = $type;
        array_push($content, $ligne);
    }
    array_push($content, $lignes_commune[0]);
    echo json_encode($content);
} else {
    echo 'No';
}
?>