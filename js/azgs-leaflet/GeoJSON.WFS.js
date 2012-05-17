L.GeoJSON.WFS = L.GeoJSON.extend({
	initialize: function(serviceUrl, featureType, options) {
		options = options || {};
		L.GeoJSON.prototype.initialize.call(this, null, options);
		
		var wfsVersion = options.wfsVersion || "1.0.0";
		this.getFeatureUrl = serviceUrl + "?request=GetFeature&outputformat=json&version=" + wfsVersion + "&typeName=" + featureType;
		if (options.filter && options.filter instanceof DateFilter) { this.getFeatureUrl += "&CQL_FILTER=" + options.filter.cql; }
		
		this.on("featureparse", function(e) {
			
			///Parse the icon url
			if(e.layer.hasOwnProperty("options")){
				var iconUrl = e.layer.options.icon.options.iconUrl;
				if(iconUrl.split("?").length == 3) { ///If the the iconUrl contains two parameters (with '?')
					var iconBaseUrl = iconUrl.split("?")[0];
					var imgName = e.properties[iconUrl.split("?")[1]].replace(/\s/g, "") + "." + iconUrl.split("?")[2];
					e.layer.options.icon.options.iconUrl = iconBaseUrl + imgName;	
				}
		
			}			

			
			if (e.geometryType != 'Point' && e.geometryType != 'MultiPoint') {
				if (options.style) {
					e.layer._originalStyle = options.style;
					e.layer.setStyle(options.style); ///Set the style for non-point symbols
				} else if (options.filteredStyles) {
					var fld = options.filteredStyles.propName;
					var itemVal = e.properties[fld];
					var style = L.Util.extend({}, options.filteredStyles['default'], options.filteredStyles.styles[itemVal]); 
					e.layer._originalStyle = style;
					e.layer.setStyle(style);
				}
			}
			
			///Set the z-index offset value for the point feature
			if (options.hasOwnProperty("zIndexOffset")){
				e.layer.setZIndexOffset(options.zIndexOffset);
			}
			///
			
			if (options.popupObj && options.popupOptions) {
				e.layer.on("click", function(evt) {
					e.layer._map.openPopup(options.popupObj.generatePopup(e, options.popupOptions));
					if (options.popupFn) { options.popupFn(e); }
				});			
			}
			else if (options.popupFld && e.properties.hasOwnProperty(options.popupFld)) {
				e.layer.bindPopup(e.properties[options.popupFld], { maxWidth: 600 });
			}
			if (options.hoverObj || options.hoverFld) {
				e.layer.on("mouseover", function(evt) {
					hoverContent = options.hoverObj ? options.hoverObj.generateContent(e) : e.properties[options.hoverFld] || "Invalid field name" ;
					
					///
					if(evt.target.hasOwnProperty("_latlng")){ ///For point
						hoverPoint = e.layer._map.latLngToContainerPoint(evt.target._latlng);
					}else if(evt.hasOwnProperty("latlng")){ ///For line
						hoverPoint = e.layer._map.latLngToContainerPoint(evt.latlng);
					}
					
					e.layer._hoverControl = new L.Control.Hover(hoverPoint, hoverContent);
					e.layer._map.addControl(e.layer._hoverControl);	
				});
				e.layer.on("mouseout", function(evt) {
					e.layer._map.removeControl(e.layer._hoverControl);
				});
			}
			if (options.hoverColor) {
				e.layer.on("mouseover", function(evt) {
					var hoverStyle = L.Util.extend({}, e.layer._originalStyle, { stroke: true, color: options.hoverColor, weight: 3 });
					e.layer.setStyle(hoverStyle);
				});
				e.layer.on("mouseout", function(evt) {
					e.layer.setStyle(e.layer._originalStyle);
				});
			}
			if (e.layer instanceof L.Marker.AttributeFilter) { e.layer.setIcon(e); }
		});
	},
	
	onAdd: function(map) {
		L.LayerGroup.prototype.onAdd.call(this, map);
		var that = this;
		this.getFeature(function() {
			that.addGeoJSON(that.jsonData);
		});
	},
	
	getFeature: function(callback) {
		var that = this;
		$.ajax({
			url: this.getFeatureUrl,
			type: "GET",
			success: function(response) {
				if (response.type && response.type == "FeatureCollection") {
					that.jsonData = response;
	
					callback();
				}				
			},
			dataType: "json"
		});
	}
	

});