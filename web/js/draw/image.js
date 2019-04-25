CtxWrap = function(ctx) {
    ctx.rrect = function(r) {
        return ctx.rect(r.min.x, r.min.y, Dx(r), Dy(r));
    }
    ctx.pdrawImage = function(canvas, p) {
        return ctx.drawImage(canvas, p.x, p.y);
    }
    ctx.rclearRect = function(r) {
        return ctx.clearRect(r.min.x, r.min.y, r.max.x, r.max.y);
    }
    ctx.pmoveTo = function(p) {
        return ctx.moveTo(p.x, p.y);
    }
    ctx.plineTo = function(p) {
        return ctx.lineTo(p.x, p.y);
    }
    ctx.ptranslate = function(p) {
        return ctx.translate(p.x, p.y);
    }
    ctx.rgetImageData = function(r) {
        return ctx.getImageData(r.min.x, r.min.y, Dx(r), Dy(r));
    }
    ctx.pputImageData = function(data, p) {
        return ctx.putImageData(data, p.x, p.y);
    }
    return ctx;
}

var DNofill = 0xFFFFFF00;

function fill(ctx, w, h, color) {
    var red, green, blue, alpha;
    var data;
    var i;

    if (color == DNofill)
        return;

    red = (color >> 24) & 0xFF;
    green = (color >> 16) & 0xFF;
    blue = (color >> 8) & 0xFF;
    alpha = (color) & 0xFF;

    data = ctx.createImageData(w, h);
    for (i = 0; i < data.data.length; i += 4) {
        data.data[i + 0] = red;
        data.data[i + 1] = green;
        data.data[i + 2] = blue;
        data.data[i + 3] = alpha;
    }
    ctx.putImageData(data, 0, 0);
}

Draw9p.Image = function(id, refresh, chan, repl, r, clipr, color) {
    this.id = id;
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("image");
    this.canvas.width = r.max.x - r.min.x;
    this.canvas.height = r.max.y - r.min.y;
    this.refresh = refresh;
    this.chan = chan;
    this.repl = repl;
    this.r = r;
    this.clipr = clipr;

    this.ctx = CtxWrap(this.canvas.getContext("2d"));

    fill(this.ctx, this.canvas.width, this.canvas.height, color);
}

/* XXX break out memlalloc so we can set the refresh function properly */
Draw9p.ScreenImage = function(id, screen, refresh, chan, repl, r, clipr, color) {
    var paint;

    if (screen == undefined || screen.backimg == undefined) {
        throw ("invalid screen");
    }

    this.id = id;
    this.canvas = screen.backimg.canvas;
    this.screen = screen;
    this.scrmin = r.min;
    /* XXX remember to update screenr */
    /* XXX should screenr be clipr? */
    this.screenr = r;
    this.clear = false;
    this.delta = new Point(0, 0);

    /* if(chan != this.screen.backimg.chan){ */
    /* 	throw("chan mismatch between image and screen"); */
    /* } */

    /* refresh methods */
    /* Refbackup = 0, */
    /* Refnone = 1, */
    /* Refmesg = 2 */

    this.refresh = refresh;
    this.chan = chan;
    this.repl = repl;
    this.r = r;
    this.clipr = clipr;

    this.refreshfn = function() {
        throw ("you should not be calling refreshfn");
    }

    this.ctx = this.screen.backimg.ctx;
    this.save = new Draw9p.Image(-2, 0, Chan.fmts.RGBA32, 0, r, r, color);

    this.front = this.screen.rearmost;
    this.rear = undefined;
    if (this.screen.rearmost != undefined)
        this.screen.rearmost.rear = this;
    this.screen.rearmost = this;
    if (this.screen.frontmost == undefined)
        this.screen.frontmost = this;
    this.clear = false;
    memltofrontfill(this, color != DNofill);

    paint = new Draw9p.Image(-3, 0, Chan.fmts.RGBA32, true,
        new Rect(new Point(0, 0), new Point(1, 1)),
        new Rect(new Point(0, 0), new Point(1, 1)), color);
    memdraw(this, this.r, paint, this.r.min, undefined, this.r.min, Memdraw.Opdefs.S.key);
}

/* XXX Creating a new rootwindow object for each connection will probably */
/* break once we start doing more advanced things. */
Draw9p.RootImage = function() {
    var sz = Draw9p.rootsz;
    var image = new this.Image(-10, 0, "r8g8b8", 0, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: sz.w,
                y: sz.h
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: sz.w,
                y: sz.h
            }
        },
        0xFFFFFFFF);

    image.id = -1;
    image.canvas = Draw9p.rootcanvas;
    image.ctx = CtxWrap(image.canvas.getContext("2d"));
    return image;
}

/* XXX fix Image inheritance, ``is-a''. */
Draw9p.Image.prototype.getrect =
    Draw9p.ScreenImage.prototype.getrect =
    Draw9p.RootImage.prototype.getrect =
    function(r) {
        return this.ctx.rgetImageData(rectsubpt(r, this.r.min));
    }

Draw9p.Image.prototype.putrect =
    Draw9p.ScreenImage.prototype.putrect =
    Draw9p.RootImage.prototype.putrect =
    function(data, p) {
        return this.ctx.pputImageData(data, subpt(p, this.r.min));
    }