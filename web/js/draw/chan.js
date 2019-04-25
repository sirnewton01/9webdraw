var dc = function(type, nbits) {
    return ((type & 0xF) << 4) | (nbits & 0xF);
}
var c1 = function(a, b) {
    return dc(a, b);
}
var c2 = function(a, b, c, d) {
    return c1(a, b) << 8 | dc(c, d);
}
var c3 = function(a, b, c, d, e, f) {
    return c2(a, b, c, d) << 8 | dc(e, f);
}
var c4 = function(a, b, c, d, e, f, g, h) {
    return c3(a, b, c, d, e, f) << 8 | dc(g, h);
}

Chan = {
    NBITS: function(c) {
        return c & 0xF;
    },
    TYPE: function(c) {
        return (c >> 4) & 0xF;
    },
    channames: ['r', 'g', 'b', 'k', 'a', 'm', 'x'],
    chans: {
        CRed: 0,
        CGreen: 1,
        CBlue: 2,
        CGrey: 3,
        CAlpha: 4,
        CMap: 5,
        CIgnore: 6,
        NChan: 7
    },
    chantostr: function(cc) {
        var buf = [];
        var c, rc;

        if (chantodepth(cc) == 0) {
            return undefined;
        }

        rc = 0;
        for (c = cc; c; c >>= 8) {
            rc <<= 8;
            rc |= c & 0xFF;
        }

        for (c = rc; c; c >>= 8) {
            buf.push(this.channames[this.TYPE(c)]);
            buf.push(this.NBITS(c));
        }

        return buf.join("");
    },
    strtochan: function(s) {
        throw ("strtochan not implemented");
    },
    chantodepth: function(c) {
        var n;

        for (n = 0; c; c >>= 8) {
            if (this.TYPE(c) >= this.chans.NChan ||
                this.NBITS(c) > 8 ||
                this.NBITS(c) <= 0) {
                return 0;
            }
            n += this.NBITS(c);
        }
        if (n == 0 || (n > 8 && n % 8) || (n < 8 && 8 % n)) {
            return 0;
        }
        return n;
    }
}

Chan.fmts = (function(c) {
    with(c) {
        return {
            GREY1: c1(CGrey, 1),
            GREY2: c1(CGrey, 2),
            GREY4: c1(CGrey, 4),
            GREY8: c1(CGrey, 8),
            CMAP8: c1(CMap, 8),
            RGB15: c4(CIgnore, 1, CRed, 5, CGreen, 5, CBlue, 5),
            RGB16: c3(CRed, 5, CGreen, 6, CBlue, 5),
            RGB24: c3(CRed, 8, CGreen, 8, CBlue, 8),
            RGBA32: c4(CRed, 8, CGreen, 8, CBlue, 8, CAlpha, 8),
            ARGB32: c4(CAlpha, 8, CRed, 8, CGreen, 8, CBlue, 8),
            /* stupid VGAs */
            XRGB32: c4(CIgnore, 8, CRed, 8, CGreen, 8, CBlue, 8),
            BGR24: c3(CBlue, 8, CGreen, 8, CRed, 8),
            ABGR32: c4(CAlpha, 8, CBlue, 8, CGreen, 8, CRed, 8),
            XBGR32: c4(CIgnore, 8, CBlue, 8, CGreen, 8, CRed, 8),
        }
    }
}(Chan.chans))