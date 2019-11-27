$( document ).ready( function() {

	var

	dataSaveValue = function() {
		document.getElementById('blur-hack').focus();
		var $target = $( event.target ),
			id = $target.attr( "id" ),
			value = $target.val();

		if( id == undefined ) {
			console.error( 'This element is missing "id", can not save!', $target );
			return;
		}

		key = "TROFF_SAVE_VALUE_" + id;

		var o = {};
		o[ key ] = value;
		chrome.storage.local.set( o );
	}


	jQueryToggle = function( idString ){
		if( $(idString).hasClass("hidden") ) {
			$(idString).removeClass("hidden");
		} else {
			$(idString).addClass("hidden");
		}
	};


/**
 * Hide and Save
 * functionality for letting a button hide another div or such 
 * also functionality for saving that value in the DB :)
*/

$( "[data-st-css-selector-to-toggle]" ).on( "click", function( event ) {
	jQueryToggle( $( event.target ).data( "st-css-selector-to-toggle" ) );
} );

$("[data-st-save-current-value]").change( dataSaveValue );

$( "[data-st-save-current-value]" ).each( function( i, element ){
	var $target = $( element ),
		key = "TROFF_SAVE_VALUE_" + $target.attr( "id" );

		chrome.storage.local.get( key, function( ret ) {
			var value = ret[key];

			if( value === undefined ) {
				value = $target.data( "st-save-current-value" );
			}

			$target.val( value );
		});

});

$( ".st-simple-on-off-button" ).each( function( i, v ) {
	var $v = $(v),
		cssSelectorToHide = $v.data( "st-css-selector-to-hide" );
	if( $v.data( "st-save-value-key" ) ) {
		var key = $v.data( "st-save-value-key" );
		chrome.storage.local.get( key, function( item ) {
			var savedValue = item[ key ];

			if( savedValue === undefined ) {
				if( $v.hasClass( "active" ) ) {
					$( cssSelectorToHide ).removeClass( "hidden" );
				} else {
					$( cssSelectorToHide ).addClass( "hidden" );
				}
			} else if( savedValue ) {
				$v.addClass( "active" );
				$( cssSelectorToHide ).removeClass( "hidden" );
			} else {
				$v.removeClass( "active" );
				$( cssSelectorToHide ).addClass( "hidden" );
			}
		} );
	} else {
		if( $v.hasClass( "active" ) ) {
			$( cssSelectorToHide ).removeClass( "hidden" );
		} else {
			$( cssSelectorToHide ).addClass( "hidden" );
		}
	}

} );

$( ".st-simple-on-off-button" ).click( function( event ) {
	var $target = $( event.target ),
		cssSelectorToHide = $target.data( "st-css-selector-to-hide" ),
		setActive = !$target.hasClass( "active" );

	
	if( setActive ) {
		$target.addClass( "active" );
	} else {
		$target.removeClass( "active" );
	}

	if( cssSelectorToHide ) {
		if( setActive ) {
			$( cssSelectorToHide ).removeClass( "hidden" );
		} else {
			$( cssSelectorToHide ).addClass( "hidden" );
		}
	}
	if( $target.data( "st-save-value-key" ) ) {
		var o = {};
		o[ $target.data( "st-save-value-key" ) ] = setActive;
		chrome.storage.local.set( o );
	}
} );

/* Hide and Save end */




} ); // end document ready