<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="msapplication-tap-highlight" content="no" />
<?php 
$root = empty( $this->uri(1) );
$gpio = file_exists( '/srv/http/gpiosettings.php' );
if ( $root ) { ?>
	<title>RuneUIe</title>
<?php 
} else { ?>
	<title>Rune Settings</title>
<?php 
} ?>
	<link rel="shortcut icon" href="<?=$this->asset( '/img/favicon.ico' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/bootstrap.min.css' )?>">
<?php 
if ( $root || $this->uri(1) === 'mpd' || $this->uri(1) === 'debug' ) { ?>
	<link rel="stylesheet" href="<?=$this->asset( '/css/pnotify.custom.min.css' )?>">
<?php
}
if ( is_localhost() ) { ?>
	<link rel="stylesheet" href="<?=$this->asset( '/css/onScreenKeyboard.css' )?>">
<?php 
}
function fontface( $name, $_this ) {
	$woff = $_this->asset( "/fonts/$name.woff" );
	$ttf = $_this->asset( "/fonts/$name.ttf" );
	return "
		@font-face {
			font-family: $name;
			src        : url( '$woff' ) format( 'woff' ), url( '$ttf' ) format( 'truetype' );
			font-weight: normal;
			font-style : normal;
		}";
}
if ( $root ) {
	echo
	'<style>'
		.fontface( 'addons', $this )
		.fontface( 'enhance', $this )
	.'</style>';
}
if ( $root ) { ?>
	<link rel="stylesheet" href="<?=$this->asset( '/css/fontawesome.min.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/addonsinfo.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/roundslider.min.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/enhance.css' )?>">
<?php
	if ( strpos( $_SERVER['HTTP_USER_AGENT'], 'Midori' ) !== false ) { ?> 
	<link rel="stylesheet" href="<?=$this->asset('/css/midori.css' )?>">
	<?php 
	}
	if ( $gpio ) { ?> 
	<link rel="stylesheet" href="<?=$this->asset( '/css/gpio.css' )?>">
	<?php 
	}
	if ( file_exists('/srv/http/assets/js/lyrics.js') ) { ?> 
	<link rel="stylesheet" href="<?=$this->asset( '/css/lyrics.css' )?>">
	<?php 
	}
} else { ?>
	<link rel="stylesheet" href="<?=$this->asset( '/css/fontawesome.min.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/bootstrap-select.min.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/toggle-switch.min.css' )?>">
	<link rel="stylesheet" href="<?=$this->asset( '/css/enhancesettings.css' )?>">
<?php 
}
if ( $root ) { ?>
	<link rel="apple-touch-icon" sizes="57x57" href="<?=$this->asset( '/img/apple-touch-icon-57x57.png' )?>">
	<link rel="apple-touch-icon" sizes="114x114" href="<?=$this->asset( '/img/apple-touch-icon-114x114.png' )?>">
	<link rel="apple-touch-icon" sizes="72x72" href="<?=$this->asset( '/img/apple-touch-icon-72x72.png' )?>">
	<link rel="apple-touch-icon" sizes="144x144" href="<?=$this->asset( '/img/apple-touch-icon-144x144.png' )?>">
	<link rel="apple-touch-icon" sizes="60x60" href="<?=$this->asset( '/img/apple-touch-icon-60x60.png' )?>">
	<link rel="apple-touch-icon" sizes="120x120" href="<?=$this->asset( '/img/apple-touch-icon-120x120.png' )?>">
	<link rel="apple-touch-icon" sizes="76x76" href="<?=$this->asset( '/img/apple-touch-icon-76x76.png' )?>">
	<link rel="apple-touch-icon" sizes="152x152" href="<?=$this->asset( '/img/apple-touch-icon-152x152.png' )?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?=$this->asset( '/img/apple-touch-icon-180x180.png' )?>">
	<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-192x192.png' )?>" sizes="192x192">
	<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-160x160.png' )?>" sizes="160x160">
	<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-96x96.png' )?>" sizes="96x96">
	<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-16x16.png' )?>" sizes="16x16">
	<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-32x32.png' )?>" sizes="32x32">
	<meta name="apple-mobile-web-app-title" content="RuneAudio">
	<meta name="msapplication-TileColor" content="#000000">
	<meta name="msapplication-TileImage" content="<?=$this->asset( '/img/mstile-144x144.png' )?>">
	<meta name="msapplication-config" content="<?=$this->asset( '/img/browserconfig.xml' )?>">
	<meta name="application-name" content="RuneAudio">
<?php 
} ?>
</head>

<body>

<?php 
if ( $root ) { ?>
<div id="settings" class="menu hide">
	<span class="menushadow"></span>
	<a href="sources"><i class="fa fa-folder-open-cascade"></i>Sources</a>
	<a href="mpd"><i class="fa fa-mpd"></i>MPD</a>
	<a href="settings"><i class="fa fa-sliders"></i>Settings</a>
	<a href="network"><i class="fa fa-network"></i>Network</a>
	<a href="credits"><i class="fa fa-rune"></i>Credits</a>
	<a id="debug" href="debug"><i class="fa fa-code"></i>Debug</a>
	<a id="dev" href="dev"><i class="fa fa-gears"></i>Development</a>
	<a id="turnoff"><i class="fa fa-power"></i>Power</a>
	<?php 
	if ( $this->pwd_protection ) { ?>
	<a href="logout.php"><i class="fa fa-sign-out"></i>Logout</a>
	<?php 
	}
	if ( $gpio ) { ?>
	<a id="gpio"><i class="fa fa-gpio"></i>GPIO</a>
	<?php 
	} ?>
	<a id="displaylibrary"><i class="fa fa-library gr"></i>Library Items</a>
	<a id="displayplayback"><i class="fa fa-play-circle gr"></i>Playback Items</a>
	<a id="addons"><i class="fa fa-addons"></i>Addons</a>
</div>
<div id="menu-top" class="hide">
<i id="menu-settings" class="fa fa-gear"></i><span id="badge" class="hide"></span>
<div id="playback-controls">
	<button id="previous" class="btn btn-default btn-cmd"><i class="fa fa-step-backward"></i></button>
	<button id="stop" class="btn btn-default btn-cmd"><i class="fa fa-stop"></i></button>
	<button id="play" class="btn btn-default btn-cmd"><i class="fa fa-play"></i></button>
	<button id="pause" class="btn btn-default btn-cmd"><i class="fa fa-pause"></i></button>
	<button id="next" class="btn btn-default btn-cmd"><i class="fa fa-step-forward"></i></button>
	</div>
	<a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank">
		<img class="logo" src="<?=$this->asset( '/img/runelogo.svg' )?>">
	</a>
</div>
<div id="swipebar" class="transparent"><img src="<?=$this->asset( '/img/swipe.svg' )?>"></div>
<div id="menu-bottom" class="hide">
	<ul>
		<li id="tab-library"><a><i class="fa fa-library"></i></a></li>
		<li id="tab-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
		<li id="tab-playlist"><a><i class="fa fa-list-ul"></i></a></li>
	</ul>
</div>
<?php 
} ?>
