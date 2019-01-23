<div id="splash"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>
<div id="loader" class="hide"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>

<script src="<?=$this->asset( '/js/vendor/jquery-2.1.0.min.js' )?>"></script>
<?php 
if ( is_localhost() ) { ?>
<script src="<?=$this->asset( '/js/vendor/jquery.onScreenKeyboard.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/jquery-ui.min.js' )?>"></script>
<?php
}
if ( empty( $this->uri(1) ) ) { ?>
<script src="<?=$this->asset( '/js/vendor/jquery.mobile.custom.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/pushstream.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/bootstrap.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/Sortable.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/pnotify.custom.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/openwebapp.js' )?>"></script>
<script src="<?=$this->asset( '/js/addonsinfo.js' )?>"></script>
<script src="<?=$this->asset( '/js/addonsmenu.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/roundslider.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancefunction.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhance.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancecontext.js' )?>"></script>
<?php
	if ( file_exists( '/srv/http/gpiosettings.php' ) ) { ?> 
<script src="<?=$this->asset( '/js/gpio.js' )?>"></script>
<?php 
	}
	if ( file_exists( '/srv/http/assets/js/lyrics.js' ) ) { ?> 
<script src="<?=$this->asset( '/js/lyrics.js' )?>"></script>
<?php
	}
} else if ( $this->uri(1) === 'addons' ) { ?>
<script src="<?=$this->asset( '/js/vendor/jquery.mobile.custom.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/addonsinfo.js' )?>"></script>
<script src="<?=$this->asset( '/js/addons.js' )?>"></script>
<script>
// restore after update changed to spinning gear
	$( '#loader' ).html( '<img src="<?=$this->asset( '/img/runelogo.svg' )?>">' );
</script>
<?php
} else {
	if ( $this->uri(1) === 'sources' || $this->uri(1) === 'network' ) { ?>
<script src="<?=$this->asset( '/js/vendor/pushstream.min.js' )?>"></script>
<?php 
	} else if ( $this->uri(1) === 'mpd' ) { ?>
<script src="<?=$this->asset( '/js/vendor/pnotify.custom.min.js' )?>"></script>
<?php 
	} else if ( $this->uri(1) === 'debug' ) { ?>
<script src="<?=$this->asset( '/js/vendor/pnotify.custom.min.js' )?>"></script>
<script src="<?=$this->asset('/js/vendor/ZeroClipboard.min.js' )?>"></script>
<?php 
	} ?>
<script src="<?=$this->asset( '/js/vendor/bootstrap.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/bootstrap-select.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/vendor/parsley.min.js' )?>"></script>
<script src="<?=$this->asset( '/js/enhancesettings.js' )?>"></script>
<?php 
} ?>
