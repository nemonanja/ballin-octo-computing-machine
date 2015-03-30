$(function() {
    markerIndex = 0;

    /*var markerArray = [
        {name:'Houston', latLng:[29.761993,-95.369568]},
        {name:'New York', latLng:[40.710833,-74.002533]},
        {name:'Kansas City', latLng:[39.115145,-94.633484]}
    ];*/

    $('#world-map').vectorMap({
        markers: []
    });
    var map = $('#world-map').vectorMap('get', 'mapObject');

    //Get width and height of the map
    var width = document.getElementById('world-map').offsetWidth;
    var height = document.getElementById('world-map').offsetHeight;
    //Set width and height of SVGOverlay to match the map
    $('#svgMapOverlay').width(width);
    $('#svgMapOverlay').height(height);

    /*console.log(width);
    console.log(height);
    console.log($('#svgMapOverlay').width());
    console.log($('#svgMapOverlay').height());*/

    var draw = SVG('svgMapOverlay').size($('#svgMapOverlay').width(),$('#svgMapOverlay').height());
    //var coords1 = map.latLngToPoint(markerArray[0].latLng[0],markerArray[0].latLng[1]);
    //var coords2 = map.latLngToPoint(markerArray[1].latLng[0],markerArray[1].latLng[1]);
    /*console.log(coords1);
    draw
        .path()
        .attr({ fill: 'none',stroke: '#c00', 'stroke-width': 2 })
        .M(coords1.x, coords1.y)
        .L(coords2.x, coords2.y);*/

    $("#btnTrace").click(function(){
        var ip = document.getElementById("urlip").value;
         $.ajax({
            url: '/gettraceroute',
            type: 'post',
            dataType: 'json',
            data: {ip:ip},
            success: function (data) {
                console.log(data);
                for(var i=0; i<data.length; i++) {
                    for(var j=0; j<data[i].traceroute.length; j++) {
                        if(data[i].traceroute[j].geodata.latitude && data[i].traceroute[j].geodata.longitude) {
                            //Check when tracerout ends
                            if (map.latLngToPoint(data[i].traceroute[j+1].geodata.latitude == null)){
                                break;
                            }
                            //console.log(data[i].traceroute[j].geodata);
                            markerIndex +=1;
                            map.addMarker(markerIndex, [data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude]);
                            var coords1 = map.latLngToPoint(data[i].traceroute[j].geodata.latitude,data[i].traceroute[j].geodata.longitude);
                            var coords2 = map.latLngToPoint(data[i].traceroute[j+1].geodata.latitude,data[i].traceroute[j+1].geodata.longitude);
                            draw
                                .path()
                                .attr({ fill: 'none',stroke: '#f213c7', 'stroke-width': 2 })
                                .M(coords1.x, coords1.y)
                                .L(coords2.x, coords2.y);

                        }
                    }
                }
            }
        });

    });

});






