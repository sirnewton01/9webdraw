var icossin2 = function(dx, dy) {
    var theta = Math.atan2(dx, dy);
    return {
        cos: Math.cos(theta),
        sin: Math.sin(theta),
        theta: theta
    }
}

/* See: /sys/src/libdraw/drawrepl.c */
var drawreplxy = function(min, max, x) {
    var sx;

    sx = (x - min) % (max - min);
    if (sx < 0)
        sx += max - min;

    return sx + min;
}

var drawrepl = function(r, p) {
    return new Point(
        drawreplxy(r.min.x, r.max.x, p.x),
        drawreplxy(r.min.y, r.max.y, p.y)
    );
}

/* See: /sys/src/libmemdraw/draw.c:/^drawclip */
var drawclip = function(dst, ior, src, iop0, mask, iop1, iosr, iomr) {
    var r, p0, p1, sr, mr;
    var rmin, delta;
    var splitcoords;
    var omr;

    r = ior;
    p0 = iop0;
    p1 = iop1;
    sr = iosr;
    mr = iomr;

    if (r.min.x >= r.max.x || r.min.y >= r.max.y)
        return false;
    splitcoords = !eqpt(p0, p1);

    /* clip to destination */
    rmin = Point.copy(r.min);
    if (!rectclip(r, dst.r) || !rectclip(r, dst.clipr))
        return false;

    /* move mask point */
    p1 = addpt(p1, subpt(r.min, rmin));

    /* move source point */
    p0 = addpt(p0, subpt(r.min, rmin));

    /* map destination rectangle into source */
    sr.min = Point.copy(p0);
    sr.max = addpt(p0, Dxy(r));

    /* sr is r in source coordinates; clip to source */
    if (!src.repl && !rectclip(sr, src.r))
        return false;
    if (!rectclip(sr, src.clipr))
        return false;

    /* compute and clip rectangle in mask */
    if (splitcoords) {
        /* move mask point with source */
        p1 = addpt(p1, subpt(sr.min, p0));
        mr.min = Point.copy(p1);
        mr.max = addpt(p1, Dxy(sr));
        omr = Rect.copy(mr);

        /* mr is now rectangle in mask; clip it */
        if (!mask.repl && !rectclip(mr, mask.r))
            return false;
        if (!rectclip(mr, mask.clipr))
            return false;

        /* reflect any clips back to source */
        sr.min = addpt(sr.min, subpt(mr.min, omr.min));
        sr.max = addpt(sr.max, subpt(mr.max, omr.max));
        p1 = Point.copy(mr.min);
    } else {
        if (!mask.repl && !rectclip(sr, mask.r))
            return false;
        if (!rectclip(sr, mask.clipr))
            return false;
        p1 = Point.copy(sr.min);
    }

    /* move source clipping back to destination */
    delta = subpt(r.min, p0);
    r = rectaddpt(sr, delta);

    /* move source rectangle so sr->min is in src->r */
    if (src.repl) {
        delta = subpt(drawrepl(src.r, sr.min), sr.min);
        sr = rectaddpt(sr, delta);
    }
    p0 = sr.min;

    /* move mask point so it is in mask->r */
    p1 = drawrepl(mask.r, p1);
    mr.min = p1;
    mr.max = addpt(p1, Dxy(sr));

    Rect.copyTo(ior, r);
    Point.copyTo(iop0, p0);
    Point.copyTo(iop1, p1);
    Rect.copyTo(iosr, sr);
    Rect.copyTo(iomr, mr);
    return true;
}

/* XXX repl=1 images will not be aligned.  Works fine for simple colour fill though. */
var draw = function(dst, r, src, sp, op) {
    dst.ctx.save();
    dst.ctx.globalCompositeOperation = Memdraw.Ops[op];

    dst.ctx.beginPath();
    dst.ctx.rrect(rectsubpt(r, dst.r.min));
    dst.ctx.clip();

    if (src.repl) {
        dst.ctx.fillStyle = dst.ctx.createPattern(src.canvas, "repeat");
        dst.ctx.fill();
    } else {
        dst.ctx.pdrawImage(src.canvas, addpt(subpt(r.min, dst.r.min), subpt(src.r.min, sp)));
    }
    dst.ctx.restore();

    if (dst.screen != undefined)
        dst.screen.dirty = true;
    return;
}

