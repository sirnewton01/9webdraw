NineP = function(path, callbacks, cons){
	var that = this;
	this.socket = new Socket(path, function(e){that.rawpktin(e);});

	this.maxbufsz = 32768;
	this.buffer = [];
	this.fids = [];

	this.local = callbacks;
	this.log = new NineP.Log(cons);
};

NineP.NOTAG = (~0) & 0xFFFF;

NineP.OREAD = 0;
NineP.OWRITE = 1;
NineP.ORDWR = 2;
NineP.OEXEC = 3;
NineP.ORCLOSE = 0x40;

NineP.packets = {
	Tversion:	100,
	Rversion:	101,
	Tauth:	102,
	Rauth:	103,
	Tattach:	104,
	Rattach:	105,
	Terror:	106,
	Rerror:	107,
	Tflush:	108,
	Rflush:	109,
	Twalk:	110,
	Rwalk:	111,
	Topen:	112,
	Ropen:	113,
	Tcreate:	114,
	Rcreate:	115,
	Tread:	116,
	Rread:	117,
	Twrite:	118,
	Rwrite:	119,
	Tclunk:	120,
	Rclunk:	121,
	Tremove:	122,
	Rremove:	123,
	Tstat:	124,
	Rstat:	125,
	Twstat:	126,
	Rwstat:	127,
	Tmax:	128
}

NineP.GBIT8 = function(p){ return (p[0]); };
NineP.GBIT16 = function(p){ return (p[0])|(p[1]<<8); };
NineP.GBIT32 = function(p){ return (p[0])|(p[1]<<8)|(p[2]<<16)|(p[3]<<24); };
/* XXX Javascript will do unpleasant things to integers over 32 bits! */
NineP.GBIT64 = function(p){
	/* throw("JAVASCRIPT CANNOT INTO INTEGERS!"); */
	return (p[0]) | (p[1]<<8) | (p[2]<<16) | (p[3]<<24) |
		(p[4]<<32) | (p[5]<<40) | (p[6]<<48) | (p[7]<<56);
};
NineP.PBIT8 = function(p,v){
	p[0] = (v)&0xFF;
	return p;
};
NineP.PBIT16 = function(p,v){
	p[0] = (v)&0xFF;
	p[1] = (v>>8)&0xFF;
	return p;
};
NineP.PBIT32 = function(p,v){
	p[0] = (v)&0xFF;
	p[1] = (v>>8)&0xFF;
	p[2] = (v>>16)&0xFF;
	p[3] = (v>>24)&0xFF;
	return p;
}
/* XXX Javascript will do unpleasant things to integers over 32 bits! */
NineP.PBIT64 = function(p,v){
	p[0] = (v) & 0xFF;
	p[1] = (v>>8) & 0xFF;
	p[2] = (v>>16) & 0xFF;
	p[3] = (v>>24) & 0xFF;
	p[4] = (v>>32) & 0xFF;
	p[5] = (v>>40) & 0xFF;
	p[6] = (v>>48) & 0xFF;
	p[7] = (v>>56) & 0xFF;
	return p;
};

NineP.getpktsize = function(buf){ return NineP.GBIT32(buf.slice(0,4)); };
NineP.getpkttype = function(buf){ return buf[4]; };
NineP.getpkttag = function(buf){ return buf.slice(5, 7); };

NineP.mkwirebuf = function(buf){
	return NineP.PBIT16([], buf.length).concat(buf);
}

NineP.mkwirestring = function(str){
	var arr = str.toUTF8Array();
	var len = NineP.PBIT16([], arr.length);
	arr = len.concat(arr);
	return arr;
}

NineP.getwirestring = function(pkt){
	var len = NineP.GBIT16(pkt.splice(0,2));
	return String.fromUTF8Array(pkt.splice(0,len));
}

NineP.prototype.rawpktin = function(pkt){
	var pktarr = new Uint8Array(pkt);

	this.buffer.push.apply(this.buffer, pktarr);
	this.log.buf(this.buffer);

	for(;;){
		if(this.buffer.length < 4){
			break;
		}
	
		var size = NineP.getpktsize(this.buffer);
	
		if(this.buffer.length >= size){
			this.processpkt(this.buffer.splice(0, size));
		}else{
			break;
		}
	}
}

NineP.prototype.processpkt = function(pkt){
	var tag = NineP.getpkttag(pkt);
	switch(NineP.getpkttype(pkt)){
		case NineP.packets.Tversion:
			return this.Rversion(pkt, tag);
		case NineP.packets.Tauth:
			return this.Rerror(tag, "no authentication required");
		case NineP.packets.Tattach:
			return this.Tattach(pkt, tag);
		case NineP.packets.Terror:
			return this.Rerror(tag, "terror");
		case NineP.packets.Tflush:
			return this.Tflush(pkt, tag);
		case NineP.packets.Twalk:
			return this.Twalk(pkt, tag);
		case NineP.packets.Topen:
			return this.Topen(pkt, tag);
		case NineP.packets.Tcreate:
			return this.Tcreate(pkt, tag);
		case NineP.packets.Tread:
			return this.Tread(pkt, tag);
		case NineP.packets.Twrite:
			return this.Twrite(pkt, tag);
		case NineP.packets.Tclunk:
			return this.Tclunk(pkt, tag);
		case NineP.packets.Tremove:
			return this.Tremove(pkt, tag);
		case NineP.packets.Tstat:
			return this.Tstat(pkt, tag);
		case NineP.packets.Twstat:
		case NineP.packets.Tmax:
		default:
			return this.Rerror(tag, "request not supported");
	}
}

