#include <u.h>
#include <libc.h>
#include <draw.h>

int main(int argc, char **argv){
	Image *i;

	if(initdraw(nil, nil, "drawydata") == -1){
		fprint(2, "initdraw: %r\n");
		return 1;
	}

	i = readimage(display, 0, 0);
	if(!i){
		fprint(2, "readimage: %r\n");
		return 1;
	}

	line(screen, (Point){15, 15}, (Point){400, 400},
		Endarrow, Endsquare, 100, i, (Point){0, 0});

	flushimage(display, 1);
	sleep(5000);

	return 0;
}
