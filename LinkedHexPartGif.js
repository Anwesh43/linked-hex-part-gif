const w = 600, h = 600, nodes = 5
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

    startUpdating(cb) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class LHPNode {
    constructor(i) {
        this.i = i
        this.state = new State()
    }

    draw(context) {
        context.lineWidth = Math.min(w, h) / 60
        context.lineCap = 'round'
        context.strokeStyle = '#673AB7'
        const sc1 = Math.min(0.5, this.state.scale)
        const sc2 = Math.min(0.5, this.state.scale - 0.5)
        const gap = w / nodes
        const r = gap / 3
        context.save()
        context.translate(this.i * gap + gap * sc2, h / 2)
        context.rotate(this.i * Math.PI/3)
        context.beginPath()
        context.moveTo(-r, r)
        context.lineTo(-r + r * sc1, r)
        context.stroke()
        context.restore()
    }

    update(cb) {
        this.state.update(cb)
    }

    startUpdating(cb) {
        this.state.startUpdating(cb)
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new LHPNode(this.i + 1)
            this.next.prev = this
        }
    }

    getNext(dir, cb) {
        var curr = this.prev
        if (this.dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}
