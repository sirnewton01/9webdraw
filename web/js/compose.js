/* See /sys/src/9/port/latin1.c */

function Compose(parent) {
    var mode = false;
    var buf = [];

    var handle = function() {
        if (buf.length < 2) return;
        if (buf[0] == "X") {
            if (buf.length < 5) return;
            handleX();
        } else {
            for (var k in Composetab) {
                if (buf[0] == k.charAt(0)) {
                    if (k.length == 1)
                        var c = buf[1];
                    else if (k.charAt(1) != buf[1])
                        continue;
                    else if (buf.length < 3)
                        return;
                    else
                        var c = buf[2];
                    /* parent.take so[si.find(c)] */
                    var i = Composetab[k].from.indexOf(c);
                    if (i < 0)
                        return reset();
                    else {
                        parent.take(Composetab[k].to[i]);
                        return reset();
                    }
                }
            }
            return reset();
        }
    }

    var handleX = function() {
        var xdigits = "0123456789ABCDEF";
        var i, x, c = 0;

        if (buf.length != 5) return reset();

        for (i = 1; i < 5; ++i) {
            x = xdigits.indexOf(buf[i].toUpperCase());
            if (x < 0) return reset();
            c |= x << ((4 - i) * 4);
        }
        parent.take(String.fromCharCode(c));
    }

    this.set = function() {
        mode = true;
    }

    /* XXX Why can't I call ``this.reset()'' directly? */
    var reset = function() {
        mode = false;
        buf = [];
    }
    this.reset = reset;

    this.getmode = function() {
        return mode;
    }

    this.push = function(c) {
        if (mode) {
            buf.push(c);
            handle();
        } else {
            throw ("Not in compose mode!");
        }
    }
}