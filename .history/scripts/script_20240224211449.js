import {G, TIME_SCALE, DIST_SCALE, FRAMERATE} from './constants.js'
import Body from './body.js'
import {Vector, scale, sub} from './vector.js'
let screen_center = new Vector(0, 0)


function draw_pos(ctx, screen_center, screen_width) {
    ctx.beginPath()
    ctx.arc(this.pos.x / DIST_SCALE - screen_center.x + screen_width / 2, this.pos.y / DIST_SCALE - screen_center.y + screen_width / 2, 2, 0, 2 * Math.PI)
    ctx.fill()
}

function to_screen_vect(physics_vect) {
    return new Vector(add(sub(scale(1 / DIST_SCALE, physics_vect), screen_center), new Vector(screen_width / 2, screen_width / 2)))
}

function to_physics_vect() {

}

function draw_vect(ctx, origin, vect) {
    ctx.beginPath()
    ctx.moveTo(origin.x / DIST_SCALE - screen_center.x, origin.y / DIST_SCALE - screen_center.y)
    ctx.lineTo((this.pos.x + this.vel.x) / DIST_SCALE  - screen_center.x, (this.pos.y + this.vel.y) / DIST_SCALE - screen_center.y) 
    ctx.strokeStyle = 'red'
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function draw_vel(ctx, screen_center) {
    ctx.beginPath()
    ctx.moveTo(this.pos.x / DIST_SCALE - screen_center.x, this.pos.y / DIST_SCALE - screen_center.y)
    ctx.lineTo((this.pos.x + this.vel.x) / DIST_SCALE  - screen_center.x, (this.pos.y + this.vel.y) / DIST_SCALE - screen_center.y) 
    ctx.strokeStyle = 'red'
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function draw_acc(ctx, screen_center) {
    ctx.beginPath()
    ctx.moveTo(this.pos.x / DIST_SCALE  - screen_center.x, this.pos.y / DIST_SCALE - screen_center.y)
    ctx.lineTo((this.pos.x + this.acc.x) / DIST_SCALE - screen_center.x, (this.pos.y + this.acc.y) / DIST_SCALE - screen_center.y)
    ctx.strokeStyle = 'blue'
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function main() {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    let bodies = []
    let adding_body = null;
    let pause = true
    // sun
    bodies.push(new Body(1.99e33, new Vector(0, 0), new Vector(0, 0)))
    // earth
    // const v_earth = -37983549.0706
    bodies.push(new Body(DIST_SCALE, 5.97e29, new Vector(92 * DIST_SCALE, 0), new Vector(0, 0)))
    // moon ?!
    // bodies.push(new Body(7.35e22, new Vector((400 + 92 - 6.1) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, -37983549.0706 - 1.5 * 2555031)))
    let adding = false;
    canvas.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect()
        console.log('clicked')
        if(!adding) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            adding_body = new Body(1e33, new Vector(DIST_SCALE * x, DIST_SCALE * y), new Vector(0, 0))
        }
        else {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const click_pos = new Vector(x, y)
            adding_body.vel = sub(scale(DIST_SCALE, click_pos), adding_body.pos)
            bodies.push(adding_body)
        }
        adding = !adding
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
        // ctx.beginPath()
        // ctx.arc(400, 400, 92, 0, 2 * Math.PI)
        // ctx.stroke()
        if(adding_body) {
            adding_body.draw_pos(ctx, screen_center)
            adding_body.draw_vel(ctx, screen_center)
        }
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].draw_pos(ctx, screen_center)
            bodies[i].draw_vel(ctx, screen_center)
            bodies[i].draw_acc(ctx, screen_center)
        }
        // ctx.beginPath()
        // ctx.arc(bodies[1].pos.x / DIST_SCALE, bodies[1].pos.y / DIST_SCALE, 6.1, 0, 2 * Math.PI)
        // ctx.stroke()
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
    window.addEventListener('keypress', (event) => {
        const key = event.key
        const move = 50
        if(key == 'w') {
            screen_center.y -= move
        }
        else if(key == 'a') {
            screen_center.x -= move
        }
        else if(key == 's') {
            screen_center.s += move
        }
        else if(key == 'd') {
            screen_center.x += move
        }
    })
}

main()