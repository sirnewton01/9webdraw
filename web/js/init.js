function elem(name) {
    return document.getElementById(name);
}

function addevent(elem, evt, handler) {
    elem.addEventListener(evt, handler, false);
}

/* this should not be necessary, but */
/* addevent does not seem to let me */
/* keep the F3 key event from propagating */
/* on Firefox 20. */
function setevent(elem, evt, handler) {
    elem["on" + evt] = handler;
}

var basetime;
var cons;
var mouse;
var settings;
var ninep;

window.onload = function() {
    var wsurl = Socket.wsurl(window.location.toString());
    var webdraw = elem("webdraw");
    var cover = elem("cover");

    basetime = Date.now();
    cons = new Cons();
    mouse = new Mouse(elem("cursor"));
    settings = new Settings();
    ninep = new NineP(wsurl, Draw9p, cons);

    /* XXX Draw9p should be instantiated and have a constructor. */
    Draw9p.rootcanvas = webdraw;
    Draw9p.rootsz = {
        w: webdraw.width,
        h: webdraw.height
    };
    Draw9p.imgnames["webdraw"] = Draw9p.RootImage();
    Draw9p.label = "webdraw".toUTF8Array();

    setevent(cover, "mousedown", function(e) {
        return mouse.handlebutton(e, 1);
    });
    setevent(cover, "mouseup", function(e) {
        return mouse.handlebutton(e, 0);
    });
    setevent(cover, "mousemove", function(e) {
        return mouse.handlemouse(e);
    });
    setevent(cover, "mouseenter", function(e) {
        return mouse.handlemouse(e);
    });
    setevent(cover, "mouseleave", function(e) {
        return mouse.handlemouse(e);
    });
    setevent(window, "keydown", function(e) {
        return cons.handlekeys(e, cons.kbd.down);
    });
    setevent(window, "keypress", function(e) {
        return cons.handlekeys(e, cons.kbd.press);
    });
    setevent(window, "keyup", function(e) {
        return cons.handlekeys(e, cons.kbd.up);
    });
    setevent(window, "wheel", function(e) {
        return cons.scroll(e.deltaY);
    });
    setevent(cover, "contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    setevent(cover, "dblclick", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (
            document.pointerLockElement !== cover &&
            document.mozPointerLockElement !== cover &&
            document.webkitPointerLockElement !== cover
        ) {
            cover.requestPointerLock =
                cover.requestPointerLock ||
                cover.mozRequestPointerLock ||
                cover.webkitRequestPointerLock;
            cover.requestPointerLock();
            return false;
        } else {
            return false;
        }
    });
}