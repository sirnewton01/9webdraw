#include <u.h>
#include <libc.h>
#include <draw.h>
#include <cursor.h>

ulong color = 0x6060a8ff;

void oopsie(Display *d, char *msg){
	exits(msg);
}

int main(int argc, char **argv){
	Image *im;

	if(initdraw(oopsie, nil, "drawellipse") == -1){
		fprint(2, "initdraw: %r\n");
		return 1;
	}

	im = allocimage(display, Rect(0, 0, 1024, 1024), CMAP8, 1, color);

	ellipse(screen, (Point){200, 200}, 25, 25, 5,
		im, (Point){0, 0});

	fillellipse(screen, (Point){300, 200}, 50, 25, im, (Point){0, 0});

	flushimage(display, 1);

	sleep(5000);
	return 0;
}
