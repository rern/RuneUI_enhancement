<div id="loader" class="hide">
	<div id="loaderbg"></div>
	<div id="loadercontent"><img src="<?=$this->asset('/img/runelogo.svg')?>"></div>
</div>
<script src="<?=$this->asset('/js/vendor/jquery-2.1.0.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/jquery.mobile.custom.min.js')?>"></script>
<?php if (is_localhost()): ?>
<script src="<?=$this->asset('/js/vendor/jquery.onScreenKeyboard.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/jquery-ui.min.js')?>"></script>
<?php endif ?>
<script src="<?=$this->asset('/js/vendor/pushstream.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/bootstrap-select.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/pnotify.custom.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/openwebapp.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>
<script src="<?=$this->asset('/js/runeui'.( $this->dev === '0' ? '.min' : '' ).'.js')?>"></script>

<script src="<?=$this->asset('/js/addonsinfo.js')?>"></script>
<script src="<?=$this->asset('/js/addonsmenu.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>
<script src="<?=$this->asset('/js/gpio.js')?>"></script>
