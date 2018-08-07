<div id="loader" class="hide">
	<img src="<?=$this->asset('/img/runelogo.svg')?>">
</div>

<script src="<?=$this->asset('/js/vendor/jquery-2.1.0.min.js')?>"></script>

<?php if ( is_localhost() ): ?>
<script src="<?=$this->asset('/js/vendor/jquery.onScreenKeyboard.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/jquery-ui.min.js')?>"></script>
<?php endif ?>

<?php if ( empty( $this->uri(1) ) ): ?>
<script src="<?=$this->asset('/js/vendor/jquery.mobile.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/pushstream.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/pnotify.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/openwebapp.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>
<script src="<?=$this->asset('/js/runeui'.( $this->dev === '0' ? '.min' : '' ).'.js')?>"></script>
<script src="<?=$this->asset('/js/addonsinfo.js')?>"></script>
<script src="<?=$this->asset('/js/addonsmenu.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>

<?php elseif ( $this->uri(1) === 'addons' ): ?>
<script src="<?=$this->asset('/js/vendor/jquery.mobile.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/addonsinfo.js')?>"></script>
<script src="<?=$this->asset('/js/addons.js')?>"></script>

<?php elseif ( $this->uri(1) === 'gpiosettings' ): ?>
<script src="<?=$this->asset('/js/vendor/bootstrap.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap-select-1.12.1.min.js')?>"></script>
<script src="<?=$this->asset('/js/addonsinfo.js')?>"></script>
<script src="<?=$this->asset('/js/gpiosettings.js')?>"></script>

<?php else: ?>
<script src="<?=$this->asset('/js/vendor/bootstrap.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap-select.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/parsley.min.js')?>"></script>
<?=( $this->uri(1) === 'debug' ? '<script src="'.$this->asset('/js/vendor/ZeroClipboard.min.js').'"></script>' : '' ) ?>
<script>
// no top-bottom bars - use close icon
	$( 'div.container' )
		.css( 'padding-top', '0' )
		.find( 'h1' ).before( '<a href="/" style="	float: right; margin-top: 20px;"><i class="fa fa-times fa-2x"></i></a>' );
</script>
<?php endif ?>

<?php /*gpio<script src="<?=$this->asset('/js/gpio.js')?>"></script>gpio*/ ?>
