<div id="loader" class="hide">
	<img src="<?=$this->asset('/img/runelogo.svg')?>">
</div>
<script src="<?=$this->asset('/js/vendor/jquery-2.1.0.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/jquery.mobile.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/pushstream.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/pnotify.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/openwebapp.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>

<?php if (is_localhost()): ?>
<script src="<?=$this->asset('/js/vendor/jquery.onScreenKeyboard.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/jquery-ui.min.js')?>"></script>
<?php endif ?>
<?=( $this->section == 'debug' ? '<script src="'.$this->asset('/js/vendor/ZeroClipboard.min.js').'"></script>' : '' ) ?>

<?php if ( !empty( $this->uri(1) ) && $this->uri(1) !== 'gpiosettings' ): ?>
<script src="<?=$this->asset('/js/vendor/bootstrap-select.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/parsley.min.js')?>"></script>
<?php endif ?>

<script src="<?=$this->asset('/js/runeui'.( $this->dev === '0' ? '.min' : '' ).'.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>
<script src="<?=$this->asset('/js/addonsmenu.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<?php /*gpio<script src="<?=$this->asset('/js/enhance.js')?>"></script>gpio*/ ?>

<script src="<?=$this->asset('/js/addonsinfo.js')?>"></script>

<?=( $this->uri(1) === 'addons' ? '<script src="<'.$this->asset('/js/addons.js').'"></script>' : '' ) ?>
<?php if ( $this->uri(1) === 'gpiosettings' ): ?>
<script src="assets/js/vendor/bootstrap-select-1.12.1.min.js"></script>
<script src="assets/js/gpiosettings.js"></script>
<?php endif ?>