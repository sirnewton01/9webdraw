NineP.QTDIR = 0x80;
NineP.QTAPPEND = 0x40;
NineP.QTEXCL = 0x20;
NineP.QTMOUNT = 0x10;
NineP.QTAUTH = 0x08;
NineP.QTTMP = 0x04;
NineP.QTFILE = 0x00;

NineP.DMDIR = 0x80000000;
NineP.DMAPPEND = 0x40000000;
NineP.DMEXCL = 0x20000000;
NineP.DMTMP = 0x04000000;

NineP.Qid = function(path, vers, type, callback) {
    this.path = path;
    this.vers = vers;
    this.type = type;
    this.callback = callback;
}

NineP.Qid.prototype.toString = function() {
    return "{path: " + this.path + "; vers: " + this.vers + "; type: " + this.type + ";}";
}

NineP.Qid.prototype.toWireQid = function() {
    var buf = [];
    buf = buf.concat(NineP.PBIT8([], this.type));
    buf = buf.concat(NineP.PBIT32([], this.vers));
    buf = buf.concat(NineP.PBIT64([], this.path));
    return buf;
}