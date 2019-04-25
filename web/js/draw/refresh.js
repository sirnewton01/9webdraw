Draw9p.readdrawrefresh = function(dd, offset, callback) {
    cons.log("readdrawrefresh");

    var conn = this.conns[dd.drawdir];
    if (conn == undefined) {
        return callback.error("invalid draw connection");
    }

    /* XXX This breaks if multiple reads are outstanding on the */
    /* refresh file!  Should we permit this and use some sort of */
    /* array of refreshcallbacks, or should we be setting (and */
    /* obeying!) the exclusive-use bit on the relevant [qf]id? */
    if (conn.refreshcallback != undefined) {

        return callback.error("multiple reads are not allowed");
    }

    conn.refreshcallback = callback;
}