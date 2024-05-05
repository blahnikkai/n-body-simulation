import {FRAMERATE, SCREEN_WIDTH, CAM_MOVE, CAM_ZOOM_FACTOR} from './constants.js'
import Body from './body.js'
import {Vector, scale, add, sub} from './vector.js'

function to_screen_vect(physics_vect, dist_scale, screen_center) {
    return add(
        sub(
            scale(1 / dist_scale, physics_vect), 
            screen_center
        ), 
        new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
    )
}

function to_physics_vect(screen_vect, dist_scale, screen_center) {
    return scale(
        dist_scale, 
        add(
            sub(
                screen_vect, 
                new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
            ), 
            screen_center
        )
    )
}

function draw_point(ctx, origin, size, dist_scale, screen_center) {
    ctx.beginPath()
    const screen_origin = to_screen_vect(origin, dist_scale, screen_center)
    ctx.arc(screen_origin.x, screen_origin.y, size, 0, 2 * Math.PI)
    ctx.fill()
}

function draw_pos(ctx, body, dist_scale, screen_center) {
    draw_point(
        ctx,
        body.pos,
        2,
        // screen size based on mass
        // 2 * (1_000_000 / DIST_SCALE) * Math.pow(body.mass / 1e29, 1 / 3)
        dist_scale,
        screen_center,
    )
}

function draw_vect(ctx, origin, vect, clr, dist_scale, screen_center) {
    ctx.beginPath()
    const screen_origin = to_screen_vect(origin, dist_scale, screen_center)
    ctx.moveTo(screen_origin.x, screen_origin.y)
    const screen_end = to_screen_vect(add(origin, vect), dist_scale, screen_center)
    ctx.lineTo(screen_end.x, screen_end.y)
    ctx.strokeStyle = clr
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function draw_vel(ctx, body, dist_scale, screen_center) {
    draw_vect(ctx, body.pos, body.vel, 'red', dist_scale, screen_center)
}

function draw_acc(ctx, body, dist_scale, screen_center) {
    draw_vect(ctx, body.pos, body.acc, 'blue', dist_scale, screen_center)
}


export class Simulation {

    handle_add_body(event, add_body_form) {
        event.preventDefault()
        const replace_nan = (val) => {
            if(isNaN(val)) {
                return 0
            }
            return val
        }
        const mass = parseFloat(add_body_form.mass.value)
        const pos_x = replace_nan(parseFloat(add_body_form.pos_x.value))
        const pos_y = replace_nan(parseFloat(add_body_form.pos_y.value))
        const vel_x = replace_nan(parseFloat(add_body_form.vel_x.value))
        const vel_y = replace_nan(parseFloat(add_body_form.vel_y.value))
        const new_body = new Body(mass, new Vector(pos_x, pos_y), new Vector(vel_x, vel_y))
        this.bodies.push(new_body)
    }

    handle_keypress(event) {
        const key = event.key
        if(key == '=') {
            this.dist_scale /= CAM_ZOOM_FACTOR
        }
        if(key == '-') {
            this.dist_scale *= CAM_ZOOM_FACTOR
        }
        if(key == 'w') {
            this.screen_center.y -= CAM_MOVE
        }
        else if(key == 'a') {
            this.screen_center.x -= CAM_MOVE
        }
        else if(key == 's') {
            this.screen_center.y += CAM_MOVE
        }
        else if(key == 'd') {
            this.screen_center.x += CAM_MOVE
        }
    }

    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.ctx.fillStyle = 'white'
        // meters per pixel
        this.dist_scale = 1_000_000
        this.screen_center = new Vector(0, 0)
        this.adding_body = null
        this.paused = true
        this.bodies = []
        // sun
        this.bodies.push(new Body(1.99e33, new Vector(0, 0)))
        // earth
        // const v_earth = -37983549.0706
        this.bodies.push(new Body(5.97e29, new Vector(92 * this.dist_scale, 0), new Vector(0, -37983549.0706 + -13000000)))
        this.bodies.push(new Body(5.97e29, new Vector(-92 * this.dist_scale, 0), new Vector(0, -37983549.0706 + 10000000)))
        // moon ?!
        // this.bodies.push(new Body(7.35e22, new Vector((400 + 92 - 6.1) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, -37983549.0706 - 1.5 * 2555031)))

        this.canvas.addEventListener('click', (event) => {
            const rect = event.target.getBoundingClientRect()
            const click_pos = new Vector(event.clientX - rect.left, event.clientY - rect.top)
            if(!this.adding) {
                this.adding_body = new Body(1e33, to_physics_vect(click_pos, this.dist_scale, this.screen_center))
            }
            else {
                this.adding_body.vel = sub(to_physics_vect(click_pos, this.dist_scale, this.screen_center), this.adding_body.pos)
                this.bodies.push(this.adding_body)
            }
            this.adding = !this.adding
        })
        const step_btn = document.getElementById('step')
        const play_btn = document.getElementById('play')
        const add_body_form = document.getElementById('add_body_form')
        add_body_form.addEventListener('submit', (event) => this.handle_add_body(event, add_body_form))
        canvas.addEventListener('keypress', this.handle_keypress)
        step_btn.addEventListener('click', () => {
            if(this.paused) {
                this.step()
            }
        })
        play_btn.addEventListener('click', () => {
            this.paused = !this.paused;
            if(this.paused) {
                play_btn.innerText = 'Play'
            }
            else {
                play_btn.innerText = 'Pause'
                this.step()
            }
        })
        this.render()
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        // draw circle to show approx orbital path
        // ctx.beginPath()
        // ctx.arc(400, 400, 92, 0, 2 * Math.PI)
        // ctx.stroke()
        if(this.adding_body) {
            draw_pos(this.ctx, this.adding_body, this.dist_scale, this.screen_center)
        }
        for(let i = 0; i < this.bodies.length; ++i) {
            draw_pos(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            draw_vel(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            draw_acc(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
        }
        window.requestAnimationFrame(() => this.render())
    }

    step() {
        for(let i = 0; i < this.bodies.length; ++i) {
            this.bodies[i].integrate()
        }
        for(let i = 0; i < this.bodies.length; ++i) {
            this.bodies[i].acc = new Vector(0, 0)
        }
        for(let i = 0; i < this.bodies.length; ++i) {
            for(let j = i + 1; j < this.bodies.length; ++j) {
                this.bodies[i].interact(this.bodies[j])
                this.bodies[j].interact(this.bodies[i])
            }
        }
        if(!this.paused) {
            setTimeout(() => this.step(), 1000 / FRAMERATE)
        }
    }
}
