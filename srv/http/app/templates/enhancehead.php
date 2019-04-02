<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="msapplication-tap-highlight" content="no" />
	<?php 
	$root = empty( $this->uri(1) );
	$title = $root ? 'RuneUIe' : 'Rune Settings';
	$addons = file_exists( '/srv/http/assets/fonts/addons.ttf' );
	$gpio = file_exists( '/srv/http/assets/css/gpio.css' );
	?>
<title><?=$title?></title>
	<?php
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
<link rel="shortcut icon" href="<?=$this->asset( '/img/favicon.ico' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/bootstrap.min.css' )?>">
	<?php 
	if ( $root || $this->uri(1) === 'mpd' || $this->uri(1) === 'debug' ) { ?>
<link rel="stylesheet" href="<?=$this->asset( '/css/pnotify.custom.min.css' )?>">
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
		$fontface = $addons ? fontface( 'addons', $this ) : '';
		$fontface.= fontface( 'enhance', $this );
	?>
<style><?=$fontface?></style>
<link rel="stylesheet" href="<?=$this->asset( '/css/fontawesome.min.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/addonsinfo.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/roundslider.min.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/enhance.css' )?>">
		<?php
		if ( !strpos( 'mobi', $_SERVER['HTTP_USER_AGENT'] ) ) { ?>
<link rel="stylesheet" href="<?=$this->asset( '/css/enhancedesktop.css' )?>">
		<?php
		}
		if ( strpos( 'Midori', $_SERVER['HTTP_USER_AGENT'] ) ) { ?>
<link rel="stylesheet" href="<?=$this->asset( '/css/enhancemidori.css' )?>">
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
	} ?>
