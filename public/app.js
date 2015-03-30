$(function() {
    markerIndex = 0;
    markerIndex2 = 0;
    var colors =
                [
                    '#7fffd4',
                    '#ff4040',
                    '#98f5ff',
                    '#ff7f24',
                    '#ffb90f',
                    '#bf3eff',
                    '#ff1493',
                    '#ffa07a'
                ];

    var nodeData = [];

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
    $.get("/getnodes", function(data) {
        nodeData = data;
        console.log(data);
        for(var i=0; i<data.length; i++) {
            markerIndex +=1;
            map.addMarker(markerIndex, [data[i].geodata.latitude, data[i].geodata.longitude]);
        }

    });


    $("#btnTrace").click(function(){
        map.removeAllMarkers();

        for(var i=0; i<nodeData.length; i++) {
            markerIndex +=1;
            map.addMarker(markerIndex, [nodeData[i].geodata.latitude, nodeData[i].geodata.longitude]);
        }

        var ip = document.getElementById("urlip").value;
         $.ajax({
            url: '/gettraceroute',
            type: 'post',
            dataType: 'json',
            data: {ip:ip},
            success: function (data) {
                console.log(data);
                for(var i=0; i<data.length; i++) {
                    var color = '';
                    for (var x= 0; x<nodeData.length; x++)
                    {
                        console.log(nodeData[x].ip, data[i].ip);
                        if (nodeData[x].ip == data[i].ip) {
                            color = colors[x];
                            var startCoords = map.latLngToPoint(nodeData[x].geodata.latitude, nodeData[x].geodata.longitude);
                            var secondCoord = map.latLngToPoint(data[i].traceroute[0].geodata.latitude, data[i].traceroute[0].geodata.longitude);
                            console.log(startCoords);
                            console.log(secondCoord);
                            draw
                                .path()
                                .attr({fill: 'none', stroke: color, 'stroke-width': 2})
                                .M(startCoords.x, startCoords.y)
                                .L(secondCoord.x, secondCoord.y);
                            break;
                        }
                    }
                    for(var j=0; j<data[i].traceroute.length; j++) {
                        if(data[i].traceroute[j].geodata.latitude && data[i].traceroute[j].geodata.longitude) {
                            //console.log(data[i].traceroute[j].geodata);
                            markerIndex +=1;
                            map.addMarker(markerIndex, [data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude]);
                            //Check when tracerout ends
                            if (j+1==data[i].traceroute.length) {
                                break;
                            }
                            var coords1 = map.latLngToPoint(data[i].traceroute[j].geodata.latitude,data[i].traceroute[j].geodata.longitude);
                            var coords2 = map.latLngToPoint(data[i].traceroute[j+1].geodata.latitude,data[i].traceroute[j+1].geodata.longitude);
                            draw
                                .path()
                                .attr({ fill: 'none',stroke: color, 'stroke-width': 2 })
                                .M(coords1.x, coords1.y)
                                .L(coords2.x, coords2.y);

                        }
                    }
                }
            }
        });

    });

});






