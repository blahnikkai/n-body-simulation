import {FRAMERATE, SCREEN_WIDTH, CAM_MOVE, CAM_ZOOM_FACTOR} from './constants.js'
import Body from './body.js'
import {Vector, scale, add, sub, dist, norm} from './vector.js'

function mass_to_screen_rad(mass, dist_scale) {
    return 1.5 * (1e6 / dist_scale) * Math.pow(mass / 1e29, 1 / 3)
}

function screen_rad_to_mass(rad, dist_scale) {
    return 1e29 * Math.pow(rad / 1.5 * (dist_scale / 1e6), 3)
}

function to_screen_vect(physics_vect, dist_scale, screen_center) {
    return add(
        scale(1 / dist_scale, 
            sub(
                physics_vect, 
                screen_center
            ), 
        ),
        new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
    )
}

function to_physics_vect(screen_vect, dist_scale, screen_center) {
    return add(
        screen_center,
        scale(
            dist_scale,
            sub(
                screen_vect, 
                new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
            ), 
            screen_center
        )
    )
}

function draw_point(ctx, physics_pt, size, dist_scale, screen_center) {
    ctx.beginPath()
    const screen_pt = to_screen_vect(physics_pt, dist_scale, screen_center)
    ctx.arc(screen_pt.x, screen_pt.y, size, 0, 2 * Math.PI)
    ctx.fill()
}

