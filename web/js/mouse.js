var mouse;

function Mouse(cursorelem) {
    var State = function(position, buttons) {
        this.position = position;
        this.buttons = buttons;
        this.buttonmodifier = 0;
        this.timestamp = Date.now() - basetime;
    }
    State.prototype.copy = function() {
        return new State(this.position, this.buttons);
    }
    State.prototype.toWireFormat = function() {
        var buf = "m".toUTF8Array();
        buf = buf.concat(pad11(this.position.x));
        buf = buf.concat(pad11(this.position.y));
        buf = buf.concat(pad11(this.buttons));
        buf = buf.concat(pad11(this.timestamp));
        return buf;
    }
    State.prototype.bound = function() {
        if (this.position.x > Draw9p.rootcanvas.width) {
            this.position.x = Draw9p.rootcanvas.width;
        }
        if (this.position.x < 0) {
            this.position.x = 0;
        }
        if (this.position.y > Draw9p.rootcanvas.height) {
            this.position.y = Draw9p.rootcanvas.height;
        }
        if (this.position.y < 0) {
            this.position.y = 0;
        }
    }

    this.states = {
        down: 1,
        up: 0
    };
    this.state = new State({
        x: 0,
        y: 0
    }, 0);

    this.usefkeys = true;
    this.callbacks = [];
    this.buf = [];

    this.handlefkeys = function(e, state) {
        switch (e.keyCode) {
            case 17:
                this.state.buttonmodifier = (this.state.buttonmodifier & 0x5) | (state << 1);
                break;
            case 91:
            case 224:
                this.state.buttonmodifier = (this.state.buttonmodifier & 0x3) | (state << 2);
                break;
        }

        if (!this.state.buttonmodifier) {
            this.state.buttonmodifier = 0x1;
        } else {
            this.state.buttonmodifier = (this.state.buttonmodifier & 0x6)
        }
    }

    this.handlebutton = function(e, state) {
        if (state) {
            this.state.buttons = this.state.buttonmodifier;
        } else {
            this.state.buttons = 0;
        }

        this.generatemovement(this.state);

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    this.handlemove = function(e) {
        this.state.position.x +=
            e.movementX ||
            e.mozMovementX ||
            e.webkitMovementX ||
            0;

        this.state.position.y +=
            e.movementY ||
            e.mozMovementY ||
            e.webkitMovementY ||
            0;

        this.state.bound();
        this.generatemovement(this.state);
        return false;
    }

    this.handlemouse = function(e) {
        // If we are pointer locked, we only get movements
        //  and not client relative positions. Delegate to
        //  handlemove for those.
        if (document.pointerLockElement) {
            return this.handlemove(e);
        }
        this.state.position.x = e.clientX - 20;
        this.state.position.y = e.clientY - 20;
        this.state.bound();
        this.generatemovement(this.state);
        return false;
    }

    this.handlewarp = function(data) {
        var ai = new ArrayIterator(data);

        if (ai.getChar() != "m".charCodeAt(0)) {
            throw ("bad mouse write");
        }
        var x = ai.strtoul();
        var y = ai.strtoul();

        this.state.position.x = x;
        this.state.position.y = y;
        this.state.bound();

        this.generatemovement(this.state);
        return data.length;
    }

    this.generatemovement = function(state) {
        //cons.write("m " + state.position.x + ", " + state.position.y +
        //	" : " + state.buttons);
        this.cursor.goto(this.state.position);
        this.buf.push(this.state.copy());
        this.flushcallbacks();
    }

    this.addcallback = function(callback) {
        this.callbacks.push(callback);
        this.flushcallbacks();
    }

    this.flushcallbacks = function() {
        while (this.callbacks.length > 0 && this.buf.length > 0) {
            this.callbacks.shift().read(this.buf.shift().toWireFormat());
        }
    }

    this.cursor = {
        arrow: [
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,

            0xFF, 0xFF, 0x80, 0x01, 0x80, 0x02, 0x80, 0x0C,
            0x80, 0x10, 0x80, 0x10, 0x80, 0x08, 0x80, 0x04,
            0x80, 0x02, 0x80, 0x01, 0x80, 0x02, 0x8C, 0x04,
            0x92, 0x08, 0x91, 0x10, 0xA0, 0xA0, 0xC0, 0x40,

            0x00, 0x00, 0x7F, 0xFE, 0x7F, 0xFC, 0x7F, 0xF0,
            0x7F, 0xE0, 0x7F, 0xE0, 0x7F, 0xF0, 0x7F, 0xF8,
            0x7F, 0xFC, 0x7F, 0xFE, 0x7F, 0xFC, 0x73, 0xF8,
            0x61, 0xF0, 0x60, 0xE0, 0x40, 0x40, 0x00, 0x00,
        ],
        img: (function(elem) {
            var c = elem;
            c.width = c.height = 16;
            return {
                canvas: c,
                ctx: c.getContext("2d"),
                clear: function() {
                    this.ctx.clearRect(0, 0, 16, 16);
                },
                fill: function(data, px) {
                    var id = this.ctx.getImageData(0, 0, 16, 16);
                    var cp = 0; /* canvas pointer */
                    for (var i = 0; i < 32; ++i) {
                        for (var b = 7; b >= 0; --b) {
                            var p = (data[i] >> b) & 1;
                            if (p) {
                                id.data[cp++] = px;
                                id.data[cp++] = px;
                                id.data[cp++] = px;
                                id.data[cp++] = 0xFF;
                            } else {
                                cp += 4;
                            }
                        }
                    }
                    this.ctx.putImageData(id, 0, 0);
                }
            };
        })(cursorelem),
        offset: {
            x: 0,
            y: 0
        },
        write: function(data) {
            if (data.length != 72) {
                data = this.arrow;
            }
            this.img.clear();
            var ai = new ArrayIterator(data);
            this.offset = ai.getPoint();
            this.img.fill(ai.getBytes(32), 0xFF);
            this.img.fill(ai.getBytes(32), 0x00);
            return data.length;
        },
        goto: function(pos) {
            var x = pos.x - this.offset.x;
            var y = pos.y - this.offset.y;
            this.img.canvas.style.left = x + "px";
            this.img.canvas.style.top = y + "px";
        }
    }
    this.cursor.write([]);

}