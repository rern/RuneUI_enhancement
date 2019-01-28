<!DOCTYPE html>
<html lang="en">
	<?php
	echo '
<head>';
	$this->insert('enhancehead');
	echo '
</head>
<body>';
	$this->insert($this->content);
	$this->insert('enhancescript');
	?>
</body>
</html>
