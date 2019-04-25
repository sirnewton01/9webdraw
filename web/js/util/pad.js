pad11 = function(x) {
    var buf = [];
    var s = String(x);
    var i;

    //do{
    //	buf[i] = Math.floor(x % 10);
    //	i += 1;
    //}while(x = Math.floor(x / 10));

    for (i = 0; i < 11 - s.length; ++i) {
        buf[i] = " ".charCodeAt(0);
    }

    for (i; i < 11; ++i) {
        buf[i] = s.charCodeAt(i - (11 - s.length));
    }

    buf[11] = " ".charCodeAt(0);
    return buf;
}