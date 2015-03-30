$(function() {
    markerIndex = 0;

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


    var draw = SVG('svgMapOverlay').size($('#svgMapOverlay').width(),$('#svgMapOverlay').height());

    $("#btnTrace").click(function(){
        map.removeAllMarkers();
        //$("#svgMapOverlay").empty();
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
                            console.log((data[i].traceroute[j+1].geodata.latitude));
                            if ((data[i].traceroute[j+1].geodata.latitude == 'undefined')){
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






