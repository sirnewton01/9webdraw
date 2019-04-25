NineP.Stat = function(stat) {
    for (var elem in stat) {
        this[elem] = stat[elem];
    }
}

NineP.Stat.fromWireStat = function(buf) {
    var size = NineP.GBIT16(buf.splice(0, 2));
    buf.splice(0, 6); /* type, dev */

    var proto = {
        qid: NineP.Qid.fromWireQid(buf.slice(0, 13)),
        mode: NineP.GBIT32(buf.slice(0, 4)),
        atime: NineP.GBIT32(buf.slice(0, 4)),
        mtime: NineP.GBIT32(buf.slice(0, 4)),
        length: NineP.GBIT64(buf.slice(0, 8)),
        name: NineP.getwirestring(buf),
        uid: NineP.getwirestring(buf),
        gid: NineP.getwirestring(buf),
        muid: NineP.getwirestring(buf)
    }

    /* XXX This is wasteful!  I just want to bless it with ``is-a''. */
    return new NineP.Stat(proto);
}

NineP.Stat.prototype = {
    qid: new NineP.Qid(0, 0, 0),
    mode: 0,
    atime: 0,
    mtime: 0,
    length: 0,
    name: "",
    uid: "",
    gid: "",
    muid: ""
}

NineP.Stat.prototype.toWireStat = function() {
    var stat = [];
    stat = stat.concat([0, 0]);
    stat = stat.concat([0, 0, 0, 0]);
    stat = stat.concat(this.qid.toWireQid());
    stat = stat.concat(NineP.PBIT32([], this.mode));
    stat = stat.concat(NineP.PBIT32([], this.atime));
    stat = stat.concat(NineP.PBIT32([], this.mtime));
    stat = stat.concat(NineP.PBIT64([], this.length));
    stat = stat.concat(NineP.mkwirestring(this.name));
    stat = stat.concat(NineP.mkwirestring(this.uid));
    stat = stat.concat(NineP.mkwirestring(this.gid));
    stat = stat.concat(NineP.mkwirestring(this.muid));

    stat = NineP.PBIT16([], stat.length).concat(stat);

    return stat;
}

NineP.Stat.prototype.toString = function() {
    return JSON.stringify(this);
}