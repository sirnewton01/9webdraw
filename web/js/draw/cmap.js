/* I don't understand what's going on here. */
/* Cribbed from /sys/src/libdraw/rgb.c */

Cmap = {
    rbg2cmap: function(red, green, blue) {
        var i, r, g, b, sq;
        var rgb;
        var best, bestq;

        best = 0;
        bestsq = 0x7FFFFFFF;
        for (i = 0; i < 256; i++) {
            rgb = cmap2rgb(i);
            r = (rgb >> 16) & 0xFF;
            g = (rgb >> 8) & 0xFF;
            b = (rgb >> 0) & 0xFF;
            sq = (r - cr) * (r - cr) + (g - cg) * (g - cg) + (b - cb) * (b - cb);
            if (sq < bestq) {
                bestq = sq;
                best = i;
            }
        }
        return best;
    },
    cmap2rgb: function(c) {
        var j, num, den, r, g, b, v, rgb;

        r = c >> 6;
        v = (c >> 4) & 3;
        j = (c - v + r) & 15;
        g = j >> 2;
        b = j & 3;
        den = r;
        if (g > den) {
            den = g;
        }
        if (b > den) {
            den = b;
        }
        if (den == 0) {
            v *= 17;
            rgb = (v << 16) | (v << 8) | v;
        } else {
            num = 17 * (4 * den + v);
            rgb = (Math.floor(r * num / den) << 16) |
                (Math.floor(g * num / den) << 8) |
                Math.floor(b * num / den);
        }
        return rgb;
    },
    cmap2rgba: function(c) {
        return (this.cmap2rgb(c) << 8) | 0xFF;
    }
}