var maskalpha = function(img) {
    var data = img.ctx.getImageData(0, 0, img.canvas.width, img.canvas.height);
    for (var i = 0; i < data.data.length; i += 4) {
        data.data[i + 3] = (data.data[i + 0] + data.data[i + 1] + data.data[i + 2]) / 3;
    }
    img.ctx.putImageData(data, 0, 0);
}

memopaque = new Draw9p.Image(
    -8,
    0, Chan.fmts.GREY1, 1,
    new Rect(new Point(0, 0), new Point(1, 1)),
    new Rect(new Point(-0x3FFFFFF, -0x3FFFFFF), new Point(0x3FFFFFF, 0x3FFFFFF)),
    0xFFFFFFFF
);

var drawmasked = function(dst, ior, src, iosp, mask, iomp, op) {
    var r, sr, mr, sp, mp;
    var img;

    if (mask == undefined) {
        mask = memopaque;
        iomp = new Point(0, 0);
    }

    r = Rect.copy(ior);
    sr = new Rect(new Point(0, 0), new Point(0, 0));
    mr = new Rect(new Point(0, 0), new Point(0, 0));
    sp = Point.copy(iosp);
    mp = Point.copy(iomp);

    /* XXX modifies r, sp, mp, sr, mr */
    if (!drawclip(dst, r, src, sp, mask, mp, sr, mr))
        return false;

    img = new Draw9p.Image(-5, 0, Chan.fmts.RGBA32, 0, r, r, 0x00000000);
    draw(img, r, mask, mp, Memdraw.Opdefs.SoverD.key);
    maskalpha(img);

    draw(img, r, src, sp, Memdraw.Opdefs.SinD.key);
    draw(dst, r, img, r.min, op);
    return true;
}

var load = function(dst, r, data, iscompressed) {
    var img = new Draw9p.Image(-6, 0, dst.chan, 0, r, r, 0);
    var w = r.max.x - r.min.x;
    var h = r.max.y - r.min.y;
    var arr = img.ctx.createImageData(w, h);

    var offset = Memdraw.Load(arr.data, w, h, img.chan, data, iscompressed);
    img.ctx.putImageData(arr, 0, 0);
    draw(dst, r, img, r.min, Memdraw.Opdefs.SoverD.key);
    /* Append canvas for debugging. */
    //document.body.appendChild(dst.canvas);
    return offset;
}

var arrowend = function(tip, points, pp, end, sin, cos, radius) {
    var x1, x2, x3;

    if (end == Memdraw.End.arrow) {
        x1 = 8;
        x2 = 10;
        x3 = 3;
    } else {
        x1 = (end >> 5) & 0x1FF;
        x2 = (end >> 14) & 0x1FF;
        x3 = (end >> 23) & 0x1FF;
    }

    points[pp] = {
        /* upper side of shaft */
        x: tip.x + ((2 * radius + 1) * sin / 2 - x1 * cos),
        y: tip.y - ((2 * radius + 1) * cos / 2 + x1 * sin)
    };
    ++pp;
    points[pp] = {
        /* upper barb */
        x: tip.x + ((2 * radius + 2 * x3 + 1) * sin / 2 - x2 * cos),
        y: tip.y - ((2 * radius + 2 * x3 + 1) * cos / 2 + x2 * sin)
    };
    ++pp;
    points[pp] = {
        x: tip.x,
        y: tip.y
    };
    ++pp;
    points[pp] = {
        /* lower barb */
        x: tip.x + (-(2 * radius + 2 * x3 + 1) * sin / 2 - x2 * cos),
        y: tip.y - (-(2 * radius + 2 * x3 + 1) * cos / 2 + x2 * sin)
    };
    ++pp;
    points[pp] = {
        /* lower side of shaft */
        x: tip.x + (-(2 * radius + 1) * sin / 2 - x1 * cos),
        y: tip.y + ((2 * radius + 1) * cos / 2 - x1 * sin)
    };
}

