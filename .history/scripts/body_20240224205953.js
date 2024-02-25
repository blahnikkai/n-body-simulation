import {Vector, scale, add, sub, norm, dist} from './vector.js'
import 
export default class Body {
    
    constructor(mass, pos, vel) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.acc = new Vector(0, 0)
    }

    integrate() {
        this.vel = add(this.vel, scale(TIME_SCALE / FRAMERATE, this.acc))
        this.pos = add(this.pos, scale(TIME_SCALE / FRAMERATE, this.vel))
    }

    interact(body2) {
        const d = dist(this.pos, body2.pos)
        const acc_mag = G * body2.mass / Math.pow(d, 2)
        const diff = sub(body2.pos, this.pos)
        const unit = scale(1 / norm(diff), diff)
        const acc = scale(acc_mag, unit)
        this.acc = add(this.acc, acc)
    }

    draw_pos(ctx) {
        ctx.beginPath()
        ctx.arc(this.pos.x / DIST_SCALE - screen_x, this.pos.y / DIST_SCALE - screen_y, 2, 0, 2 * Math.PI)
        ctx.fill()
    }

    draw_vel(ctx) {
        ctx.beginPath()
        ctx.moveTo(this.pos.x / DIST_SCALE - screen_x, this.pos.y / DDIST_SCALE - screen_y)
        ctx.lineTo((this.pos.x + this.vel.x) / DIST_SCALE  - screen_x, (this.pos.y + this.vel.y) / DIST_SCALE - screen_y) 
        ctx.strokeStyle = 'red'
        ctx.stroke()
        ctx.strokeStyle = 'black'
    }

    draw_acc(ctx) {
        ctx.beginPath()
        ctx.moveTo(this.pos.x / DIST_SCALE  - screen_x, this.pos.y / DIST_SCALE - screen_y)
        ctx.lineTo((this.pos.x + this.acc.x) / DIST_SCALE - screen_x, (this.pos.y + this.acc.y) / DIST_SCALE - screen_y)
        ctx.strokeStyle = 'blue'
        ctx.stroke()
        ctx.strokeStyle = 'black'
    }
}
