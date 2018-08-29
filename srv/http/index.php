<?php
include($_SERVER['HOME'].'/app/config/config.php');
include($_SERVER['HOME'].'/app/libs/vendor/autoload.php');
session_start();

if (!is_localhost() && !isset($_SESSION["login"]) && $redis->get('pwd_protection')) {
	$host  = $_SERVER['HTTP_HOST'];
	$uri   = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
	header("Location: http://$host$uri/login.php");
	die();
}

$engine = new \League\Plates\Engine('/srv/http/app/templates');
$engine->loadExtension(new \League\Plates\Extension\Asset('/srv/http/assets', true));
$engine->loadExtension(new \League\Plates\Extension\URI($_SERVER['REQUEST_URI']));
$template = new \League\Plates\Template($engine);
// allowed controllers
$controllers = array(
	'accesspoint',
	'addons',
	'alsamixer',
	'coverart',
	'credits',
	'dev',
	'debug',
	'login',
	'mpd',
	'network',
	'settings',
	'sources',
	'tun'
);
// check page
if (in_array($template->uri(1), $controllers) OR empty($template->uri(1))) {
	// decode REQUEST_URL and assing section
	if (!empty($template->uri(1))) {
		// decode ACTION
		if (!empty($template->uri(2))) {
			$template->action = $template->uri(2);
			// assign SUB-TEMPLATE
			$subtpl = $template->action === 'add' ? 'edit' : $template->action;
			// decode ARG
			if(!empty($template->uri(3))) $template->arg = $template->uri(3);
			// assign TEMPLATE
			$template->content = $template->uri(1).'_'.$subtpl;
		} else {
			// assign TEMPLATE
			$template->content = $template->uri(1);
		}
		$template->section = $template->uri(1);
		// load selected APP Controller
		include(APP.$template->uri(1).'_ctl.php');
		// register current controller in SESSION
		$_SESSION['controller'] = $template->uri(1);
	} else {
		$template->section = 'index';
		$template->content = 'playback';
		// register current controller in SESSION
		$_SESSION['controller'] = 'playback';
	}
} else {
	$template->section = 'error';
	$template->content = 'error';
	// register current controller in SESSION
	$_SESSION['controller'] = 'error';
}
echo $template->render('default_lo');
// close palyer backend connection
// TODO: rework needed
$activePlayer = $redis->get('activePlayer');
$template->activePlayer = $activePlayer;
if ($activePlayer === 'MPD') {
	closeMpdSocket($mpd);
} elseif ($activePlayer === 'Spotify') {
	closeSpopSocket($spop);
}
// notifications
$notifications = $redis->hGetAll('notifications');
if (!empty($notifications)) {
	foreach ($notifications as $raw_notification) {
		wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'ui_notify', 'args' => $notifications, 'delay_us' => 450000));
	}
}
session_write_close();
