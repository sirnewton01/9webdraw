NineP.Fid = function(fid, qid) {
    this.fid = fid;
    this.qid = qid;
}

NineP.Fid.prototype.toString = function() {
    return "{ fid: " + this.fid + " qid: " + this.qid + " }";
}