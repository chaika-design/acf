(function($){
	
	/*
	*  Location
	*
	*  static model for this field
	*
	*  @type	event
	*  @date	1/06/13
	*
	*/
	
	acf.fields.location = {
		
		$el : null,
		$input : null,
		
		o : {},
		
		geocoder : false,
		map : false,
		maps : {},
		
		set : function( o ){
			
			// merge in new option
			$.extend( this, o );
			
			
			// find input
			this.$input = this.$el.find('.value');
			
			
			// get options
			this.o = acf.helpers.get_atts( this.$el );
			
			
			// get map
			if( this.maps[ this.o.id ] )
			{
				this.map = this.maps[ this.o.id ];
			}
			
			
			// geocode
			this.geocoder = new google.maps.Geocoder();
			
				
			// return this for chaining
			return this;
			
		},
		init : function(){

			// is clone field?
			if( acf.helpers.is_clone_field(this.$input) )
			{
				return;
			}
			
			this.render();
					
		},
		render : function(){
			
			// reference
			var _this	= this,
				_$el	= this.$el;
			
			
			// vars
			var args = {
        		zoom		: 14,
        		center		: new google.maps.LatLng(this.o.lat, this.o.lng),
        		mapTypeId	: google.maps.MapTypeId.ROADMAP
        	};
			
			// create map	        	
        	this.map = new google.maps.Map( this.$el.find('.canvas')[0], args);
	        	
	        
	        // add array for markers
	        this.map.marker = null;
	        
	        
	        // add search
			var autocomplete = new google.maps.places.Autocomplete( this.$el.find('.search')[0] );
			autocomplete.bindTo('bounds', this.map);
			
			
			// add dummy marker
	        this.map.marker = new google.maps.Marker({
		        draggable	: true,
		        raiseOnDrag	: true,
		        map			: this.map,
		    });
		    
		    
		    // value exists?
		    var lat = this.$el.find('.input-lat').val(),
		    	lng = this.$el.find('.input-lng').val();
		    	
		    if( lat && lng )
		    {
			    _this.update( lat, lng ).center();
		    }
		    
		    
			// events
			google.maps.event.addListener(autocomplete, 'place_changed', function( e ) {
			    
			    // manually update address
			    var address = _this.$el.find('.search').val();
			    
			    _this.$el.find('.input-address').val( address );
			    _this.$el.find('.title h4').text( address );
			    
			    
			    // vars
			    var place = this.getPlace();
			    
			    
			    // validate
			    if( place.geometry )
			    {
			    	var lat = place.geometry.location.lat(),
						lng = place.geometry.location.lng();
						
						
				    _this.set({ $el : _$el }).update( lat, lng ).center();
			    }
			    else
			    {
				    // client hit enter, manulaly get the place
				    _this.geocoder.geocode({ 'address' : address }, function( results, status ){
				    	
				    	// validate
						if( status != google.maps.GeocoderStatus.OK )
						{
							console.log('Geocoder failed due to: ' + status);
							return;
						}
						
						if( !results[0] )
						{
							console.log('No results found');
							return;
						}
						
						
						// get place
						place = results[0];
						
						var lat = place.geometry.location.lat(),
							lng = place.geometry.location.lng();
							
							
					    _this.set({ $el : _$el }).update( lat, lng ).center();
					    
					});
			    }
			    
			});
		    
		    
		    google.maps.event.addListener( this.map.marker, 'dragend', function(){
		    	
		    	// vars
				var position = this.map.marker.getPosition(),
					lat = position.lat(),
			    	lng = position.lng();
			    	
				_this.set({ $el : _$el }).update( lat, lng ).sync();
			    
			});
			
			
			google.maps.event.addListener( this.map, 'click', function( e ) {
				
				// vars
				var lat = e.latLng.lat(),
					lng = e.latLng.lng();
				
				
				_this.set({ $el : _$el }).update( lat, lng ).sync();
			
			});

			
			
	        // add to maps
	        this.maps[ this.o.id ] = this.map;
	        
	        
		},
		
		update : function( lat, lng ){
			
			// vars
			var latlng = new google.maps.LatLng( lat, lng );
		    
		    
		    // update inputs
			this.$el.find('.input-lat').val( lat );
			this.$el.find('.input-lng').val( lng ).trigger('change');
			
			
		    // update marker
		    this.map.marker.setPosition( latlng );
		    
		    
			// show marker
			this.map.marker.setVisible( true );
		    
		    
	        // update class
	        this.$el.addClass('active');
	        
	        
	        // validation
			this.$el.closest('.field').removeClass('error');
			
			
	        // return for chaining
	        return this;
		},
		
		center : function(){
			
			// vars
			var position = this.map.marker.getPosition(),
				latlng = new google.maps.LatLng( position.lat(), position.lng() );
				
			
			// set center of map
	        this.map.setCenter( latlng );
		},
		
		sync : function(){
			
			// reference
			var _this	= this;
				
			
			// vars
			var position = this.map.marker.getPosition(),
				latlng = new google.maps.LatLng( position.lat(), position.lng() );
			
			
			this.geocoder.geocode({ 'latLng' : latlng }, function( results, status ){
				
				// validate
				if( status != google.maps.GeocoderStatus.OK )
				{
					console.log('Geocoder failed due to: ' + status);
					return;
				}
				
				if( !results[0] )
				{
					console.log('No results found');
					return;
				}
				
				
				// get location
				var location = results[0];
				
				
				// update h4
				_this.$el.find('.title h4').text( location.formatted_address );

				
				// update input
				_this.$el.find('.input-address').val( location.formatted_address ).trigger('change');
				
			});
			
			
			// return for chaining
	        return this;
		},
		
		locate : function(){
			
			// reference
			var _this	= this;
			
			
			// Try HTML5 geolocation
			if( ! navigator.geolocation )
			{
				alert( acf.l10n.google_map.browser_support );
				return this;
			}
			
			
			// show loading text
			_this.$el.find('.title h4').text(acf.l10n.google_map.locating + '...');
			_this.$el.addClass('active');
			
		    navigator.geolocation.getCurrentPosition(function(position){
		    	
		    	// vars
				var lat = position.coords.latitude,
			    	lng = position.coords.longitude;
			    	
				_this.update( lat, lng ).sync().center();
				
			});

				
		},
		
		clear : function(){
			
			// update class
	        this.$el.removeClass('active');
			
			
			// clear search
			this.$el.find('.search').val('');
			
			
			// clear inputs
			this.$el.find('.input-address').val('');
			this.$el.find('.input-lat').val('');
			this.$el.find('.input-lng').val('');
			
			
			// hide marker
			this.map.marker.setVisible( false );
		},
		
		edit : function(){
			
			// update class
	        this.$el.removeClass('active');
			
			
			// clear search
			var val = this.$el.find('.title h4').text();
			
			
			this.$el.find('.search').val( val ).focus();
			
		}
	
	};
	
	
	/*
	*  acf/setup_fields
	*
	*  run init function on all elements for this field
	*
	*  @type	event
	*  @date	20/07/13
	*
	*  @param	{object}	e		event object
	*  @param	{object}	el		DOM object which may contain new ACF elements
	*  @return	N/A
	*/
	
	$(document).on('acf/setup_fields', function(e, el){
		
		$(el).find('.acf-google-map').each(function(){
			
			acf.fields.location.set({ $el : $(this) }).init();
			
		});
		
	});
	
	
	/*
	*  Events
	*
	*  jQuery events for this field
	*
	*  @type	function
	*  @date	1/03/2011
	*
	*  @param	N/A
	*  @return	N/A
	*/
	
	$(document).on('click', '.acf-google-map .acf-sprite-remove', function( e ){
		
		e.preventDefault();
		
		acf.fields.location.set({ $el : $(this).closest('.acf-google-map') }).clear();
		
		$(this).blur();
		
	});
	
	
	$(document).on('click', '.acf-google-map .acf-sprite-locate', function( e ){
		
		e.preventDefault();
		
		acf.fields.location.set({ $el : $(this).closest('.acf-google-map') }).locate();
		
		$(this).blur();
		
	});
	
	$(document).on('click', '.acf-google-map .title h4', function( e ){
		
		e.preventDefault();
		
		acf.fields.location.set({ $el : $(this).closest('.acf-google-map') }).edit();
			
	});
	
	$(document).on('keydown', '.acf-google-map .search', function( e ){
		
		// prevent form from submitting
		if( e.which == 13 )
		{
		    return false;
		}
			
	});
	
	$(document).on('blur', '.acf-google-map .search', function( e ){
		
		// vars
		var $el = $(this).closest('.acf-google-map');
		
		
		// has a value?
		if( $el.find('.input-lat').val() )
		{
			$el.addClass('active');
		}
			
	});
	

})(jQuery);