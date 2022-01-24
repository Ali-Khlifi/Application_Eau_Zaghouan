<?php
include 'conn.php';
if (isset($_POST['commune']) and isset($_POST['type'])) {
    $content = array();
    $commune = filter_var($_POST['commune']);
    $tables_pts_eau = ['forage_agri', 'forage_sonede', 'puits_surface', 'source_naturelle'];
        foreach ($tables_pts_eau as $pt_eau) {
            $stmt = $dbh->prepare("SELECT pts.* FROM mehdi_ali.communes as c, mehdi_ali.".$pt_eau." as pts 
            WHERE ST_Within(pts.geom, c.geom) AND c.nom=:commune"); // requete spatiale pour afficher les pts d'eau existants dans la communes choisis! 
            $stmt->bindParam('commune', $commune);
            $stmt->execute();
            $lignes = $stmt->fetchAll();
            $content[$pt_eau] = count($lignes);
        }
    echo json_encode(graph_data($content));
} else {
    echo 'No';
}

function graph_data($data) {
    $tableau_app = ['Forage rural', 'Forage urbain', 'Puits', 'Source Naturelle'];
    $type = $_POST['type'];
    $graph = [];
    $i = 0;
    foreach ($data as $key => $value) {
        if ($value != 0) {
            if ($type == $key) {
                $temp = [$tableau_app[$i], $value, true, true];
                array_push($graph, $temp);
            } else {
                $temp = [$tableau_app[$i], $value, false];
                array_push($graph, $temp);
            }
        }
        $i += 1;
    }
    return $graph;
}

?>