String.prototype.toUTF8Array = function() {
    var arr = [];

    for (var i = 0; i < this.length; ++i) {
        var c = this.charCodeAt(i);

        /* Convert from UTF-16 to Unicode code point. */
        if ((c & 0xDC00) == 0xD800) {
            var lead = c;
            var tail = this.charCodeAt(++i);

            c = 0x10000 | ((lead & 0x3FF) << 10) | ((tail & 0x3FF));
        }

        /* Convert from code point to UTF-8. */
        if (c > 0x10000) {
            /* 4 bytes */
            arr.push(0xF0 | ((c & 0x1C0000) >> 18));
            arr.push(0x80 | ((c & 0x3F000) >> 12));
            arr.push(0x80 | ((c & 0xFC0) >> 6));
            arr.push(0x80 | ((c & 0x3F)));
        } else if (c > 0x0800) {
            /* 3 bytes */
            arr.push(0xE0 | ((c & 0xF000) >> 12));
            arr.push(0x80 | ((c & 0xFC0) >> 6));
            arr.push(0x80 | ((c & 0x3F)));
        } else if (c > 0x0080) {
            /* 2 bytes */
            arr.push(0xC0 | ((c & 0xFC0) >> 6));
            arr.push(0x80 | ((c & 0x3F)));
        } else {
            /* 1 byte */
            arr.push(0x00 | ((c & 0x7F)));
        }
    }

    return arr;
}

String.fromUTF8Array = function(arr) {
    var units = [];

    for (var i = 0; i < arr.length; ++i) {
        var codepoint = 0;

        /* Convert from UTF-8 to Unicode codepoint. */
        if ((arr[i] & 0x80) == 0) {
            /* one byte */
            codepoint = arr[i] & 0x7F;
        } else if ((arr[i] & 0xE0) == 0xC0) {
            /* two bytes */
            codepoint = (
                ((arr[i] & 0x1F) << 6) |
                ((arr[++i] & 0x3F))
            );
        } else if ((arr[i] & 0xF0) == 0xE0) {
            /* three bytes */
            codepoint = (
                ((arr[i] & 0x0F) << 12) |
                ((arr[++i] & 0x3F) << 6) |
                ((arr[++i] & 0x3F))
            );
        } else if ((arr[i] & 0xF8) == 0xF0) {
            /* four bytes */
            codepoint = (
                ((arr[i] & 0x07) << 18) |
                ((arr[++i] & 0x3F) << 12) |
                ((arr[++i] & 0x3F) << 6) |
                ((arr[++i] & 0x3F))
            );
        } else {
            /* five- and six- byte UTF-8 are now illegal. */
        }

        /* Convert from Unicode codepoint to UTF-16. */
        if (codepoint & 0x10000) {
            units.push(0xD800 | ((codepoint >> 10) & 0x3FF));
            units.push(0xDC00 | (codepoint & 0x3FF));
        } else {
            units.push(codepoint);
        }
    }
    return String.fromCharCode.apply(null, units);
}