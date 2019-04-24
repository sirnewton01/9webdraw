#include <u.h>
#include <libc.h>
#include <draw.h>
#include <cursor.h>

ulong color = 0x6060a8ff;

int main(int argc, char **argv){
	Image *im;

	if(initdraw(nil, nil, "drawline") == -1){
		fprint(2, "initdraw: %r\n");
		return 1;
	}

	im = allocimage(display, Rect(0, 0, 1, 1), CMAP8, 1, color);

	line(screen, (Point){0, 0}, (Point){400, 400},
		Endsquare, Endsquare, 6, im, (Point){0, 0});

	flushimage(display, 1);

	sleep(5000);
	return 0;
}
