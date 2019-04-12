#!/usr/bin/php
<?php
require_once( '/srv/http/enhancegetcover.php' );
echo getCoverart( $argv[ 1 ], 0, 1 );
