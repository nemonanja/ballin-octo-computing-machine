map = null;
nodeList = [];
markers = [];
nodeData = [];
tracePaths = [];
colors =
            [
                '#FF0000',
                '#00FF40',
                '#00C0C0',
                '#FF00FF',
                '#FFFF00',
                '#C01080'
            ];
block = false;

var removeHops = function () {
    for (var x = 0; x<tracePaths.length; x++) {
        tracePaths[x].setMap(null);
    }
    for (var x = 0; x<markers.length; x++) {
        markers[x].remove();
    }
}

var loading = function() {
    var over = '<div id="overlay"></div>';
    $(over).appendTo('body');
    $('#loadAnimation').show();
}

var loadDone = function() {
    $('#overlay').remove();
    $('#loadAnimation').hide();
}

var doSearch = function(){
    if(block)
        return
    block=true;
    console.log('asd');
    var ip = document.getElementById("searchInput").value;
    if(ip.length<0) {
        return
    }
    removeHops();
    $('.nodeClass').empty();
    loading()
     $.ajax({
        url: '/gettraceroute',
        type: 'post',
        dataType: 'json',
        data: {ip:ip},
        success: function (data) {
            block=false;
            loadDone();
            console.log(data);
            var noed = 0;
            tracePaths=[];
            for(var i=0; i<data.length; i++) {
                var pathCords = []

                for (var x= 0; x<nodeData.length; x++)
                {
                    console.log(nodeData[x].ip, data[i].ip);
                    if (nodeData[x].ip == data[i].ip) {
                        color = colors[x];
                        noed = x;                         
                        pathCords.push(new google.maps.LatLng(nodeData[x].geodata.latitude, nodeData[x].geodata.longitude));
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
                            'hop',
                            colors[x]
                        ));

                        pathCords.push(new google.maps.LatLng(data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude));
                    }
                    $('#node' + noed).append('<li style="color:'+colors[x]+'"><a href="#" style="color:'+colors[x]+'" class="mover" id="' + data[i].traceroute[j].point + '">' + data[i].traceroute[j].point + ' : ' + data[i].traceroute[j].time + '</a></li>');
                }
                tracePaths.push(new google.maps.Polyline({
                    path: pathCords,
                    geodesic: false,
                    strokeColor: colors[x],
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                }));

                tracePaths[i].setMap(map);

                $('#node' + noed).append('<li><span><b>Ping: ' + data[i].ping + '</b></span></li>');
            }
            $('.mover').on('mouseover', function() {
                console.log('hover');
            });
        }
    });
}

$(function() {
    function initialize() {
      var mapOptions = {
                            maxZoom         : 11,
                            minZoom         : 2,
                            zoom            : 3,
                            center          : new google.maps.LatLng(25, 0),
                            styles          : style,
                            disableDefaultUI: true
                        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        var controlDiv = document.createElement('DIV');
        controlDiv.className = 'box';
        controlDiv.innerHTML = '<div class="container-4"><input autocomplete="off" id="searchInput" placeholder="Enter IP or URL..." onkeypress="keyPressed(event)"/><button id="searchButton" class="icon"><i class="fa fa-search"></i></button></div>';
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    }

    google.maps.event.addDomListener(window, 'load', initialize);

    $.get("../getnodes", function(data) {
        nodeData = data;
        console.log(data);
        for(var i=0; i<data.length; i++) {
            //map.addMarker(markerIndex, {latLng: [data[i].geodata.latitude, data[i].geodata.longitude], style: {r: 6, fill: colors[i]}, name: 'naem'});
            $('#nodes').append('<li style="color:'+colors[i]+'"><h3>Node: ' + data[i].ip + '</h3><ul id="node' + i + '" class="nodeClass"></ul></li>');
            nodeList.push(new CustomMarker(
                                new google.maps.LatLng(data[i].geodata.latitude, data[i].geodata.longitude),
                                map,
                                'node',
                                colors[i]
                            ));
        }
        $("#nodebar h3").click(function(){           
            $("#nodebar ul ul").slideUp();        
            if(!$(this).next().is(":visible")) {
              $(this).next().slideDown();
            }
        });        
    });
});

function hideHop(index) {
    
}

function keyPressed(event) {
    if (event.which == 13) {
        doSearch();
        return false;    //<---- Add this line
    }
}
