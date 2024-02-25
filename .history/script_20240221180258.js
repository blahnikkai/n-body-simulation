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

function scale(scalar, vec) {
    return new Vector(scalar * vec.x, scalar * vec.y)
}

class Body {
    
    constructor(mass, pos, vel) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.acc = 0
    }

    integrate() {
        // do i need "this."
        this.vel = add(vel, scale(1 / FRAMERATE * this.acc))
        this.pos = add(this.pos, scale(1 / FRAMERATE * this.vel))
    }
}

function body_interaction() {

}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.arc(150, 150, 10, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    
}

main()