var discend = function(p, radius, dst, src, dsrc, op) {
    Memdraw.fillellipse(dst, p, radius, radius, 0, 2 * Math.PI, src, dsrc, op);
}

var drawchar = function(dst, p, src, sp, bg, bp, font, fc, op) {
    var r = {
        min: {
            x: p.x + fc.left,
            y: p.y - (font.ascent - fc.r.min.y)
        },
        max: {
            x: (p.x + fc.left) + (fc.r.max.x - fc.r.min.x),
            y: (p.y - (font.ascent - fc.r.min.y)) + (fc.r.max.y - fc.r.min.y)
        }
    }
    var sp1 = {
        x: sp.x + fc.left,
        y: sp.y + fc.r.min.y
    }

    if (bg) {
        memdraw(dst, r, bg, bp, undefined, undefined, op);
    }
    memdraw(dst, r, src, sp1, font, fc.r.min, op);
    p.x += fc.width;
    sp.x += fc.width;
    return p;
}

Memdraw = {
    line: function(dst, p0, p1, end0, end1, radius, src, sp, op) {
        var angle = icossin2(p1.y - p0.y, p1.x - p0.x);
        var dx = (angle.sin * (2 * radius + 1)) / 2;
        var dy = (angle.cos * (2 * radius + 1)) / 2;

        var q = {
            /* 1/2 is cargo-cult from /sys/src/libmemdraw/line.c ; why? */
            x: p0.x + 1 / 2 + angle.cos / 2,
            y: p0.y + 1 / 2 + angle.sin / 2
        }

        var points = [];
        var pp = 0;

        switch (end0 & 0x1F) {
            case Memdraw.End.disc:
                discend(p0, radius, dst, src, sp, op);
                /* fall through */
            case Memdraw.End.square:
            default:
                points[pp] = {
                    x: q.x - dx,
                    y: q.y + dy
                };
                ++pp;
                points[pp] = {
                    x: q.x + dx,
                    y: q.y - dy
                };
                ++pp;
                break;
            case Memdraw.End.arrow:
                arrowend(q, points, pp, end0, -angle.sin, -angle.cos, radius);
                this.fillpoly(dst, points.slice(0, 5), 0, src, sp, op);
                points[pp + 1] = points[pp + 4];
                pp += 2;
        }
        q = {
            x: p1.x + 1 / 2 + angle.cos / 2,
            y: p1.y + 1 / 2 + angle.sin / 2
        }

        switch (end1 & 0x1F) {
            case Memdraw.End.disc:
                discend(p1, radius, dst, src, sp, op);
                /* fall through */
            case Memdraw.End.square:
            default:
                points[pp] = {
                    x: q.x + dx,
                    y: q.y - dy
                };
                ++pp;
                points[pp] = {
                    x: q.x - dx,
                    y: q.y + dy
                };
                ++pp;
                break;
            case Memdraw.End.arrow:
                arrowend(q, points, pp, end1, angle.sin, angle.cos, radius);
                this.fillpoly(dst, points.slice(pp, pp + 5), 0, src, sp, op);
                points[pp + 1] = points[pp + 4];
                pp += 2;
        }
        /* XXX setting w incorrectly! */
        return this.fillpoly(dst, points.slice(0, pp), 0, src, sp, op);
    },
    /* XXX behaves incorrectly for incomplete (non 2pi) ellipses. */
    fillellipse: function(dst, c, horiz, vert, alpha, phi, src, sp, op) {
        var r, dxy;
        var mask;

        dxy = new Point(horiz, vert);
        r = new Rect(subpt(c, dxy), addpt(c, dxy));
        mask = new Draw9p.Image(-4, 0, Chan.fmts.GREY1, 0, r, r, 0x00000000);
        mask.ctx.beginPath();
        mask.ctx.ptranslate(subpt(c, r.min));
        mask.ctx.scale(horiz, vert);
        mask.ctx.arc(0, 0, 1, alpha, phi, true);
        mask.ctx.fillStyle = "white";
        mask.ctx.fill();

        memdraw(dst, r, src, sp, mask, r.min, op);
    },
    /* XXX ignores w (winding rule) */
    fillpoly: function(dst, vertices, w, src, sp, op) {
        var r;
        var mask;
        if (vertices.length < 1) {
            return;
        }
        r = new Rect(vertices[0], vertices[0]);
        for (var i = 0; i < vertices.length; ++i) {
            rcombinept(r, vertices[i]);
        }
        mask = new Draw9p.Image(-7, 0, Chan.fmts.GREY1, 0, r, r, 0x00000000);
        mask.ctx.fillStyle = "white";
        mask.ctx.beginPath();
        mask.ctx.pmoveTo(subpt(vertices[0], r.min));
        for (var i = 1; i < vertices.length; ++i) {
            mask.ctx.plineTo(subpt(vertices[i], r.min));
        }
        mask.ctx.plineTo(subpt(vertices[0], r.min));
        mask.ctx.fill();
        memdraw(dst, r, src, sp, mask, r.min, op);
        return;
    },
    poly: function(dst, points, end0, end1, radius, src, sp, op) {
        if (points.length < 2) {
            return;
        }
        for (var i = 1; i < points.length; ++i) {
            /* XXX calculate ends here; see C source. */
            /* XXX calculate change in sp; requires point operations. */
            this.line(dst, points[i - 1], points[i],
                Memdraw.End.disc, Memdraw.End.disc,
                radius, src, sp, op);
        }
    },
    load: function(dst, r, data, iscompressed) {
        return load(dst, r, data, iscompressed);
    },
    string: function(dst, src, font, p, clipr, sp, bg, bp, index, op) {
        for (var i = 0; i < index.length; ++i) {
            if (index[i] == 0 || index[i] >= font.nchar) {
                throw ("font cache index out of bounds");
            }
            drawchar(dst, p, src, sp, bg, bp, font, font.fchar[index[i]], op);
        }
    },
    Opdefs: {
        Clear: {
            key: 0,
            op: undefined
        },
        SinD: {
            key: 8,
            op: "source-in"
        },
        DinS: {
            key: 4,
            op: "destination-in"
        },
        SoutD: {
            key: 2,
            op: "source-out"
        },
        DoutS: {
            key: 1,
            op: "destination-out"
        },

        S: {
            key: 10,
            op: "copy"
        },
        /* SinD | SoutD */
        SoverD: {
            key: 11,
            op: "source-over"
        },
        /* SinD | SoutD | DoutS */
        SatopD: {
            key: 9,
            op: "source-atop"
        },
        /* SinD | DoutS */
        SxorD: {
            key: 3,
            op: "xor"
        },
        /* SoutD | DoutS */

        D: {
            key: 5,
            op: undefined
        },
        /* DinS | DoutS */
        DoverS: {
            key: 7,
            op: "destination-over"
        },
        /* DinS | DoutS | SoutD */
        DatopS: {
            key: 6,
            op: "destination-atop"
        },
        /* DinS | SoutD */
        DxorS: {
            key: 3,
            op: "xor"
        },
        /* DoutS | SoutD */

        /* Ncomp: 12 */
    }
}

Memdraw.Ops = (function(o) {
    var ops = [];
    for (var k in o) {
        ops[o[k].key] = o[k].op;
    }
    return ops;
})(Memdraw.Opdefs);

Memdraw.End = {
    square: 0,
    disc: 1,
    arrow: 2,
    mask: 0x1F
}

Memdraw.ARROW = function(a, b, c) {
    return Memdraw.End.arrow | (a << 5) | (b << 14) | (c << 23);
}