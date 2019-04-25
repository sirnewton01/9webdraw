var decompress = function(data, w, h, bpl, cdata) {
    var cdoff = 0; /* cdata offset */
    var doff = 0; /* data offset */
    var odoff = 0; /* offset data offset */
    var c, cnt;
    var offs, offlen;

    for (;;) {
        if (doff >= data.length) {
            return cdoff;
        }
        if (cdoff >= cdata.length) {
            throw ("buffer too small");
        }

        c = cdata[cdoff++];
        if (c >= 128) {
            for (cnt = c - 128 + 1; cnt > 0; --cnt) {
                data[doff++] = cdata[cdoff++];
            }
        } else {
            offs = cdata[cdoff++] + ((c & 3) << 8) + 1;
            odoff = doff - offs;
            for (cnt = (c >> 2) + 3; cnt > 0; --cnt) {
                data[doff++] = data[odoff++];
            }
        }
    }
}

var bytesperline = function(w, depth) {
    var bytesperpix = Math.ceil(depth / 8);
    var pixperbyte = Math.floor(8 / depth);

    if (depth < 8) {
        return Math.ceil(w / pixperbyte);
    } else {
        return w * bytesperpix;
    }
}

var getpixel = function(data, depth, w, h, line, col) {
    var bytesperpix = Math.ceil(depth / 8);
    var pixperbyte = Math.floor(8 / depth);
    var bytesperline = Math.ceil((w * pixperbyte) / 8);
    var pixordinbyte = col % pixperbyte;

    if (depth < 8) {
        bytesperline = Math.ceil(w / pixperbyte);
        var offset = (line * bytesperline) + Math.floor((col * pixperbyte) / 8);
    } else {
        bytesperline = w * bytesperpix;
        var offset = (line * bytesperline) + (col * bytesperpix);
    }

    if (line > h) {
        throw ("pixel line index out of bounds");
    }
    if (col > w) {
        throw ("pixel column index out of bounds");
    }

    if (depth < 8) {
        /* XXX remember to shift the whole mess back down! */
        var mask = (1 << depth) - 1;
        return (data[offset] >> (depth * pixordinbyte)) & mask;
    } else {
        /* XXX THIS IS WRONG! */
        /* possibly: for(var i = bpp; i > 0; --i) */
        var pixel = 0;
        for (var i = 0; i < bytesperpix; ++i) {
            pixel |= data[offset + i] << (8 * i);
        }
        return pixel;
    }
}

var canvaspos = function(w, h, line, col) {
    return ((line * w) + col) * 4;
}

var scalepixel = function(pixel, from, to) {
    if (from < to) {
        return Math.floor((pixel * ((1 << to) - 1)) / ((1 << from) - 1));
    } else {
        return pixel >> (from - to);
    }
}

var loader = {
    generic: function(arr, w, h, chan, data) {
        var depth = Chan.chantodepth(chan);

        for (var line = 0; line < h; ++line) {
            for (var col = 0; col < w; ++col) {
                var pixel = getpixel(data, depth, w, h, line, col);
                var cp = canvaspos(w, h, line, col);
                arr[cp + 3] = 0xFF; /* Default to 100% alpha. */
                for (var c = chan; c; c >>= 8) {
                    var nbits = Chan.NBITS(c);
                    var px = pixel & ((1 << nbits) - 1);
                    var spx = scalepixel(px, nbits, 8);
                    switch (Chan.TYPE(c)) {
                        case Chan.chans.CRed:
                            arr[cp + 0] = spx;
                            break;
                        case Chan.chans.CGreen:
                            arr[cp + 1] = spx;
                            break;
                        case Chan.chans.CBlue:
                            arr[cp + 2] = spx;
                            break;
                        case Chan.chans.CGrey:
                            arr[cp + 0] = spx;
                            arr[cp + 1] = spx;
                            arr[cp + 2] = spx;
                            break;
                        case Chan.chans.CAlpha:
                            arr[cp + 3] = spx;
                            break;
                        case Chan.chans.CMap:
                            throw ("color format not supported");
                            break;
                        case Chan.chans.CIgnore:
                            break;
                        default:
                            throw ("unknown color format");
                    }
                    pixel >>= nbits;
                }
            }
        }
        return arr;
    },
    grey: function(canvas, w, h, chan, data) {
        if ((Chan.TYPE(chan) != Chan.chans.CGrey) || (chan >> 8)) {
            throw ("not a grey-only image");
        }
        var depth = Chan.NBITS(chan);
        var pixperbyte = Math.floor(8 / depth);
        var bytesperline = Math.ceil(w / pixperbyte);

        var cp = 0; /* canvas offset */
        var dp = 0; /* data offset */

        for (var line = 0; line < h; ++line, dp += bytesperline) {
            for (var b = 0; b < bytesperline; ++b) {
                for (var p = 1; p <= pixperbyte; ++p) {
                    if ((b * pixperbyte) + p > w) break;

                    var px = (data[dp + b] >> ((pixperbyte - p) * depth)) & ((1 << depth) - 1);
                    var spx = scalepixel(px, depth, 8);
                    canvas[cp + 0] = spx;
                    canvas[cp + 1] = spx;
                    canvas[cp + 2] = spx;
                    canvas[cp + 3] = 0xFF;
                    cp += 4;
                }
            }
        }
    },
    /* Should this scale other depths to CMAP8, or is that nonsensical? */
    cmap8: function(canvas, w, h, chan, data) {
        if (chan != Chan.fmts.CMAP8) {
            throw ("not an 8-bit color-mapped image");
        }
        var depth = Chan.chantodepth(chan);

        var cp = 0; /* canvas offset */

        for (var line = 0; line < h; ++line) {
            for (var col = 0; col < w; ++col) {
                var px = Cmap.cmap2rgb(data[line * w + col]);
                canvas[cp++] = (px >> 16) & 0xFF;
                canvas[cp++] = (px >> 8) & 0xFF;
                canvas[cp++] = (px >> 0) & 0xFF;
                canvas[cp++] = 0xFF;
            }
        }
    }
}

Memdraw.Load = function(canvas, w, h, chan, data, iscompressed) {
    var depth = Chan.chantodepth(chan);
    var bpl = Math.ceil((w * depth) / 8);
    var len;

    if (iscompressed) {
        var cdata = data;
        data = new Uint8Array(h * bpl);
        len = decompress(data, w, h, bpl, cdata);
    } else {
        len = bpl * h;
    }

    if (!(chan >> 8)) {
        switch (Chan.TYPE(chan)) {
            case Chan.chans.CGrey:
                loader.grey(canvas, w, h, chan, data);
                return len;
            case Chan.chans.CMap:
                if (Chan.NBITS(chan) == 8) {
                    loader.cmap8(canvas, w, h, chan, data);
                    return len;
                }
        }
    }

    loader.generic(canvas, w, h, chan, data);
    return len;
}