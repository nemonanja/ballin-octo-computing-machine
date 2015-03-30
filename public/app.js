$(function() {
    markerIndex = 0;

    $('#world-map').vectorMap({
        markers:[]
    });
    var map = $('#world-map').vectorMap('get', 'mapObject');

    $("#btnTrace").click(function(){
        var ip = document.getElementById("urlip").value;
         $.ajax({
            url: '/removekebabnemo',
            type: 'post',
            dataType: 'json',
            data: {ip:ip},
            success: function (data) {
                console.log(data);
                for(var i=0; i<data.length; i++) {
                    for(var j=0; j<data[i].traceroute.length; j++) {
                        if(data[i].traceroute[j].geodata.latitude && data[i].traceroute[j].geodata.longitude) {
                            console.log(data[i].traceroute[j].geodata);
                            markerIndex +=1;
                            map.addMarker(markerIndex, [data[i].traceroute[j].geodata.latitude, data[i].traceroute[j].geodata.longitude]);
                        }
                    }
                }
            }
        });

    });

});

/*
    var nodeArray = [{coords: [60, 60], name: 'test2'},{coords: [0, 0], name: 'test3'},{coords: [30, 30], name: 'test4'},{coords: [15, 15], name: 'test5'}];

    
    for (i=0; i<nodeArray.length; i++){
        map.addMarker(markerIndex, nodeArray[i]['coords']);
        console.log(nodeArray[i]['coords']);
        console.log(markerIndex);
        markerIndex +=1;
    }



$(function(){
    $('#world-map').vectorMap({
        markers:[{latLng: [41.90, 12.45], name: 'Vatican City'}]
    });

    var map = $('#world-map').vectorMap('get', 'mapObject');

    map.addMarker("1", [{ latLng: [41.90, 23.45], name: 'Test' }], []);
    map.addMarker("2", [{ latLng: [41.90, 33.45], name: 'Test' }], []);
    map.addMarker("3", [{ latLng: [41.90, 27.45], name: 'Test' }], []);
    map.addMarker("4", [{ latLng: [41.90, 13.45], name: 'Test' }], []);

});*/
