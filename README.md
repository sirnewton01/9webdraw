# 9webdraw

9webdraw is a Web [draw(3)][man3draw] server for Plan 9, using
the HTML5 <canvas> element. This will allow anyone with a web
browser to connect to your server and have what resembles a
draw terminal.

NOTE: This is highly experimental and may not work very well at this stage.

Roadmap:

* Make it work for most built-in applications and rio
* Stabilize
* Enhance performance
* Add some form of authentication (probably just basic)
* Create a file transfer (in and out) part of the filesystem
* Add fullscreen mode
* Add sound
* Create a protocol for rendering 3D graphics and video

## Prerequisites
* [Plan 9][plan9] ( or [9 Front](9front) ), of course!
* The [Weebsocket][weebsocket] 9P-over-WebSocket bridge.
    + Included in [9atom][9atom]
* A modern web browser supporting:
    + Binary-mode WebSockets
    + HTML5 Canvas
    + Pointer Lock

## Building

    % mk install
will install the web application to `/usr/web/9wd/`.

Note that on 9front you may need to copy latin1.h from
the bell labs distribution to your /sys/src/9/port so that
it will compile.

[man3draw]: https://9p.io/magic/man2html/3/draw
[plan9]: https://9p.io/plan9/
[9front]: http://9front.org
[weebsocket]: https://bitbucket.org/dhoskin/weebsocket/
[9atom]: http://9atom.org/

## Running

    % ip/httpd/httpd -w /usr/web/9wd

Then connect with your web browser to http://<servername>/9wd/9wd.html
If you are running in a VM you may need to forward the port 80 to something
you can connect.

## Using

By default, the weebsocket server will run acme, which mostly works.
You can try running rio by recompiiling weebsocket to launch it
instead. Note that rio is not currently working very well.

You can use the usual gestures within the canvas. Lock your cursor into
the canvas by double-clicking on it. The scroll wheel sends the scroll
events.

## Debugging

Debugging is accomplished using the web browser console. Note that each
/dev/draw operation is logged there along with links to the DOM canvas
objects. The canvas objects are mostly hidden using a style at the top of
the HTML. You can modify ```display: none;``` to ```display: block;``` so
you can see the images and the changes made to them at the bottom of the
page.

