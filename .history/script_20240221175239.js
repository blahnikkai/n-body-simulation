class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

function dist(vec1, vec2) {
    return Math.hypot(vec1.x - vec2.x, vec1.y - vec2.y)
}

function add(vec1, vec2) {
    return new Vector(vec1.x + vec2.x, vec1.y + vec2.y)
}

class Body {
    
    constructor(mass, pos, vel) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.acc = 0
    }

    integrate() {
        this.vel = add(this.vel, this.acc)
        this.pos = add(this.pos)
    }
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.arc(150, 150, 10, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    
}

main()