const G = Number('6.67e-11')
const DIST_SCALE = 1000000
const TIME_SCALE = 5
const FRAMERATE = 30

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
    return add(vec1, scale(-1, vec2))
}

function dist(vec1, vec2) {
    return norm(sub(vec1, vec2))
}

class Body {
    
    constructor(mass, pos, vel) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.acc = new Vector(0, 0)
    }

    integrate() {
        // do i need "this."
        console.log('starting integrate')
        console.log(`vel = ${this.vel}`)
        console.log(`pos = ${this.pos}`)
        this.vel = add(this.vel, scale(TIME_SCALE / FRAMERATE, this.acc))
        this.pos = add(this.pos, scale(TIME_SCALE / FRAMERATE, this.vel))
        console.log('ending integrate')
        console.log(`vel = ${this.vel}`)
        console.log(`pos = ${this.pos}`)
    }

    interact(body2) {
        const d = dist(this.pos, body2.pos)
        const acc_mag = G * body2.mass / Math.pow(d, 2)
        const diff = sub(body2.pos, this.pos)
        console.log(`in interact, diff = `)
        console.log(diff)
        const unit = scale(1 / norm(diff), diff)
        const acc = scale(acc_mag, unit)
        this.acc = add(this.acc, acc)
    }
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    let bodies = []
    // sun
    bodies.push(new Body(1.99e33, new Vector(150 * DIST_SCALE, 150 * DIST_SCALE), new Vector(0, 0)))
    // earth
    bodies.push(new Body(5.97e24, new Vector((150 + 92) * DIST_SCALE, 150 * DIST_SCALE), new Vector(0, 1.2 * -29784000.8)))
    canvas.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        // const body = new Body(1_000_000, new Vector(x, y), new Vector(0, 0))
        console.log('clicked')
        bodies.push(body)
    })
    const render = () => {
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].acc = new Vector(0, 0)
        }
        for(let i = 0; i < bodies.length; ++i) {
            for(let j = i + 1; j < bodies.length; ++j) {
                bodies[i].interact(bodies[j])
                bodies[j].interact(bodies[i])
            }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].integrate()
            ctx.beginPath()
            ctx.arc(bodies[i].pos.x / DIST_SCALE, bodies[i].pos.y / DIST_SCALE, 10, 0, 2 * Math.PI)
            ctx.fill()
            console.log('drawing')
            console.log(bodies)
            console.log(bodies[i].pos.x)
            console.log(bodies[i].pos.y)
        }
        setTimeout(render, 1000 / FRAMERATE)
    }
    render()
    const step = document.getElementById('step')
    step.addEventListener('click', () => {
        render()
    })
}

main()