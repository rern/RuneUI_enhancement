$( 'body' ).prepend( 
'<div id="banner">\
	<div id="bannerTitle"></div>\
	<div id="bannerMessage"></div>\
</div>'
);
$( '#banner' ).click( bannerHide );
function bannerHide() {
	$( '#banner' )
		.hide()
		.removeAttr( 'style' );
	$( '#bannerTitle, #bannerMessage' ).empty();
}
function notify( title, message, icon, delay ) {
	var iconhtml = icon ? '<i class="fa fa-'+ ( icon || 'check' ) +' wh"></i>' : '';
	$( '#bannerTitle' ).html( iconhtml + title );
	$( '#bannerMessage' ).html( message );
	var $banner = $( '#banner' );
	$banner.show();
	// keep gradient width at 80px when width varies
	var bW = $banner.outerWidth();
	$banner.css( 'background', 'linear-gradient( to right, rgba( 0,149,216,1 ) 0%,rgba( 0,149,216,1 ) '+ Math.round( ( bW - 80 ) / bW * 100 ) +'%,rgba( 125,185,232,0 ) 100% )' )
	
	setTimeout( bannerHide, delay || 3000 );
}
