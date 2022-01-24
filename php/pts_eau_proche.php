<?php
include 'conn.php';
if (isset($_POST['distance']) and isset($_POST['population'])) {
    $content = [];
    $distance = filter_var($_POST['distance']);
    $population = filter_var($_POST['population']);
    $stmt_pop = $dbh->prepare("SELECT *, St_AsGeoJSON(St_SnapToGrid(St_Transform(pop.geom, 4326), 0.00001)) as pop_geom
    FROM mehdi_ali.population_non_desservie as pop
    WHERE nom_dou=:douar");
    $stmt_pop->bindParam('douar', $population);
    $stmt_pop->execute();
    $lignes_pop = $stmt_pop->fetchAll();
    array_push($content, $lignes_pop[0]);
    $tables_pts_eau = ['forage_agri', 'forage_sonede', 'puits_surface', 'source_naturelle'];
    foreach ($tables_pts_eau as $pt_eau) {
        $stmt = $dbh->prepare("WITH Knn AS (SELECT 
            pop_non_ds.nom_dou,
            pts_eau.*,
            St_AsGeoJSON(St_SnapToGrid(St_Transform(pop_non_ds.geom, 4326), 0.00001)) as pop_geom, 
            St_AsGeoJSON(St_SnapToGrid(St_Transform(pts_eau.geom, 4326), 0.00001)) as pts_eau_geom, 
            round(ST_Distance(pts_eau.geom, pop_non_ds.geom)::numeric,2) as Distance, 
            row_number() OVER (PARTITION BY pop_non_ds.id ORDER BY ST_Distance(pts_eau.geom, pop_non_ds.geom)) AS rank 
            FROM  mehdi_ali.population_non_desservie as pop_non_ds, 
            mehdi_ali.".$pt_eau." as pts_eau 
            )
            SELECT * FROM knn WHERE distance < :dist and nom_dou=:douar ORDER BY rank asc"
        );
        $stmt->bindParam('dist', $distance);
        $stmt->bindParam('douar', $population);
        $stmt->execute();
        $lignes = $stmt->fetchAll();
        foreach ($lignes as $ligne) {
            $ligne['type'] = $pt_eau;
            array_push($content, $ligne);
        }
    }
    echo json_encode($content);
}
?>