function draw_pos(ctx, body, dist_scale, screen_center) {
    draw_point(
        ctx,
        body.pos,
        // 2,
        // screen size based on mass
        mass_to_screen_rad(body.mass, dist_scale),
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

function draw_text(ctx, txt, physics_loc, offset, mass, dist_scale, screen_center) {
    ctx.fillStyle = 'green'
    ctx.font = '12px sans-serif'
    const mass_offset = mass_to_screen_rad(mass, dist_scale)
    const screen_loc = add(
        to_screen_vect(physics_loc, dist_scale, screen_center),
        new Vector(mass_offset / Math.sqrt(2), mass_offset / Math.sqrt(2) + offset * 12)
    )
    ctx.fillText(txt, screen_loc.x, screen_loc.y)
    ctx.fillStyle = 'white'
}

function draw_debug_info(ctx, body, dist_scale, screen_center) {
    draw_text(ctx, `mass: ${body.mass}`, body.pos, 1, body.mass, dist_scale, screen_center)
    draw_text(ctx, `pos: ${body.pos} (${norm(body.pos).toExponential(2)})`, body.pos, 2, body.mass, dist_scale, screen_center)
    draw_text(ctx, `vel: ${body.vel} (${norm(body.vel).toExponential(2)})`, body.pos, 3, body.mass, dist_scale, screen_center)
    draw_text(ctx, `acc: ${body.acc} (${norm(body.acc).toExponential(2)})`, body.pos, 4, body.mass, dist_scale, screen_center)
}

function draw_crosshairs(ctx) {
    ctx.strokeStyle = 'lime'
    ctx.beginPath()
    ctx.moveTo(SCREEN_WIDTH / 2 - 10, SCREEN_WIDTH / 2)
    ctx.lineTo(SCREEN_WIDTH / 2 + 10, SCREEN_WIDTH / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2 - 10)
    ctx.lineTo(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2 + 10)
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function draw_trace(ctx, body, dist_scale, screen_center) {
    ctx.strokeStyle = 'teal'
    let screen_pt = to_screen_vect(body.pos, dist_scale, screen_center)
    ctx.moveTo(screen_pt.x, screen_pt.y)
    ctx.beginPath()
    for(const past_pos of body.past_pos) {
        screen_pt = to_screen_vect(past_pos, dist_scale, screen_center)
        ctx.lineTo(screen_pt.x, screen_pt.y)
    }
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

export class Simulation {

    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.ctx.fillStyle = 'white'
    
        // meters per pixel
        this.dist_scale = 1e6
        this.screen_center = new Vector(0, 0)

        this.adding = 0
        this.adding_body = null

        this.paused = true

        this.show_trace = true
        this.show_vel = true
        this.show_acc = true
        this.show_crosshairs = false
        this.show_debug = false
        
        this.bodies = []
        this.add_big_binary_system()

        this.render()
        
        // keypress
        window.addEventListener('keypress', (event) => this.handle_keypress(event))
        // canvas click
        this.canvas.addEventListener('click', (event) => this.handle_canvas_click(event))
        this.canvas.addEventListener('contextmenu', (event) => this.handle_canvas_rightclick(event))
        // step button
        document.getElementById('step').addEventListener('click', () => this.handle_step_btn())
        // play button
        const play_btn = document.getElementById('play')
        play_btn.addEventListener('click', () => this.handle_play_btn(play_btn))
        // show trace checkbox
        document.getElementById('show_trace_checkbox').addEventListener('change', () => this.handle_show_trace())
        // show velocity checkbox
        document.getElementById('show_vel_checkbox').addEventListener('change', () => this.handle_show_vel())
        // show acceleration checkbox
        document.getElementById('show_acc_checkbox').addEventListener('change', () => this.handle_show_acc())
        // show crosshairs checkbox
        document.getElementById('show_crosshairs_checkbox').addEventListener('change', () => this.handle_show_crosshairs())
        // show debug checkbox
        document.getElementById('show_debug_checkbox').addEventListener('change', () => this.handle_show_debug())
        // add body form
        const add_body_form = document.getElementById('add_body_form')
        add_body_form.addEventListener('submit', (event) => this.handle_add_body(event, add_body_form))
        // clear btn
        document.getElementById('clear_btn').addEventListener('click', () => this.handle_clear_btn())
        document.getElementById('center_btn').addEventListener('click', () => this.handle_center_btn())

        document.getElementById('add_basic_orbits_btn').addEventListener('click', () => this.add_regular_orbits())
        document.getElementById('add_resonant_orbits_btn').addEventListener('click', () => this.add_resonant_orbits())
        document.getElementById('add_circ_binaries_btn').addEventListener('click', () => this.add_circ_binaries())
        document.getElementById('add_elliptical_binaries_btn').addEventListener('click', () => this.add_elliptical_binaries())
        document.getElementById('add_four_star_btn').addEventListener('click', () => this.add_four_star())
        document.getElementById('add_random_bodies_btn').addEventListener('click', () => this.add_random_bodies())
    }

    add_regular_orbits() {
        // sun and two elliptical orbits, one very short period, one longer period
        this.bodies.push(new Body(1e34, new Vector(0, 0)))
        this.bodies.push(new Body(1e30, new Vector(2e8, 0), new Vector(0, 4.5e7)))
        this.bodies.push(new Body(1e30, new Vector(-2e8, 0), new Vector(0, -7.5e7)))
    }

    // almost circular binary star system
    add_circ_binaries() {
        const m = 1e33
        const r = 1e8
        const v = 1.295e7
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(-v, 0)))
    }

    // eliptical binary star
    add_elliptical_binaries() {
        const m = 2e33
        const r = 1.5e8
        const v = 1e7
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(-v, 0)))
    }

    // 1:2:4 (4:2:1?) orbital resonance
    add_resonant_orbits() {
        this.bodies.push(new Body(1e33, new Vector(0, 0)))
        // 1:1
        this.bodies.push(new Body(1e29, new Vector(.7e8, 0), new Vector(0, 30868384.1958)))
        // 2:1
        this.bodies.push(new Body(1e29, new Vector(111118073.638, 0), new Vector(0, 24500252.7724)))
        // 4:1
        this.bodies.push(new Body(1e29, new Vector(0, -176388946.985), new Vector(19445863.5123, 0)))
    }

    add_four_star() {
        const m = 1e33
        const r = 1.5e8
        const v = 2.06e7
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(r, 0), new Vector(0, v)))
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(-v, 0)))
        this.bodies.push(new Body(m, new Vector(-r, 0), new Vector(0, -v)))
    }

    add_big_binary_system() {
        const m = 2e33
        const r = 2e8
        const v = 1.295e7
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(-v, 0)))
        // s-type
        this.bodies.push(new Body(1e30, new Vector(0, -r + .7e8), new Vector(-v - .45e8, 0)))
        // t-type
        this.bodies.push(new Body(1e31, new Vector(0, -1e9), new Vector(-1.28 * v, 0)))
        // p-type
        // this.bodies.push(new Body(1e30, new Vector(0, -r - 5e8), new Vector(-v - 1e8, 0)))
    }

    // add a lot of random bodies
    add_random_bodies() {
        // generates a random float, min and max included
        const rand_float = (min, max) => {
            return Math.random() * (max - min) + min;
        }
        for(let i = 0; i < 100; ++i) {
            this.bodies.push(
                new Body(
                    10 ** rand_float(29, 31),
                    new Vector(rand_float(-8, 8) * 10 ** 8, rand_float(-8, 8) * 10 ** 8), 
                    new Vector(rand_float(-15, 15) * 10 ** 6, rand_float(-15, 15) * 10 ** 6)
                )
            )
        }
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
            this.screen_center.y -= this.dist_scale * CAM_MOVE
        }
        else if(key == 'a') {
            this.screen_center.x -= this.dist_scale * CAM_MOVE
        }
        else if(key == 's') {
            this.screen_center.y += this.dist_scale * CAM_MOVE
        }
        else if(key == 'd') {
            this.screen_center.x += this.dist_scale * CAM_MOVE
        }
    }

    handle_canvas_click(event) {
        const rect = event.target.getBoundingClientRect()
        const click_pos = new Vector(event.clientX - rect.left, event.clientY - rect.top)
        if(this.adding == 0) {
            this.adding_body = new Body(1e29, to_physics_vect(click_pos, this.dist_scale, this.screen_center))
        }
        else if(this.adding == 1) {
            const screen_pos = to_screen_vect(this.adding_body.pos, this.dist_scale, this.screen_center)
            this.adding_body.mass = screen_rad_to_mass(
                Math.hypot(screen_pos.x - click_pos.x, screen_pos.y - click_pos.y), 
                this.dist_scale
            )
        }
        else {
            this.adding_body.vel = sub(to_physics_vect(click_pos, this.dist_scale, this.screen_center), this.adding_body.pos)
            this.bodies.push(this.adding_body)
        }
        this.adding += 1
        this.adding %= 3
    }

    handle_canvas_rightclick(event) {
        event.preventDefault()
        const rect = event.target.getBoundingClientRect()
        const click_pos = new Vector(event.clientX - rect.left, event.clientY - rect.top)
        for(let i = 0; i < this.bodies.length; ++i) {
            const body = this.bodies[i]
            if(dist(to_screen_vect(body.pos, this.dist_scale, this.screen_center), click_pos) < mass_to_screen_rad(body.mass, this.dist_scale)) {
                this.bodies.splice(i, 1)
            }
        }
    }

    handle_step_btn() {
        if(this.paused) {
            this.step()
        }
    }

    handle_play_btn(play_btn) {
        this.paused = !this.paused
        if(this.paused) {
            play_btn.innerText = 'Play'
        }
        else {
            play_btn.innerText = 'Pause'
            this.step()
        }
    }

    handle_show_trace() {
        this.show_trace = !this.show_trace
        if(!this.show_trace) {
            for(let body of this.bodies) {
                body.past_pos = []
            }
        }
    }

    handle_show_vel() {
        this.show_vel = !this.show_vel
    }

    handle_show_acc() {
        this.show_acc = !this.show_acc
    }

    handle_show_crosshairs() {
        this.show_crosshairs = !this.show_crosshairs
    }

    handle_show_debug() {
        this.show_debug = !this.show_debug
    }

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

    handle_clear_btn() {
        this.bodies = []
    }

    handle_center_btn() {
        this.screen_center = new Vector(0, 0)
        this.dist_scale = 1e6
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if(this.adding != 0) {
            draw_pos(this.ctx, this.adding_body, this.dist_scale, this.screen_center)
        }
        this.ctx.beginPath()
        this.ctx.arc(- this.screen_center.x / this.dist_scale + 400, - this.screen_center.y / this.dist_scale + 400, 1e9 / this.dist_scale, 0, 2 * Math.PI)
        this.ctx.stroke()
        for(let i = 0; i < this.bodies.length; ++i) {
            draw_pos(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            if(this.show_vel) {
                draw_vel(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            }
            if(this.show_acc) {
                draw_acc(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            }
            if(this.show_crosshairs) {
                draw_crosshairs(this.ctx)
            }
            if(this.show_debug) {
                draw_debug_info(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            }
            if(this.show_trace) {
                draw_trace(this.ctx, this.bodies[i], this.dist_scale, this.screen_center)
            }
        }
        window.requestAnimationFrame(() => this.render())
    }

    step() {
        for(let i = 0; i < this.bodies.length; ++i) {
            this.bodies[i].integrate(this.show_trace)
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
