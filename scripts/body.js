import {Vector, scale, add, sub, norm, dist} from './vector.js'
import {G, TIME_SCALE, FRAMERATE} from './constants.js'

export default class Body {
    
    constructor(mass, pos, vel = new Vector(0, 0)) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
        this.acc = new Vector(0, 0)
        this.past_pos = []
    }

    integrate(add_trace) {
        if(add_trace) {
            this.past_pos.push(this.pos)
            if(this.past_pos.length > 1800) {
                this.past_pos.shift()
            }
        }
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
}
