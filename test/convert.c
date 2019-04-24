#include <u.h>
#include <libc.h>
#include <draw.h>

int main(int argc, char **argv){
	Image *src, *dst;
	ulong chan;

	if(argc == 2){
		chan = strtochan(argv[1]);
	}else{
		chan = GREY1;
	}

	if(initdraw(nil, nil, "convert") == -1){
		fprint(2, "initdraw: %r\n");
		return 1;
	}

	src = readimage(display, 0, 0);
	if(!src){
		fprint(2, "readimage: %r\n");
		return 1;
	}

	dst = allocimage(display, src->r, chan, 0, DNofill);
	if(!dst){
		fprint(2, "allocimage: %r\n");
		return 1;
	}

	draw(dst, src->r, src, nil, src->r.min);

	if(writeimage(1, dst, 0) == -1){
		fprint(2, "writeimage: %r\n");
		return 1;
	}

	freeimage(src);
	freeimage(dst);

	closedisplay(display);

	return 0;
}
