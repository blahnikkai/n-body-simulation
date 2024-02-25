const G = Number('6.67e-11')
const FRAMERATE = 10

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

function norm(vec) {
    return Math.hypot(vec.x, vec.y)
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

function dist(vec1, vec2) {
    return norm(sub(vec1, vec2))
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
        this.vel = add(this.vel, scale(1 / FRAMERATE, this.acc))
        this.pos = add(this.pos, scale(1 / FRAMERATE, this.vel))
    }

    interact(body2) {
        const d = dist(this.pos, body2.pos)
        const acc_mag = G * body2.mass / Math.pow(d, 2)
        const diff = sub(body2.pos, this.pos)
        const unit = scale(1 / norm(diff), diff)
        const acc = scale(acc_mag, unit)
        this.acc = add(this.acc, acc)
    }
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.arc(150, 150, 10, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    let bodies = []
    canvas.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const body = new Body(10, new Vector(x, y), new Vector(0, 0))
        bodies.push(body)
    });
    const render = () => {
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].acc = 0
        }
        for(let i = 0; i < bodies.length; ++i) {
            for(let j = i + 1; j < bodies.length; ++j) {
                bodies[i].interact(bodies[j])
                bodies[j].interact(bodies[i])
            }
        }
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].integrate()
            ctx.arc(bodies[i].pos.x, bodies[i].pos.y, 10, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.fill()
            console.log('drawing')
        }
    }
    setInterval(render, 1 / FRAMERATE)
}

main()