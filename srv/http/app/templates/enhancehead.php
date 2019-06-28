	<?php 
	$root = empty( $this->uri(1) );
	$title = $root ? 'RuneUIe' : 'Rune Settings';
	$addons = file_exists( '/srv/http/assets/fonts/addons.ttf' );
	$gpio = file_exists( '/srv/http/assets/css/gpio.css' );
	?>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="msapplication-tap-highlight" content="no" />
<title><?=$title?></title>
<link rel="apple-touch-icon" sizes="152x152" href="<?=$this->asset( '/img/apple-touch-icon-152x152.png' )?>">
<link rel="apple-touch-icon" sizes="167x167" href="<?=$this->asset( '/img/apple-touch-icon-167x167.png' )?>">
<link rel="apple-touch-icon" sizes="180x180" href="<?=$this->asset( '/img/apple-touch-icon-180x180.png' )?>">
<link rel="icon" type="image/png" href="<?=$this->asset( '/img/favicon-192x192.png' )?>" sizes="192x192">
<meta name="apple-mobile-web-app-title" content="RuneAudio">
<meta name="msapplication-TileColor" content="#000000">
<meta name="msapplication-TileImage" content="<?=$this->asset( '/img/mstile-144x144.png' )?>">
<meta name="msapplication-config" content="<?=$this->asset( '/img/browserconfig.xml' )?>">
<meta name="application-name" content="RuneAudio">
<link rel="stylesheet" href="<?=$this->asset( '/css/bootstrap.min.css' )?>">
	<?php 
	if ( $root ) {
	?>
<style>
	@font-face {
		font-family: enhance;
		src        : url( "<?=$this->asset( '/fonts/addons.woff' )?>" ) format( 'woff' ), url( "<?=$this->asset( '/fonts/addons.ttf' )?>" ) format( 'truetype' );
		font-weight: normal;
		font-style : normal;
	}
</style>
<link rel="stylesheet" href="<?=$this->asset( '/css/fontawesome.min.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/addonsinfo.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/roundslider.min.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/enhance.css' )?>">
<link rel="stylesheet" href="<?=$this->asset( '/css/enhancebanner.css' )?>">
		<?php
		if ( !preg_match( '/(Mobile|Android|Tablet|GoBrowser|[0-9]x[0-9]*|uZardWeb\/|Mini|Doris\/|Skyfire\/|iPhone|Fennec\/|Maemo|Iris\/|CLDC\-|Mobi\/)/uis', $_SERVER['HTTP_USER_AGENT'] ) ) { ?>
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
<link rel="stylesheet" href="<?=$this->asset( '/css/enhancebanner.css' )?>">
	<?php 
	} ?>
	