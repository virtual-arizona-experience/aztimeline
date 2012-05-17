var jade = require("jade");

JadeContent = L.Class.extend({
	options: {
		maxWidth: 600
	},
	
	initialize: function(templateUrl, options) {
		L.Util.setOptions(this, options || {});
		
		var that = this;
		$.ajax({
			url: templateUrl,
			async: false,
			success: function(result) { 
				that.jadeFn = jade.compile(result); 
			}
		});
	},
	
	generateContent: function(feature) {
		///Caclulate the height of the image
		if(feature.properties.mediawidth && feature.properties.mediaheight){
			var imgheight = 300 / feature.properties.mediawidth * feature.properties.mediaheight;
			imgheight += "px";
		}else{
			var imgheight = "auto";
		}		
		
		return this.jadeFn(L.Util.extend(feature.properties, {imgheight: imgheight}));
	},
	
	generatePopup: function(feature, options) {
		if (options.centered) { popup = new L.Popup.Centered(options); }
		else { popup = new L.Popup(options); }
		
		popup.setLatLng(feature.layer._latlng);
		popup.setContent(this.generateContent(feature));
		return popup;
	}
});