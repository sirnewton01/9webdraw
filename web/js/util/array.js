function ArrayIterator(array) {
    this.array = array;
    this.index = 0;
}

ArrayIterator.prototype.getChar = function() {
    if (this.array.length < this.index + 1) {
        throw ("array too short");
    }
    return ((this.array[this.index++] & 0xFF) << 0);
}

ArrayIterator.prototype.getShort = function() {
    if (this.array.length < this.index + 2) {
        throw ("array too short");
    }
    return (
        ((this.array[this.index++] & 0xFF) << 0) |
        ((this.array[this.index++] & 0xFF) << 8)
    );
}

ArrayIterator.prototype.getLong = function() {
    if (this.array.length < this.index + 4) {
        throw ("array too short");
    }
    return (
        ((this.array[this.index++] & 0xFF) << 0) |
        ((this.array[this.index++] & 0xFF) << 8) |
        ((this.array[this.index++] & 0xFF) << 16) |
        ((this.array[this.index++] & 0xFF) << 24)
    );
}

ArrayIterator.prototype.getBytes = function(bytes) {
    if (this.array.length < this.index + bytes) {
        throw ("array too short");
    }
    var begin = this.index;
    this.index += bytes;
    return this.array.slice(begin, this.index);
}

ArrayIterator.prototype.peekBytes = function(bytes) {
    if (this.array.length < this.index + bytes) {
        throw ("array too short");
    }
    var begin = this.index;
    var end = begin + bytes;
    return this.array.slice(begin, end);
}

ArrayIterator.prototype.advanceBytes = function(bytes) {
    if (this.array.length < this.index + bytes) {
        throw ("array too short");
    }
    this.index += bytes;
}

ArrayIterator.prototype.getRemainingBytes = function() {
    return this.getBytes(this.array.length - this.index);
}

ArrayIterator.prototype.peekRemainingBytes = function() {
    return this.peekBytes(this.array.length - this.index);
}

ArrayIterator.prototype.hasRemainingBytes = function() {
    return this.index < this.array.length;
}

ArrayIterator.prototype.getPoint = function() {
    var that = this;
    return new Point(
        that.getLong(),
        that.getLong()
    );
}

ArrayIterator.prototype.getRect = function() {
    var that = this;
    return new Rect(
        that.getPoint(),
        that.getPoint()
    );
}

ArrayIterator.prototype.strtoul = function() {
    var spc = " ".charCodeAt(0);
    var oh = "0".charCodeAt(0);
    var nine = "9".charCodeAt(0);
    var x = 0;

    for (; this.index < this.array.length; ++this.index) {
        if (this.array[this.index] != spc)
            break;
    }
    for (; this.index < this.array.length; ++this.index) {
        if (this.array[this.index] >= oh && this.array[this.index] <= nine)
            x = (x * 10) + (this.array[this.index] - oh);
        else
            break;
    }
    return x;
}