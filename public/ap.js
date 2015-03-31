$(function() {

    //[{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#425a68"},{"visibility":"on"}]}]
    // init Gmap
    var map;
    var nodeList = [];
    var markers = [];

    function initialize() {
      var mapOptions = {
        maxZoom         : 11,
        minZoom         : 2,
        zoom            : 3,
        center          : new google.maps.LatLng(25, 0),
        styles          : gmapstylesA,
        disableDefaultUI: true
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
          mapOptions);
    }

    google.maps.event.addDomListener(window, 'load', initialize);

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

    
    
    $.get("../getnodes", function(data) {
        nodeData = data;
        console.log(data);
        for(var i=0; i<data.length; i++) {
            $('#nodes').append('<li><h3>Node: ' + data[i].ip + '</h3><ul id="node' + i + '"></ul></li>');
            //map.addMarker(markerIndex, {latLng: [data[i].geodata.latitude, data[i].geodata.longitude], style: {r: 6, fill: colors[i]}, name: 'naem'});

            nodeList.push(new CustomMarker(
                                new google.maps.LatLng(data[i].geodata.latitude, data[i].geodata.longitude),
                                map,
                                'node'
                            ));
        }
        $("#nodebar h3").click(function(){           
            $("#nodebar ul ul").slideUp();        
            if(!$(this).next().is(":visible")) {
              $(this).next().slideDown();
            }
        });        
    });

    $("#btnTrace").click(function(){
        var ip = document.getElementById("urlip").value;
         $.ajax({
            url: '/gettraceroute',
            type: 'post',
            dataType: 'json',
            data: {ip:ip},
            success: function (data) {
                console.log(data);
                var noed = 0;
                for(var i=0; i<data.length; i++) {
                    var color = '';
                    for (var x= 0; x<nodeData.length; x++)
                    {
                        console.log(nodeData[x].ip, data[i].ip);
                        if (nodeData[x].ip == data[i].ip) {
                            color = colors[x];
                            noed = x;                         
                            // draw path
                            break;
                        }
                    }
                    for(var j=0; j<data[i].traceroute.length; j++) {
                        if(data[i].traceroute[j].geodata.latitude && data[i].traceroute[j].geodata.longitude) {
                            //console.log(data[i].traceroute[j].geodata);
                            //map.addMarker(markerIndex, {latLng: [data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude], name: data[i].traceroute[j].point});
                            markers.push(new CustomMarker(
                                new google.maps.LatLng(data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude),
                                map,
                                'hop'
                            ));
                            //Check when tracerout ends
                            if (j+1==data[i].traceroute.length) {
                                break;
                            }
                            //$('#node' + noed).append('<li><a href="#" class="mover" id="' + markerIndex + '">' + data[i].traceroute[j].point + ' : ' + data[i].traceroute[j].time + '</a></li>');
                            // draw path
                        }
                    }
                    $('#node' + noed).append('<li><h4>Ping: ' + data[i].ping + '</h4></li>');
                }
                $('.mover').on('mouseover', function() {
                    console.log('hover');
                });
            }
        });
    });
});






