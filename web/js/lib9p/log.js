NineP.Log = function(cons) {
    this.cons = cons;
}

NineP.Log.prototype.txt = function(s) {
    this.cons.log(s);
}

NineP.Log.prototype.buf = function(s) {
    //this.cons.log(s);
}