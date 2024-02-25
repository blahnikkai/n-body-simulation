const G = 6.67e-11
const DIST_SCALE = 1000000
const TIME_SCALE = 5
const FRAMERATE = 60

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
        // console.log('starting integrate')
        // console.log(`vel = ${this.vel}`)
        // console.log(`pos = ${this.pos}`)
        this.vel = add(this.vel, scale(TIME_SCALE / FRAMERATE, this.acc))
        this.pos = add(this.pos, scale(TIME_SCALE / FRAMERATE, this.vel))
        // console.log('ending integrate')
        // console.log(`vel = ${this.vel}`)
        // console.log(`pos = ${this.pos}`)
    }

    interact(body2) {
        const d = dist(this.pos, body2.pos)
        const acc_mag = G * body2.mass / Math.pow(d, 2)
        const diff = sub(body2.pos, this.pos)
        // console.log(`in interact, diff = `)
        // console.log(diff)
        const unit = scale(1 / norm(diff), diff)
        const acc = scale(acc_mag, unit)
        this.acc = add(this.acc, acc)
    }

    draw_pos(ctx) {
        ctx.beginPath()
        ctx.arc(bodies[i].pos.x / DIST_SCALE, bodies[i].pos.y / DIST_SCALE, 2, 0, 2 * Math.PI)
        ctx.fill()
    }

    draw_vel(ctx) {
        ctx.beginPath()
        ctx.arc(bodies[i].pos.x / DIST_SCALE, bodies[i].pos.y / DIST_SCALE, 2, 0, 2 * Math.PI)
        ctx.fill()
    }
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    let bodies = []
    let pause = true
    // sun
    bodies.push(new Body(1.99e33, new Vector(400 * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, 0)))
    // earth
    // const v_earth = -37983549.0706
    bodies.push(new Body(5.97e29, new Vector((400 + 92) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, -37983549.0706)))
    // moon ?!
    // bodies.push(new Body(7.35e22, new Vector((400 + 92 - 6.1) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, -37983549.0706 - 1.5 * 2555031)))
    canvas.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const body = new Body(1_000_000, new Vector(DIST_SCALE * x, DIST_SCALE * y), new Vector(0, 0))
        console.log('clicked')
        bodies.push(body)
    })
    const step = () => {
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].acc = new Vector(0, 0)
        }
        for(let i = 0; i < bodies.length; ++i) {
            for(let j = i + 1; j < bodies.length; ++j) {
                bodies[i].interact(bodies[j])
                bodies[j].interact(bodies[i])
            }
        }
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].integrate()
        }
        if(!pause) {
            setTimeout(step, 1000 / FRAMERATE)
        }
    }
    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.arc(400, 400, 92, 0, 2 * Math.PI)
        ctx.stroke()
        for(let i = 0; i < bodies.length; ++i) {
            
            draw_pos()
            
            ctx.stroke()
            // console.log('drawing')
            // console.log(bodies)
            // console.log(bodies[i].pos.x)
            // console.log(bodies[i].pos.y)
        }
        ctx.beginPath()
        ctx.arc(bodies[1].pos.x / DIST_SCALE, bodies[1].pos.y / DIST_SCALE, 6.1, 0, 2 * Math.PI)
        ctx.stroke()
        // setTimeout(render, 1000 / FRAMERATE)
        window.requestAnimationFrame(render)
    }
    render()
    const step_btn = document.getElementById('step')
    const play_btn = document.getElementById('play')
    step_btn.addEventListener('click', () => {
        if(pause) {
            step()
        }
    })
    play_btn.addEventListener('click', () => {
        console.log('playing')
        pause = !pause;
        if(!pause) {
            step()
        }
    })
}

main()