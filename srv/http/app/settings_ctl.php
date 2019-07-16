<?php 
if (isset($_POST)) {    
	if (isset($_POST['ntpserver'])) {
		if (empty($_POST['ntpserver'])) {
			$args = 'pool.ntp.org';
		} else {
			$args = $_POST['ntpserver'];
		}
		$redis->get('ntpserver') == $args || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'ntpserver', 'args' => $args));        
	}
	if (isset($_POST['timezone'])) {      
		$args = $_POST['timezone'];
		$redis->get('timezone') == $args || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'timezone', 'args' => $args));        
	}
	if (isset($_POST['hostname'])) {
		if (empty($_POST['hostname'])) {
			$args = 'RuneAudio';
		} else {
			$args = $_POST['hostname'];
		}
		$redis->get('hostname') == $_POST['hostname'] || $jobID[] = wrk_control($redis, 'newjob', $data = array( 'wrkcmd' => 'hostname', 'args' => $args ));        
	}
	if (isset($_POST['kernel'])) {        
		if ($redis->get('kernel') !== $_POST['kernel']) {
			$job = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'kernelswitch', 'args' => $_POST['kernel']));
			$notification = new stdClass();
			$notification->title = 'Kernel switch';
			$notification->text = 'Kernel switch started...';
			wrk_notify($redis, 'startjob', $notification, $job);
			$jobID[] = $job;
		}
	}
	if (isset($_POST['orionprofile'])) {        
		$redis->get('orionprofile') == $_POST['orionprofile'] || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'orionprofile', 'args' => $_POST['orionprofile']));
	}
	if (isset($_POST['i2smodule_select'])) {
		if ($redis->get('i2smodule_select') !== $_POST['i2smodule_select']) {
			$redis->set('i2smodule_select', $_POST['i2smodule_select']);
			$notification = new stdClass();
			list($i2smodule, $i2sselectedname) = explode('|', $_POST['i2smodule_select'], 2);
			if ($i2smodule !== 'none') {
				$notification->title = 'Loading I&#178;S kernel module';
			} else {
				$notification->title = 'Unloading I&#178;S kernel module';
			}
			$job = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'i2smodule', 'args' => $i2smodule));
			$notification->text = 'Please wait';
			wrk_notify($redis, 'startjob', $notification, $job);
			$jobID[] = $job;
		}
		if ($_POST['i2smodule'] === 'berrynosmini') $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'orionprofile', 'args' => 'OrionV3_berrynosmini'));
		if ($_POST['i2smodule'] === 'iqaudiopidac') $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'orionprofile', 'args' => 'OrionV3_iqaudio'));
		if ($redis->get('audio_on_off') !== $_POST['audio_on_off']) {
			$notification = new stdClass();
			$job = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'audio_on_off', 'args' => $_POST['audio_on_off']));
			$notification->text = 'Please wait';
			wrk_notify($redis, 'startjob', $notification, $job);
			$jobID[] = $job;
			if ($_POST['audio_on_off'] == 1) {
				$redis->get('audio_on_off') == 1 || $redis->set('audio_on_off', 1);
			} else {
				$redis->get('audio_on_off') == 0 || $redis->set('audio_on_off', 0);
			}
		}
	}
	// ----- FEATURES -----
	if (isset($_POST['features'])) {
		if ( $_POST['features']['airplay']['enable'] == 1 ) {
			exec( '/usr/bin/sudo /usr/bin/systemctl enable shairport-sync shairport-meta;'
				 .'/usr/bin/sudo /usr/bin/systemctl start shairport-sync shairport-meta' );
			$redis->hSet( 'airplay', 'enable', 1 );
		} else {
			exec( '/usr/bin/sudo /usr/bin/systemctl disable shairport-sync shairport-meta;'
				 .'/usr/bin/sudo /usr/bin/systemctl stop shairport-sync shairport-meta' );
			$redis->hSet( 'airplay', 'enable', 0 );
		}
		if ($_POST['features']['dlna']['enable'] == 1) {
			exec( '/usr/bin/sudo /usr/bin/systemctl enable upmpdcli;'
				 .'/usr/bin/sudo /usr/bin/systemctl start upmpdcli' );
			$redis->hMset( 'dlna', array( 'enable' => 1, 'queueowner' => $_POST['features']['dlna']['queueowner'] ) );
		} else {
			exec( '/usr/bin/sudo /usr/bin/systemctl disable upmpdcli;'
				 .'/usr/bin/sudo /usr/bin/systemctl stop upmpdcli' );
			$redis->hSet( 'dlna', 'enable', 0 );
		}
		if ($_POST['features']['local_browser']['enable'] == 1) {
			$redis->hGet('local_browser', 'enable') == 1 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'start', 'args' => 1));
			if ($_POST['features']['local_browser']['zoomfactor'] != $redis->hGet('local_browser', 'zoomfactor')) {
				$jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'zoomfactor', 'args' => $_POST['features']['local_browser']['zoomfactor']));
			}
			if ($_POST['features']['local_browser']['rotate'] != $redis->hGet('local_browser', 'rotate')) {
				$jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'rotate', 'args' => $_POST['features']['local_browser']['rotate']));
			}
			if ($_POST['features']['local_browser']['mouse_cursor'] == 1) {
				$redis->hGet('local_browser', 'mouse_cursor') == 1 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'mouse_cursor', 'args' => 1));
			} else {
				$redis->hGet('local_browser', 'mouse_cursor') == 0 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'mouse_cursor', 'args' => 0));
			}
			if ($_POST['features']['localSStime'] != $redis->get('localSStime')) {
				$jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'localSStime', 'args' => $_POST['features']['localSStime']));
			}
		} else {
			$redis->hGet('local_browser', 'enable') == 0 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'xorgserver', 'action' => 'stop', 'args' => 0));
		}
		if ($_POST['features']['pwd_protection'] == 1) {
			$redis->get('pwd_protection') == 1 || $redis->set('pwd_protection', 1);
		} else {
			$redis->get('pwd_protection') == 0 || $redis->set('pwd_protection', 0);
		}
		if ($_POST['features']['udevil'] == 1) {
			$redis->get('udevil') == 1 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'udevil', 'action' => 'start'));
		} else {
			$redis->get('udevil') == 0 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'udevil', 'action' => 'stop'));
		}
		if ($_POST['features']['lastfm']['enable'] == 1) {
			if (($_POST['features']['lastfm']['user'] != $redis->hGet('lastfm', 'user') OR $_POST['features']['lastfm']['pass'] != $redis->hGet('lastfm', 'pass')) OR $redis->hGet('lastfm', 'enable') != $_POST['features']['lastfm']['enable']) {
				$jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'lastfm', 'action' => 'start', 'args' => $_POST['features']['lastfm']));
			}
		} else {
			$redis->hGet('lastfm','enable') == 0 || $jobID[] = wrk_control($redis, 'newjob', $data = array('wrkcmd' => 'lastfm', 'action' => 'stop'));
		}
		if ( $_POST[ 'features' ][ 'samba' ][ 'enable' ] == 1 ) {
			exec( '/usr/bin/sudo /usr/bin/systemctl enable nmb smb;'
				 .'/usr/bin/sudo /usr/bin/systemctl start nmb smb' );
			$redis->hSet( 'samba', 'enable', 1 );
		} else {
			exec( '/usr/bin/sudo /usr/bin/systemctl disable nmb smb;'
				 .'/usr/bin/sudo /usr/bin/systemctl stop nmb smb' );
			$redis->hSet( 'samba', 'enable', 0 );
		}
	}
}
waitSyWrk($redis,$jobID);
$template->sysstate['kernel'] = file_get_contents('/proc/version');
$template->sysstate['time'] = implode('\n', sysCmd('date'));
$template->sysstate['uptime'] = date('d:H:i:s', strtok(file_get_contents('/proc/uptime'), ' ' ));
$template->sysstate['HWplatform'] = $redis->get('hwplatform')." (".$redis->get('hwplatformid').")";
$template->sysstate['HWmodel'] = implode('\n', sysCmd('cat /proc/device-tree/model'));
$template->sysstate['playerID'] = $redis->get('playerid');
$template->sysstate['buildversion'] = $redis->get('buildversion')."-".$redis->get('patchlevel');
$template->sysstate['release'] = $redis->get('release');
$template->hostname = $redis->get('hostname');
$template->ntpserver = $redis->get('ntpserver');
$template->timezone = $redis->get('timezone');
$template->orionprofile = $redis->get('orionprofile');
$template->airplay = $redis->hGetAll('airplay');
$template->dlna = $redis->hGetAll('dlna');
$template->local_browser = $redis->hGetAll('local_browser');
$template->udevil = $redis->get('udevil');
$template->lastfm = $redis->hGetAll('lastfm');
$template->samba = $redis->hGetAll('samba');
$template->hwplatformid = $redis->get('hwplatformid');
$template->i2smodule = $redis->get('i2smodule');
$template->i2smodule_select = $redis->get('i2smodule_select');
$template->audio_on_off = $redis->get('audio_on_off');
$template->kernel = $redis->get('kernel');
$template->pwd_protection = $redis->get('pwd_protection');
$template->local_browseronoff = file_exists('/usr/bin/xinit');
