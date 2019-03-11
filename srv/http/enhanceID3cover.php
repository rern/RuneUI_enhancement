#!/usr/bin/php
<?php
require_once( '/srv/http/enhancegetcover.php' );
echo getID3cover( $argv[ 1 ], 1 );
