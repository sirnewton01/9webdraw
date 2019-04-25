Draw9p.Screen = function(id, backimg, fillimg, public) {
    this.id = id;
    this.public = public;
    this.backimg = backimg;
    this.fillimg = fillimg;
    drawmasked(backimg, backimg.r, fillimg, fillimg.r.min, undefined, undefined, Memdraw.Opdefs.SoverD.key);
    this.dirty = true;
    this.imgs = [];
    console.log("New screen:", this.id, this);
    /* Memdraw.draw(this.backimg, this.fillimg); */
    this.frontmost = undefined;
    this.rearmost = undefined;
}

Draw9p.Screen.prototype.repaint = function() {
    var i;

    return "repaint disabled";

    if (this.dirty == true) {
        this.dirty = false;
    } else {
        //console.log("Screen is not dirty:", this.id);
        //return;
    }

    console.log("Redrawing screen:", this.id);

    drawmasked(this.backimg, this.backimg.r, this.fillimg, this.fillimg.r.min, undefined, undefined, Memdraw.Opdefs.SoverD.key);
    for (i in this.imgs) {
        console.log("Redrawing image on screen:", i.canvas);
        //memlexpose(this.imgs[i], this.imgs[i].r);
        //rectsubpt(this.imgs[i].r, this.imgs[i].scrmin),
        /*drawmasked(this.backimg, this.imgs[i].r,
        	this.imgs[i], this.imgs[i].r.min,
        	undefined, undefined,
        	Memdraw.Opdefs.SoverD.key);*/
    }
}