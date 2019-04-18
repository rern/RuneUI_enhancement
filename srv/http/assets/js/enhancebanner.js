$( 'body' ).prepend( 
'<div id="banner">\
	<div id="bannerTitle"></div>\
	<div id="bannerMessage"></div>\
</div>'
);
$( '#banner' ).click( bannerHide );
function bannerHide() {
	$( '#banner' ).hide();
	$( '#bannerTitle, #bannerMessage' ).empty();
}
function notify( title, message, icon, delay ) {
	var iconhtml = icon ? '<i class="fa fa-'+ ( icon || 'check' ) +'"></i> ' : '';
	$( '#bannerTitle' ).html( iconhtml + title );
	$( '#bannerMessage' ).html( message );
	$( '#banner' ).show();
	setTimeout( bannerHide, delay || 3000 );
}
