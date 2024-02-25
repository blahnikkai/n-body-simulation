const G = Number('6.67e-11')

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

function sub(vec1, vec2) {
    return new Vector(vec1, scale(-1, vec2))
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

function body_interaction(body1, body2) {
    const d = dist(body1.pos, body2.pos)
    const F = G * body1.mass * body2.mass / Math.pow(d, 2)
    const diff = sub()
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.arc(150, 150, 10, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    
}

main()