NineP.prototype.Rversion = function(pkt, tag){
	var buf = [0, 0, 0, 0, NineP.packets.Rversion];
	buf.push.apply(buf, tag);
	var msize = NineP.GBIT32(pkt.slice(7));
	this.maxbufsz = Math.min(msize, this.maxbufsz);
	buf = buf.concat(NineP.PBIT32([], this.maxbufsz));
	buf = buf.concat(NineP.mkwirestring("9P2000"));
	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Tattach = function(pkt, tag){
	var fid = NineP.GBIT32(pkt.slice(7));

	if(this.fids[fid] != undefined){
		this.Rerror(tag, "fid already in use");
	}else{
		this.fids[fid] = new NineP.Fid(fid, new NineP.Qid(0, 0, NineP.QTDIR));
		this.Rattach(tag, fid);
	}
}

NineP.prototype.Rattach = function(tag, fid){
	var buf = [0, 0, 0, 0, NineP.packets.Rattach];
	buf = buf.concat(tag);
	buf = buf.concat(this.fids[fid].qid.toWireQid());
	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}
	

NineP.prototype.Rerror = function(tag, msg){
	var buf = [0,0,0,0, NineP.packets.Rerror];
	buf.push.apply(buf, tag);
	buf = buf.concat(NineP.mkwirestring(msg));
	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.log.txt("error: " + msg);
	this.socket.write(buf);
}

NineP.prototype.Tflush = function(pkt, tag){
	this.Rerror(tag, "flush not implemented");
}

NineP.prototype.Twalk = function(pkt, tag){
	pkt.splice(0, 7);
	var oldfid = NineP.GBIT32(pkt.splice(0, 4));
	var newfid = NineP.GBIT32(pkt.splice(0, 4));
	var nwname = NineP.GBIT16(pkt.splice(0, 2));
	var names = [];
	var i;
	for(i = 0; i < nwname; ++i){
		names.push(NineP.getwirestring(pkt));
	}
	this.log.txt("twalk oldfid: "+oldfid+" components: " + names + " newfid: "+newfid);

	if(this.fids[oldfid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}
	if(this.fids[newfid] != undefined){
		return this.Rerror(tag, "newfid in use");
	}

	var fakeqid = this.fids[oldfid].qid;
	var interqids = [];

	try{
		for(i = 0; i < nwname; ++i){
			fakeqid = this.local.walk1(fakeqid, names[i]);
			interqids.push(fakeqid);
		}
		this.fids[newfid] = new NineP.Fid(newfid, fakeqid);
	}catch(e){
        console.log("could not walk: error:",e);
		if(i == 0){
			return this.Rerror(tag, "could not walk");
		}
	}
	this.Rwalk(tag, interqids.length, interqids);
}

NineP.prototype.Rwalk = function(tag, nwqid, qids){
	var pkt = [0, 0, 0, 0, NineP.packets.Rwalk];
	var i;

	pkt = pkt.concat(tag);
	pkt = pkt.concat(NineP.PBIT16([], nwqid));

	for(i = 0; i < nwqid; ++i){
		pkt = pkt.concat(qids[i].toWireQid());
	}

	NineP.PBIT32(pkt, pkt.length);
	this.log.buf(pkt);
	this.socket.write(pkt);
}

NineP.prototype.Topen = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt.splice(0, 4));
	var mode = NineP.GBIT8(pkt.splice(0, 1));

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}

	var qid = this.fids[fid].qid;

	if(qid.type & NineP.QTDIR){
		if(mode != NineP.OREAD){
			return this.Rerror(tag, "cannot write to directory");
		}
	}

	try{
		this.local.open(this.fids[fid], mode);
	}catch(e){
		return this.Rerror(tag, e.toString());
	}

	this.fids[fid].mode = mode;

	return this.Ropen(tag, fid);
}

NineP.prototype.Ropen = function(tag, fid){
	var buf = [0, 0, 0, 0, NineP.packets.Ropen].concat(tag);

	buf = buf.concat(this.fids[fid].qid.toWireQid());
	buf = buf.concat(NineP.PBIT32([], 0));

	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Tcreate = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt.splice(0, 4));
	var name = NineP.getwirestring(pkt);
	var perm = NineP.GBIT32(pkt.splice(0, 4));
	var mode = NineP.GBIT8(pkt.splice(0, 1));

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}else if(!(this.fids[fid].qid.type & NineP.QTDIR)){
		return this.Rerror(tag, "cannot create in non-directory");
	}

	try{
		var qid = this.local.create(name, perm, mode);
		this.fids[fid] = new NineP.Fid(fid, qid);
		this.fids[fid].mode = mode;
	}catch(e){
		return this.Rerror(tag, e.toString());
	}

	return this.Rcreate(tag, qid);
}

