$( document ).ready( function() {


/**
 * Hide and Save
 * functionality for letting a button hide another div or such 
 * also functionality for saving that value in the DB :)
*/

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