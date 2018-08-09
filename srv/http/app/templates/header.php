<head>
	<meta charset="utf-8">
	<title>RuneUIe</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="msapplication-tap-highlight" content="no" />
	
<?=( is_localhost() ? '	<link rel="stylesheet" href="'.$this->asset('/css/onScreenKeyboard.css').'">' : '' ) ?>

	<link rel="stylesheet" href="<?=$this->asset('/css/runeui.min.css')?>">

<?php
function fontface( $name, $woff, $ttf ) {
	return '
	@font-face {
		font-family: '.$name.';
		src        : url( "'.$woff.'" ) format( "woff" ), url( "'.$ttf.'" ) format( "truetype" );
		font-weight: normal;
		font-style : normal;
	}';
}
if ( empty( $this->uri(1) ) || $this->uri(1) === 'addons' ) {
	$name = 'addons';
	$font = fontface( $name, $this->asset('/fonts/'.$name.'.woff'), $this->asset('/fonts/'.$name.'.ttf') );
	$name = 'enhance';
	$font.= fontface( $name, $this->asset('/fonts/'.$name.'.woff'), $this->asset('/fonts/'.$name.'.ttf') );
	echo '<style>'.$font.'</style>';
}
?>
<?php if ( empty( $this->uri(1) ) ): ?>
	<link rel="stylesheet" href="<?=$this->asset('/css/addonsinfo.css')?>">
	<link rel="stylesheet" href="<?=$this->asset('/css/roundslider.min.css')?>">
	<link rel="stylesheet" href="<?=$this->asset('/css/enhance.css')?>">
	
<?php elseif ( $this->uri(1) === 'addons' ): ?>
	<link rel="stylesheet" href="<?=$this->asset('/css/addonsinfo.css')?>">
	<link rel="stylesheet" href="<?=$this->asset('/css/addons.css')?>">
	
<?php endif ?>

	<link rel="shortcut icon" href="<?=$this->asset('/img/favicon.ico')?>">
<?php if ( empty( $this->uri(1) ) ): ?>
	<link rel="apple-touch-icon" sizes="57x57" href="<?=$this->asset('/img/apple-touch-icon-57x57.png')?>">
	<link rel="apple-touch-icon" sizes="114x114" href="<?=$this->asset('/img/apple-touch-icon-114x114.png')?>">
	<link rel="apple-touch-icon" sizes="72x72" href="<?=$this->asset('/img/apple-touch-icon-72x72.png')?>">
	<link rel="apple-touch-icon" sizes="144x144" href="<?=$this->asset('/img/apple-touch-icon-144x144.png')?>">
	<link rel="apple-touch-icon" sizes="60x60" href="<?=$this->asset('/img/apple-touch-icon-60x60.png')?>">
	<link rel="apple-touch-icon" sizes="120x120" href="<?=$this->asset('/img/apple-touch-icon-120x120.png')?>">
	<link rel="apple-touch-icon" sizes="76x76" href="<?=$this->asset('/img/apple-touch-icon-76x76.png')?>">
	<link rel="apple-touch-icon" sizes="152x152" href="<?=$this->asset('/img/apple-touch-icon-152x152.png')?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?=$this->asset('/img/apple-touch-icon-180x180.png')?>">
	<meta name="apple-mobile-web-app-title" content="RuneAudio">
	<link rel="icon" type="image/png" href="<?=$this->asset('/img/favicon-192x192.png')?>" sizes="192x192">
	<link rel="icon" type="image/png" href="<?=$this->asset('/img/favicon-160x160.png')?>" sizes="160x160">
	<link rel="icon" type="image/png" href="<?=$this->asset('/img/favicon-96x96.png')?>" sizes="96x96">
	<link rel="icon" type="image/png" href="<?=$this->asset('/img/favicon-16x16.png')?>" sizes="16x16">
	<link rel="icon" type="image/png" href="<?=$this->asset('/img/favicon-32x32.png')?>" sizes="32x32">
	<meta name="msapplication-TileColor" content="#000000">
	<meta name="msapplication-TileImage" content="/img/mstile-144x144.png">
	<meta name="msapplication-config" content="/img/browserconfig.xml">
	<meta name="application-name" content="RuneAudio">
<?php endif ?>
</head>

<body id="section-<?=( empty( $this->uri(1) ) || $this->uri(1) === 'playback' ? 'index' : $this->section )?>">

<?php if ( empty( $this->uri(1) ) ): ?>
<div id="settings" class="menu hide">
	<a class="menushadow"></a>
	<a class="<?=$this->uri(1, 'sources', 'active')?>" href="/sources/"><i class="fa fa-folder-open-cascade"></i>Sources</a>
	<a class="<?=$this->uri(1, 'mpd', 'active')?>" href="/mpd/"><i class="fa fa-mpd"></i>MPD</a>
	<a class="<?=$this->uri(1, 'settings', 'active')?>" href="/settings/"><i class="fa fa-sliders"></i>Settings</a>
	<a class="<?=$this->uri(1, 'network', 'active')?>" href="/network/"><i class="fa fa-sitemap"></i>Network</a>
	<a class="<?=$this->uri(1, 'debug', 'active')?>" href="/debug/"><i class="fa fa-bug"></i>Debug</a></a>
	<a class="<?=$this->uri(1, 'credits', 'active')?>" href="/credits/"><i class="fa fa-rune"></i>Credits</a>
	<a class="<?=$this->uri(1, 'dev', 'active')?>" href="/dev/"><i class="fa fa-gears"></i>Development</a>
	<a id="turnoff"><i class="fa fa-power-off"></i>Power</a>
<?=( $this->pwd_protection ? '<a href="/logout.php"><i class="fa fa-sign-out"></i>Logout</a>' : '' ) ?>
	<a id="addons"><i class="fa"></i>Addons</a>
</div>
<div id="menu-top" class="hide">
<i id="menu-settings" class="fa fa-gear"></i>
<div class="playback-controls">
	<button id="previous" class="btn btn-default btn-cmd" title="Previous" data-cmd="previous"><i class="fa fa-step-backward"></i></button>
	<button id="stop" class="btn btn-default btn-cmd" title="Stop" data-cmd="stop"><i class="fa fa-stop"></i></button>
	<button id="play" class="btn btn-default btn-cmd" title="Play/Pause" data-cmd="play"><i class="fa fa-play"></i></button>
	<button id="pause" class="btn btn-default btn-cmd" title="Pause" data-cmd="play"><i class="fa fa-pause"></i></button>
	<button id="next" class="btn btn-default btn-cmd" title="Next" data-cmd="next"><i class="fa fa-step-forward"></i></button>
	</div>
	<a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">
		<img class="logo" src="<?=$this->asset('/img/runelogo.svg')?>">
	</a>
</div>
<div id="menu-bottom" class="hide">
	<ul>
		<li id="open-panel-sx"><a><i class="fa fa-library"></i></a></li>
		<li id="open-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
		<li id="open-panel-dx"><a><i class="fa fa-list-ul"></i></a></li>
	</ul>
</div>
<?php endif ?>
