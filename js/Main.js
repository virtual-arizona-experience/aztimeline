L.TileLayer.WMS.Filtered = L.TileLayer.WMS.extend({
	initialize: function(serviceUrl, options) {
		options = options || {};		
		if (options.filter && options.filter instanceof DateFilter) {
			filters = [];
			for (var i = 0; i < options.layers.split(",").length; i++) {
				filters.push(options.filter.cql);
			}
			options.cql_filter = filters.join(";");
			delete options.filter;
		}
		
		L.TileLayer.WMS.prototype.initialize.call(this, serviceUrl, options);
	}
});

function init(){
	var bounds = new L.LatLngBounds(new L.LatLng(21.4531, -128.6279), new L.LatLng(43.7076, -95.9326));
	var map = new L.Map("map", {minZoom: 7, maxZoom: 10, maxBounds: bounds});
	
	/* Tilestream Layer example: */
	var baseLayer = new L.TileLayer("http://opengis.azexperience.org/tiles/v2/timeline-base/{z}/{x}/{y}.png", {maxZoom: 10}); 
	
	map.wmsUrl = "http://opengis.azexperience.org/geoserver/wms";
	layers = [ 'vae:states', 'vae:aznationalparks', 'vae:azcounties', 'vae:azcapitols', 'vae:azhistoricline', 'vae:states' ];
	styles = [ 'states', 'aznationalparks', 'azcounties', 'azcapitols', 'azhistoriclines', 'arizona' ];
	map.wmsOptions = { layers: layers.join(','), styles: styles.join(','), format: "image/png", transparent: true };
	
	map.wfsUrl = 'http://opengis.azexperience.org/geoserver/wfs';
	
	map.wfsCentennial = 'vae:azhistoriccentennial';
	map.wfsCentennialOptions = {
		pointToLayer: function(latlng) { return new L.Marker(latlng, { icon: new L.Icon({ iconUrl: "style/images/azflag.png", iconSize: new L.Point(25, 25), }) }); },
		popupObj: new JadeContent("templates/azhistoriccentennial.jade"),
		popupOptions: { maxWidth: 300, centered: true },
		hoverFld: "name"
	};
	
	///County seats label wfs layer 
	map.wfsCountylabel = 'vae:azcountylabels';
	map.wfsCountylabelOptions = {
		pointToLayer: function(latlng) { return new L.Marker(latlng, { icon: new L.Icon({ iconUrl: "", iconSize: new L.Point(70, 15), }) }); },
		popupObj: new JadeContent("templates/azhistoriccentennial.jade"),
		popupOptions: { maxWidth: 300, centered: true }
		//hoverFld: "name"
	};	
	///
	
	setupTimeSlider(map);
	
	var center = new L.LatLng(34.1618, -111.53332);
	map.setView(center, 7).addLayer(baseLayer);
}

function setupTimeSlider(map) {
	var startDate = new Date(1774, 12, 31, 00, 00, 00, 00);
	$("#time-slider").slider({
		range: 'min',
		min: 1775,
		max: 2012,
		step: 5,
		stop: function(event, ui) {
			endDate = new Date(ui.value, 01, 01, 00, 00, 00, 00);
			theFilter = new DateFilter("timedate", startDate, endDate);
			
			//$('.year-indicator').addClass('current-year');
			
			if (map.wmsLayer) { map.removeLayer(map.wmsLayer); }
			if (map.wfsCentennialLayer) { map.removeLayer(map.wfsCentennialLayer); }
			if (map.wfsCountylabelLayer) { map.removeLayer(map.wfsCountylabelLayer); }
			
			map.wmsLayer = wmsLayer = new L.TileLayer.WMS.Filtered(map.wmsUrl, L.Util.extend(map.wmsOptions, { filter: theFilter }));
			map.wfsCentennialLayer = wfsCentennialLayer = new L.GeoJSON.WFS(map.wfsUrl, map.wfsCentennial, L.Util.extend(map.wfsCentennialOptions, { filter: theFilter }));
			
			///Add county seats wfs layer
			map.wfsCountylabelLayer = wfsCountylabelLayer = new L.GeoJSON.WFS(map.wfsUrl, map.wfsCountylabel, L.Util.extend(map.wfsCountylabelOptions, { filter: theFilter }));
			map.addLayer(wmsLayer).addLayer(wfsCountylabelLayer).addLayer(wfsCentennialLayer);
		},
		slide: function(event, ui) {
			$('.year-indicator').remove();
			$('a.ui-slider-handle').append("<div class='year-indicator'>" + ui.value + "</div>");					
		}
	});
	
	$('a.ui-slider-handle').append("<div class='year-indicator'>1775</div>");
}