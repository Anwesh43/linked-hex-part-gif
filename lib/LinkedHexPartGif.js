const w = 600, h = 600, nodes = 6
const Canvas = require('canvas')
const GifEncoder = require('gifencoder')
const fs = require('fs')
class State {
    constructor() {
        this.scale = 0
        this.dir = 0
        this.prevScale = 0
    }

    update(cb) {
        this.scale += 0.1 * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating() {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
        }
    }
}

class LHPNode {
    constructor(i) {
        this.i = i
        this.state = new State()
        this.addNeighbor()
    }
    drawLine(context, r, i, sc) {
        context.save()
        context.rotate(i * Math.PI/3)
        context.beginPath()
        context.moveTo(r - 2 * r * sc, r * Math.sqrt(3))
        context.lineTo(r, r * Math.sqrt(3))
        context.stroke()
        context.restore()
    }
    draw(context) {
        context.lineWidth = Math.min(w, h) / 60
        context.lineCap = 'round'
        context.strokeStyle = '#673AB7'
        var sc1 = Math.min(0.5, this.state.scale) * 2
        var sc2 = Math.min(0.5, Math.max(0, this.state.scale - 0.5)) * 2
        if (this.i == nodes - 1) {
            sc1 = this.state.scale
            sc2 = 0
        }
        const gap = (w * 0.9) / nodes
        const r = gap / 3
        context.save()
        context.save()
        context.translate(gap * sc2, 0)
        if (this.prev) {
            this.prev.draw(context)
        }
        context.restore()
        context.translate(this.i * gap + gap / 2 + gap * sc2, h / 2)
        this.drawLine(context, r, this.i, sc1)
        context.restore()
    }

    update(cb) {
        this.state.update(cb)
    }

    startUpdating() {
        this.state.startUpdating()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LHPNode(this.i + 1)
            this.next.prev = this
        }
    }

    getNext(dir, cb) {
        var curr = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class LinkedHexPart {
    constructor() {
        this.curr = new LHPNode(0)
        this.dir = 1
    }

    draw(context) {
        this.curr.draw(context)
    }

    update(cb) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            if (this.curr.i == 0) {
                cb()
            } else {
                this.curr.startUpdating()
            }
        })
    }

    startUpdating() {
        this.curr.startUpdating()
    }
}

class Renderer {
    constructor() {
        this.lhp = new LinkedHexPart()
        this.running = true
    }

    draw(context) {
        this.lhp.draw(context)
    }

    update(cb) {
        this.lhp.update(() => {
            this.running = false
            cb()
        })
    }

    render(context, cb, endcb) {
        this.lhp.startUpdating()
        while (this.running) {
            context.fillStyle = '#212121'
            context.fillRect(0, 0, w, h)
            this.draw(context)
            cb(context)
            this.update(endcb)
        }
    }
}

class LinkedHexPartGif {

    constructor(fn) {
        this.encoder = new GifEncoder(w, h)
        this.canvas = new Canvas(w, h)
        this.context = this.canvas.getContext('2d')
        this.lhp = new Renderer()
        this.initEncoder(fn)
    }

    initEncoder(fn) {
        this.encoder.setDelay(60)
        this.encoder.setRepeat(0)
        this.encoder.createReadStream().pipe(fs.createWriteStream(fn))
    }

    render() {
        this.encoder.start()
        this.lhp.render(this.context, (ctx) => this.encoder.addFrame(ctx), () => this.encoder.end())
    }

    static init(fn) {
        const GIF = new LinkedHexPartGif(fn)
        GIF.render()
    }
}

module.exports = LinkedHexPartGif.init
