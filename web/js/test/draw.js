Testdraw = {};

Testdraw.line = function() {
    var root = Draw9p.RootImage();

    var src = new Draw9p.Image(0, "r8g8b8", 1, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        },
        0x00FF00FF);

    var img = new Draw9p.Image(0, "r8g8b8", 0, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 100,
                y: 100
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 100,
                y: 100
            }
        },
        0xFF00FFFF);

    Memdraw.line(img, {
        x: 45,
        y: 15
    }, {
        x: 0,
        y: 100
    }, 0, 0, 10, src, {
        x: 0,
        y: 0
    }, 0);

    Memdraw.line(root, {
        x: 15,
        y: 15
    }, {
        x: 100,
        y: 100
    }, 0, 0, 10, img, {
        x: 0,
        y: 0
    }, 0);

    var cap = Memdraw.ARROW(25, 25, 10);
    Memdraw.line(root, {
        x: 100,
        y: 15
    }, {
        x: 200,
        y: 200
    }, cap, cap, 10, src, {
        x: 0,
        y: 0
    }, 0);
    Memdraw.line(root, {
            x: 200,
            y: 15
        }, {
            x: 400,
            y: 200
        },
        Memdraw.End.disc, Memdraw.End.disc, 15, src, {
            x: 0,
            y: 0
        }, 0);
}

Testdraw.fillpoly = function() {
    var root = Draw9p.RootImage();

    var src = new Draw9p.Image(0, Chan.fmts.CMAP8, 1,
        new Rect(new Point(0, 0), new Point(1, 1)),
        new Rect(new Point(0, 0), new Point(1048576, 1048576)),
        0x00FF00FF);

    var pts = [{
            x: 20,
            y: 20
        },
        {
            x: 20,
            y: 400
        },
        {
            x: 400,
            y: 400
        },
        {
            x: 20,
            y: 20
        }
    ]

    Memdraw.fillpoly(root, pts, 0, src, {
        x: 0,
        y: 0
    }, 11);
}

Testdraw.poly = function() {
    var root = Draw9p.RootImage();

    var src = new Draw9p.Image(0, "r8g8b8", 1, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        },
        0x00FF00FF);

    var pts = [{
            x: 20,
            y: 20
        },
        {
            x: 20,
            y: 200
        },
        {
            x: 200,
            y: 200
        },
        {
            x: 200,
            y: 20
        },
        {
            x: 20,
            y: 20
        }
    ];

    Memdraw.poly(root, pts, 0, 0, 15, src, {
        x: 0,
        y: 0
    }, 0);
}

/* XXX Doesn't work, and would fail if it did. */
Testdraw.mask = function() {
    var root = Draw9p.RootImage();

    var alpha = new Draw9p.Image(0, "r8g8b8a8", 1, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        },
        0x000000FF);

    var red = new Draw9p.Image(0, "r8g8b8a8", 1, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        },
        0xFF0000FF);

    var mask = new Draw9p.Image(0, "r8g8b8a8", 0, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 100,
                y: 100
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 100,
                y: 100
            }
        },
        0x000000FF);

    Memdraw.line(mask, {
            x: 10,
            y: 10
        }, {
            x: 90,
            y: 90
        },
        0, 0, 10, alpha, {
            x: 0,
            y: 0
        }, 0);

    Memdraw.drawmasked(root, mask.clipr, red, {
            x: 0,
            y: 0
        },
        mask, {
            x: 0,
            y: 0
        }, 0);
}

Testdraw.ellipse = function() {
    var root = Draw9p.RootImage();

    var src = new Draw9p.Image(0, "r8g8b8", 1, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1,
                y: 1
            }
        }, {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: 1024,
                y: 1024
            }
        },
        0x44AA77FF);

    Memdraw.fillellipse(root, {
            x: 100,
            y: 100
        },
        75, 25, 0, 2 * Math.PI, src, {
            x: 0,
            y: 0
        }, 11);
}