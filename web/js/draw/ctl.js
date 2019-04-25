var mka11 = function(padder) {
    var buffer = [];
    return function(data) {
        return buffer = buffer.concat(padder(data));
    }
}

Draw9p.readdrawctl = function(fid, offset) {
    cons.log("readdrawctl");
    var dd = this.drawdir(fid.qid.path);

    var conn = this.conns[dd.drawdir];
    if (conn == undefined) {
        throw ("invalid draw connection");
    }
    var img = conn.imgs[conn.imgid];
    if (img == undefined) {
        throw ("invalid image");
    }

    if (offset == 0) {
        var a11 = mka11(pad11);
        a11(conn.id);
        a11(conn.imgid);
        a11(img.chan);
        a11(0); /* what is this? */
        a11(img.r.min.x);
        a11(img.r.min.y);
        a11(img.r.max.x);
        a11(img.r.max.y);
        a11(img.clipr.min.x);
        a11(img.clipr.min.y);
        a11(img.clipr.max.x);
        return (a11(img.clipr.max.y));
    } else {
        return [];
    }
}

Draw9p.writedrawctl = function(connid, offset, data) {
    cons.log("writedrawctl");
    var conn = this.conns[connid];
    if (conn == undefined) {
        throw ("invalid draw connection");
    }

    conn.imgid = (new ArrayIterator(data)).getLong();
}