NineP.prototype.Rcreate = function(tag, qid){
	var buf = [0, 0, 0, 0, NineP.packets.Rcreate].concat(tag);
	var buf = buf.concat(qid.toWireQid());
	var buf = buf.concat(NineP.PBIT32([], 0));

	NineP.PBIT32(buf, buf.length);

	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Tread = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt.splice(0, 4));
	var offset = NineP.GBIT64(pkt.splice(0, 8));
	var count = NineP.GBIT32(pkt.splice(0, 4));

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}
	var mode = this.fids[fid].mode;
	if(mode != NineP.OREAD && mode != NineP.ORDWR){
		return this.Rerror(tag, "fid not opened for reading");
	}

	if(this.fids[fid].qid.type & NineP.QTDIR){
		return this.Rread(tag, this.dirread(this.fids[fid], offset, count));
	}else{
		var that = this;
		return this.local.read(this.fids[fid], offset, count, {
			read: function(data){
				return that.Rread.call(that, tag, data);
			},
			error: function(data){
				return that.Rerror.call(that, tag, data);
			}
		});
	}
}

NineP.prototype.dirread = function(fid, offset, count){
	var dirindex;
	var buf = [];
	if(offset == 0){
		dirindex = 0;
	}else{
		dirindex = fid.dirindex;
	}

	while(buf.length < count){
		var tmpstat = this.local.dirent(fid.qid, dirindex);
		if(tmpstat == undefined){
			break;
		}
		var tmpbuf = tmpstat.toWireStat();
		if((buf.length + tmpbuf.length) > count){
			break;
		}
		buf = buf.concat(tmpbuf);
		dirindex += 1;
	}
	fid.dirindex = dirindex;
	return buf;
}

NineP.prototype.Rread = function(tag, data){
	var buf = [0, 0, 0, 0, NineP.packets.Rread].concat(tag);

	buf = buf.concat(NineP.PBIT32([], data.length)).concat(data);
	NineP.PBIT32(buf, buf.length)

	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Twrite = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt.splice(0, 4));
	var offset = NineP.GBIT64(pkt.splice(0, 8));
	var count = NineP.GBIT32(pkt.splice(0, 4));
	var data = pkt.splice(0, count);

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}
	var mode = this.fids[fid].mode;
	if(!(mode & NineP.OWRITE) && mode != NineP.ORDWR){
		return this.Rerror(tag, "file not opened for writing");
	}

	try{
		var bytes = this.local.write(this.fids[fid].qid, offset, data);
	}catch(e){
		return this.Rerror(tag, e.toString());
	}

	return this.Rwrite(tag, bytes);
}

NineP.prototype.Rwrite = function(tag, count){
	var buf = [0, 0, 0, 0, NineP.packets.Rwrite].concat(tag);
	buf = buf.concat(NineP.PBIT32([], count));

	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}


NineP.prototype.Tclunk = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt);

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "fid not in use");
	}

	this.local.clunk(this.fids[fid]);

	delete this.fids[fid];

	return this.Rclunk(tag);
}

NineP.prototype.Rclunk = function(tag){
	var buf = [0, 0, 0, 0, NineP.packets.Rclunk].concat(tag);

	buf = NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Tremove = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt);

	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "fid not in use");
	}

	try{
		this.local.remove(this.fids[fid].qid);
	}catch(e){
		return this.Rerror(tag, e.toString());
	}

	delete this.fids[fid];
	return this.Rremove(tag);
}

NineP.prototype.Rremove = function(tag){
	var buf = [0, 0, 0, 0, NineP.packets.Rremove].concat(tag);

	NineP.PBIT32(buf, buf.length);
	this.log.buf(buf);
	this.socket.write(buf);
}

NineP.prototype.Tstat = function(pkt, tag){
	pkt.splice(0, 7);
	var fid = NineP.GBIT32(pkt);
	if(this.fids[fid] == undefined){
		return this.Rerror(tag, "invalid fid");
	}

	try{
		return this.Rstat(tag, this.local.stat(this.fids[fid].qid.path));
	}catch(e){
		return this.Rerror(tag, e.toString());
	}
}

NineP.prototype.Rstat = function(tag, stat){
	var pkt = [0, 0, 0, 0, NineP.packets.Rstat].concat(tag);
	pkt = pkt.concat(NineP.mkwirebuf(stat.toWireStat()));

	NineP.PBIT32(pkt, pkt.length);
	this.log.buf(pkt);
	this.socket.write(pkt);
}
