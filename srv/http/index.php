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

$engine = new League\Plates\Engine('/srv/http/app/templates');
$engine->loadExtension(new League\Plates\Extension\Asset('/srv/http/assets', true));
$engine->loadExtension(new League\Plates\Extension\URI($_SERVER['REQUEST_URI']));
$template = new League\Plates\Template($engine);
$controllers = array(
	'addons',
	'accesspoint',
	'addons',
	'alsamixer',
	'enhancecoverart',
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
if (in_array($template->uri(1), $controllers) OR empty($template->uri(1))) {
	if (!empty($template->uri(1))) {
		if (!empty($template->uri(2))) {
			$template->action = $template->uri(2);
			$subtpl = $template->action === 'add' ? 'edit' : $template->action;
			if(!empty($template->uri(3))) $template->arg = $template->uri(3);
			$template->content = $template->uri(1).'_'.$subtpl;
		} else {
			$template->content = $template->uri(1);
		}
		$template->section = $template->uri(1);
		include(APP.$template->uri(1).'_ctl.php');
		$_SESSION['controller'] = $template->uri(1);
	} else {
		$template->section = 'index';
		$template->content = 'enhanceplayback';
		$_SESSION['controller'] = 'enhanceplayback';
	}
} else {
	$template->section = 'error';
	$template->content = 'error';
	$_SESSION['controller'] = 'error';
}
echo $template->render('enhancedefault');
// TODO: rework needed
$activePlayer = $redis->get('activePlayer');
$template->activePlayer = $activePlayer;
if ($activePlayer === 'MPD') {
	closeMpdSocket($mpd);
} elseif ($activePlayer === 'Spotify') {
	closeSpopSocket($spop);
}
$notifications = $redis->hGetAll('notifications');
if (!empty($notifications)) 
	foreach ($notifications as $raw_notification)
		wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'ui_notify', 'args' => $notifications, 'delay_us' => 450000));
session_write_close();
