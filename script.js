// Map initalisation
var map = L.map('map').setView([51.505, -0.09], 13);

const stadia_url = "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"

// Mini Map
var stadia = new L.TileLayer(stadia_url, {minZoom: 0, maxZoom: 13});
var miniMap = new L.Control.MiniMap(stadia).addTo(map);

// Basemap selector
const esri_imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
const stadia_basemap = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});
const OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
var iconLayersControl = new L.Control.IconLayers(
    [
        {
            title: 'Stadia Maps',
            layer: stadia_basemap,
            icon: 'assets/images/stadia.png'
        },
        {
            title: 'Esri imagery',
            layer: esri_imagery,
            icon: 'assets/images/esri.png'
        },
        {
            title: 'OpenStreetMap',
            layer: OpenStreetMap_Mapnik,
            icon: 'assets/images/osm.png'
        },
    ], {
        position: 'bottomleft',
        maxLayersInRow: 5
    }
);

iconLayersControl.addTo(map);

const reseau_hydro = L.tileLayer.wms('http://37.187.79.5:8080/geoserver/mehdi_ali/wms?', {
    layers: 'mehdi_ali:reseau',
    transparent: true,
    format: 'image/png',
}).addTo(map);

var baseMaps = {};

var overlayMaps = {
    "Réseau d'eau potable": reseau_hydro
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

var sidebar = L.control.sidebar('sidebar', {
    position: 'left'
});

map.addControl(sidebar);

$(document).ready(function() {
    var pts_eau = L.markerClusterGroup();
    var pop_assoi = L.featureGroup();
    var buffer = L.featureGroup();
    var coms = L.featureGroup();
    map.addLayer(coms);
    map.addLayer(buffer);
    map.addLayer(pts_eau);
    map.addLayer(pop_assoi);
    // Récupération des communes
    $.ajax({
        url: 'php/communes_lim.php',
        type: 'POST',
        success: function(data) {
            if (data !== 'No') {
                data = JSON.parse(data);
                for(var commune in data) {
                    const geometry = JSON.parse(data[commune]['com']);
                    L.geoJSON(geometry, {
                        style: function(feature) {
                            return {color: "black", "fillOpacity": 0};
                        }
                    }).addTo(coms);
                }
                map.fitBounds(coms.getBounds());
            }
        },
        error: function(err1, err2, err3) {
            alert("Une erreur s'est produite lors de la récupération des limites des communes !");
        }
    })
    // Récupération de la liste des communes
    $.ajax({
        url: 'php/communes.php',
        type: 'POST',
        success: function(data) {
            if (data != 'No') {
                $('#communes').html(data);
            }
        },
        error: function(err1, err2, err3) {
            alert("Une erreur s'est produite lors de la récupération de la liste des communes !");
        }
    })

    // Événement qui se déclenche après avoir cliqué sur le button recherche
    $('#search_pts').click(function(evt) {
        if ($('#communes').val() !== "" && $('#pts_eau').val() !== "") {
            pts_eau.clearLayers();
            buffer.clearLayers();
            pop_assoi.clearLayers();
            // Recherche des points d'eau
            $.ajax({
                url: 'php/pts_eau.php',
                type: 'POST',
                data: {
                    'commune': $('#communes').val(),
                    'type': $('#pts_eau').val()
                },
                success: function(data) {
                    if (data != 'No') {
                        // Récupération des données de la requête
                        data = JSON.parse(data);
                        for (var i = 0; i < data.length; i++) {
                            const geometry = JSON.parse(data[i]['geom']);
                            if (geometry['type'] == 'Point') {
                                var marker_pop = L.marker(geometry['coordinates'].reverse(), {
                                    icon: L.BeautifyIcon.icon({icon: 'tint', iconShape: 'marker', borderColor: '#00ABDC', textColor: '#00ABDC'})
                                }).bindPopup(prepare_popup(data[i]));
                                pts_eau.addLayer(marker_pop);
                            } else {
                                L.geoJSON(geometry).addTo(pts_eau);
                            }
                        }
                        map.fitBounds(pts_eau.getBounds());
                    } else {
                        alert('Pas de réponse !');
                    }
                },
                error: function(err1, err2, err3) {
                    alert("Une erreur s'est produite lors de la récupération de la liste des points d'eau !");
                }
            })

            // Dessiner le graph
            $.ajax({
                url: 'php/communes_graph.php',
                type: 'POST',
                data: {
                    'commune': $('#communes').val(),
                    'type': $('#pts_eau').val()
                },
                success: function(data) {
                    Highcharts.chart('graph_commune', {
                        chart: {
                            styledMode: true
                        },
                        title: {
                            text: "Points d'eau de la commune " + $('#communes').val()
                        },
                        series: [{
                            type: 'pie',
                            allowPointSelect: true,
                            keys: ['name', 'y', 'selected', 'sliced'],
                            data: JSON.parse(data),
                            showInLegend: true
                        }]
                    });
                },
                error: function(err1, err2, err3) {
                    alert("Une erreur s'est produite lors du dressage du graph !");
                }
            })
        } else {
            alert('Veuillez introduire les options demandées !');
        }
    })

    // Récupération de la liste des population non désservie
    $.ajax({
        url: 'php/popul_assoifee.php',
        type: 'POST',
        success: function(data) {
            if (data != 'No') {
                $('#populations').html(data);
            }
        },
        error: function(err1, err2, err3) {
            console.log("Une erreur s'est produite lors de la récupération de la liste des communes !");
        }
    })

    // Recherche des points d'eau les plus proche aux populations
    $('#search_pts_pop').click(function(evt) {
        if ($('#distance').val() !== "" && $('#populations').val() !== "") {
            $.ajax({
                url: 'php/pts_eau_proche.php',
                type: 'POST',
                data: {
                    'distance': $('#distance').val(),
                    'population': $('#populations').val()
                },
                success: function(data) {
                    pts_eau.clearLayers();
                    buffer.clearLayers();
                    pop_assoi.clearLayers();
                    data = JSON.parse(data);
                    // Affichage de la population
                    var pop_geom = JSON.parse(data[0]['pop_geom']);
                    var marker_pop = L.marker(pop_geom['coordinates'].reverse(), {
                        icon: L.BeautifyIcon.icon({icon: 'home', iconShape: 'circle', borderColor: 'red', textColor: 'red'})
                    }).bindPopup(prepare_popup(data[0]));
                    pop_assoi.addLayer(marker_pop);
                    // Affiche le rayon
                    var rayon_geom = L.circle(pop_geom['coordinates'], parseFloat($('#distance').val()));
                    buffer.addLayer(rayon_geom);
                    if (data.length != 1) {
                        // Le pt le plus proche
                        var dist = data[1]['distance'];
                        var counter = 1;
                        for (var i = 2; i < data.length; i++) {
                            if (parseFloat(data[i]['distance']) < dist) {
                                dist = data[i]['distance'];
                                counter = i;
                            } 
                        }
                        // Afficher les points d'eau
                        for (var i = 1; i < data.length; i++) {
                            if (i == counter) {
                                var options = {icon: 'tint', iconShape: 'marker', borderColor: 'green', textColor: 'green'}
                            } else {
                                var options = {icon: 'tint', iconShape: 'marker', borderColor: '#00ABDC', textColor: '#00ABDC'}
                            }
                            var pop_geom = JSON.parse(data[i]['pts_eau_geom']);
                            var marker_pop = L.marker(pop_geom['coordinates'].reverse(), {
                                icon: L.BeautifyIcon.icon(options)
                            }).bindPopup(prepare_popup(data[i]));
                            if (i == counter) {
                                marker_pop.bindTooltip("Le point d'eau le plus proche");
                            }
                            pop_assoi.addLayer(marker_pop);
                        }
                    }
                    
                    map.fitBounds(buffer.getBounds());
                },
                error: function(err1, err2, err3) {
                    alert("Une erreur s'est produite !");
                }
            })
        } else {
            alert('Veuillez introduire les options demandées !');
        }
    })

    // Legende
    const legend = L.control.Legend({
        position: "bottomright",
        collapsed: false,
        symbolWidth: 24,
        opacity: 0.7,
        column: 1,
        legends: [{
            label: " Points d'eau",
            type: "image",
            url: "assets/images/pts_eau.png",
        },
        {
            label: " Population non desservie",
            type: "image",
            url: "assets/images/pop_assoifee.png",
        },
        {
            label: " Points d’eau le plus proche",
            type: "image",
            url: "assets/images/pts_eau_proche.png",
        },
        {
            label: " Limite des communes",
            type: "image",
            url: "assets/images/commune.png",
        },
        {
            label: " Réseau d'eau potable",
            type: "image",
            url: "assets/images/reseau.png",
        },
        {
            label: " Commune sélectionnée",
            type: "image",
            url: "assets/images/commune_select.png",
        },
]
    }).addTo(map);
    document.getElementsByClassName('leaflet-legend-title')[0].innerHTML = "";
})

function prepare_popup(data) {
    const fields = ['nom', 'salinite', 'vocation', 'debit', 'remarques', 'propietaire', 'nom_projet', 'nom_dou', 'nb_fam', 'source_act']
    var html = "<table class='table'><tr><th colspan='2'>Information</th></tr>";
    if ('type' in data) {
        html += "<tr><td style='font-weight: bold;'>type</td><td>" + data['type'] + "</td></tr>";
    }
    for (var key in data) {
        if (fields.indexOf(key) !== -1) {
            html += "<tr><td style='font-weight: bold;'>" + key + "</td><td>" + data[key] + "</td></tr>";
        }
    }
    html += "</table>";
    return html;
}