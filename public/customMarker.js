 function CustomMarker(latlng, map, type, color ) {
   this.latlng_ = latlng;
   this.type_ = type;

   // Once the LatLng and text are set, add the overlay to the map.  This will
   // trigger a call to panes_changed which should in turn call draw.
   this.setMap(map);
 }

 CustomMarker.prototype = new google.maps.OverlayView();

 CustomMarker.prototype.draw = function() {
   var me = this;

   // Check if the div has been created.
   var div = this.div_;
   if (!div) {
     // Create a overlay text DIV
     div = this.div_ = document.createElement('DIV');
     // Create the DIV representing our CustomMarker
     div.style.position = 'absolute';
     div.style.cursor = 'pointer';
     div.style.marginLeft = '-8px';
     div.style.marginTop = '-8px';

     if(this.type_=='node') {
       div.innerHTML = '<div class="pulse_holder"><div class="pulse_marker"><div class="pulse_rays"></div></div></div>';
     } else if (this.type_=='marker') {
       div.innerHTML = '<div class="hop_holder"><div class="hop_marker"></div></div>';
     }

     google.maps.event.addDomListener(div, "click", function(event) {
       google.maps.event.trigger(me, "click");
     });

     // Then add the overlay to the DOM
     var panes = this.getPanes();
     panes.overlayImage.appendChild(div);
   }

   // Position the overlay 
   var point = this.getProjection().fromLatLngToDivPixel(this.latlng_);
   if (point) {
     div.style.left = point.x + 'px';
     div.style.top = point.y + 'px';
   }
 };

 CustomMarker.prototype.remove = function() {
   // Check if the overlay was on the map and needs to be removed.
   if (this.div_) {
     this.div_.parentNode.removeChild(this.div_);
     this.div_ = null;
   }
 };

 CustomMarker.prototype.getPosition = function() {
  return this.latlng_;
 };