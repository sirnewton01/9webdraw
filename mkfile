</$objtype/mkfile

%.$O:	%.c
	$CC $CFLAGS -c $stem.c

%:	%.$O
	$LD -o $stem $prereq

web/js/composetab.js:	latin2js /sys/src/9/port/latin1.h
	latin2js > web/js/composetab.js

install:V:	web/js/composetab.js
	mkdir -p /usr/web/9wd
	dircp web/ /usr/web/9wd/
