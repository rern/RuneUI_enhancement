<script src="<?=$this->asset( '/js/vendor/jquery-2.1.0.min.js' )?>"></script>
	<?php 
	if ( empty( $this->uri(1) ) ) { ?>
<script src="<?=$this->asset( '/js/vendor/jquery.mobile.custom.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/pushstream.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/bootstrap.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/Sortable.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/openwebapp.js' )?>"></script>
<script src="<?=$this->asset( '/js/addonsinfo.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/roundslider.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/lazyload.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/pica.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancefunction.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhance.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancecontext.js' )?>"></script>
		<?php
		if ( strpos( 'mobi', $_SERVER['HTTP_USER_AGENT'] ) === false ) { ?> 
<script src="<?=$this->asset( '/js/enhanceshortcut.js' )?>"></script>
		<?php
		}
		if ( file_exists( '/srv/http/assets/js/addonsmenu.js' ) ) { ?> 
<script src="<?=$this->asset( '/js/addonsmenu.js' )?>"></script>
		<?php
		}
		if ( file_exists( '/srv/http/assets/js/gpio.js' ) ) { ?> 
<script src="<?=$this->asset( '/js/gpio.js' )?>"></script>
		<?php 
		}
		if ( file_exists( '/srv/http/assets/js/lyrics.js' ) ) { ?> 
<script src="<?=$this->asset( '/js/lyrics.js' )?>"></script>
		<?php
		}
	} else {
		if ( $this->uri(1) === 'sources' || $this->uri(1) === 'network' ) { ?>
<script src="<?=$this->asset( '/js/vendor/pushstream.min.js' )?>"></script>
		<?php 
		} else if ( $this->uri(1) === 'debug' ) { ?>
<script src="<?=$this->asset('/js/vendor/ZeroClipboard.min.js' )?>"></script>
		<?php 
		} ?>
<script src="<?=$this->asset( '/js/vendor/bootstrap.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/bootstrap-select.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/parsley.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancesettings.js' )?>"></script>
	<?php 
	} ?>
	
<div id="infoNotify">
	<div id="infoNotifyTitle"></div>
	<div id="infoNotifyMessage"></div>
</div>
<script>
function notify( title, message, icon, delay ) {
	var titlehtml = '<i class="fa fa-'+ ( icon || 'check' ) +'"></i> '+ ( title || 'Info' );
	$( '#infoNotifyTitle' ).html( titlehtml );
	$( '#infoNotifyMessage' ).html( message );
	$( '#infoNotify' ).show();
	setTimeout( function() {
		$( '#infoNotify' ).hide();
	}, delay || 3000 );
}
</script>
