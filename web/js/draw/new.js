Draw9p.readdrawnew = function(conn) {
    cons.log("readdrawnew");
    var sz = Draw9p.rootsz;
    var buf = [];

    buf = buf.concat(pad11(conn));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11("r8g8b8"));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11(sz.w));
    buf = buf.concat(pad11(sz.h));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11(0));
    buf = buf.concat(pad11(sz.w));
    buf = buf.concat(pad11(sz.h));

    return buf;
}