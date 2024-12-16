import {FRAMERATE, SCREEN_WIDTH, CAM_MOVE, CAM_ZOOM_FACTOR} from './constants.js'
import Body from './body.js'
import {Vector, scale, add, sub, dist, norm} from './vector.js'

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

        // drawing and camera stuff
        this.show_trace = true
        this.show_vel = true
        this.show_acc = true
        this.show_crosshairs = false
        this.show_debug = false
        this.focused_body = null
        
        this.bodies = []
        this.add_elliptical_orbits()

        this.draw_all()
        
        // keypress
        window.addEventListener('keypress', (event) => this.handle_keypress(event))
        // canvas click
        this.canvas.addEventListener('click', (event) => this.handle_canvas_click(event))
        this.canvas.addEventListener('contextmenu', (event) => this.handle_canvas_rightclick(event))
        // step button
        document.getElementById('step').addEventListener('click', () => this.handle_step_btn())
        // play button
        const play_btn = document.getElementById('play')
        play_btn.addEventListener('click', () => this.toggle_paused(play_btn))
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
        document.getElementById('clear_btn').addEventListener('click', () => this.clear_bodies())
        document.getElementById('center_btn').addEventListener('click', () => this.reset_camera())

        document.getElementById('add_elliptical_orbits_btn').addEventListener('click', () => this.add_elliptical_orbits())
        document.getElementById('add_resonant_orbits_btn').addEventListener('click', () => this.add_resonant_orbits())
        document.getElementById('add_binaries_btn').addEventListener('click', () => this.add_binary_system())
        document.getElementById('add_four_star_btn').addEventListener('click', () => this.add_four_star_system())
        document.getElementById('add_moon_orbit_btn').addEventListener('click', () => this.add_moon_orbit())
        document.getElementById('add_random_bodies_btn').addEventListener('click', () => this.add_random_bodies())
    }

    add_elliptical_orbits() {
        // sun and two elliptical orbits, one very short period, one longer period
        this.bodies.push(new Body(1e34, new Vector(0, 0)))
        this.bodies.push(new Body(1e30, new Vector(2e8, 0), new Vector(0, 4.5e7)))
        this.bodies.push(new Body(1e30, new Vector(-2e8, 0), new Vector(0, -7.5e7)))
    }

    add_moon_orbit() {
        this.bodies.push(new Body(1e34, new Vector(0, 0)))
        this.bodies.push(new Body(1e31, new Vector(0, 3e8), new Vector(-47152235.7194, 0)))
        this.bodies.push(new Body(1e28, new Vector(0, 3.1e8), new Vector(1.15 * -47152235.7194, 0)))
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

    add_binary_system() {
        const m = 1e32
        const r = 4.65e7
        const v = 6e6
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(-v, 0)))
        // s-type
        this.bodies.push(new Body(1e29, new Vector(0, -r + 3e7), new Vector(-v - 1.53e7, 0)))
        // p-type
        this.bodies.push(new Body(1e29, new Vector(0, -3.5e8), new Vector(-1.04 * v, 0)))
    }

    add_four_star_system() {
        const m = 1e33
        const r = 1.5e8
        const v = 2.06e7
        this.bodies.push(new Body(m, new Vector(0, -r), new Vector(v, 0)))
        this.bodies.push(new Body(m, new Vector(r, 0), new Vector(0, v)))
        this.bodies.push(new Body(m, new Vector(0, r), new Vector(-v, 0)))
        this.bodies.push(new Body(m, new Vector(-r, 0), new Vector(0, -v)))
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
        if(this.focused_body != null) {
            return;
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

    check_body_clicked(body, click_pos) {
        return dist(this.to_screen_vect(body.pos, this.dist_scale, this.screen_center), click_pos) < this.mass_to_screen_rad(body.mass, this.dist_scale)
    }

    handle_canvas_click(event) {
        const rect = event.target.getBoundingClientRect()
        const click_pos = new Vector(event.clientX - rect.left, event.clientY - rect.top)
        for(const body of this.bodies) {
            if(this.check_body_clicked(body, click_pos)) {
                if(this.focused_body === body) {
                    this.focused_body = null
                }
                else {
                    this.focused_body = body
                }
                // what would happend without this return?
                return
            }
        }
        if(this.adding == 0) {
            this.adding_body = new Body(1e29, this.to_physics_vect(click_pos, this.dist_scale, this.screen_center))
        }
        else if(this.adding == 1) {
            const screen_pos = this.to_screen_vect(this.adding_body.pos, this.dist_scale, this.screen_center)
            this.adding_body.mass = this.screen_rad_to_mass(
                Math.hypot(screen_pos.x - click_pos.x, screen_pos.y - click_pos.y), 
                this.dist_scale
            )
        }
        else {
            this.adding_body.vel = sub(this.to_physics_vect(click_pos, this.dist_scale, this.screen_center), this.adding_body.pos)
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
            if(this.check_body_clicked(this.bodies[i], click_pos)) {
                if(this.focused_body === this.bodies[i]) {
                    this.focused_body = null
                }
                this.bodies.splice(i, 1)
                return
            }
        }
        if(this.check_body_clicked(this.adding_body, click_pos)) {
            this.adding_body = null
            this.adding = 0
        }
    }

    handle_step_btn() {
        if(this.paused) {
            this.step()
        }
    }

    toggle_paused(play_btn) {
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

    clear_bodies() {
        this.bodies = []
        this.focused_body = null
        this.adding_body = null
        this.adding = 0
    }

    reset_camera() {
        this.screen_center = new Vector(0, 0)
        this.dist_scale = 1e6
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

    draw_all() {
        if(this.focused_body != null) {
            this.screen_center = structuredClone(this.focused_body.pos)
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if(this.show_trace) {
            for(const body of this.bodies) {
                this.draw_trace(body)
            }
        }
        for(const body of this.bodies) {
            this.draw_pos(body)
        }
        if(this.adding != 0) {
            this.draw_pos(this.adding_body)
        }
        if(this.show_vel) {
            for(const body of this.bodies) {
                this.draw_vel(body)
            }
        }
        if(this.show_acc) {
            for(const body of this.bodies) {
                this.draw_acc(body)
            }
        }
        if(this.show_debug) {
            for(const body of this.bodies) {
                this.draw_debug_info(body)
            }
        }
        if(this.show_crosshairs) {
            this.draw_crosshairs()
        }
        window.requestAnimationFrame(() => this.draw_all())
    }
        
    mass_to_screen_rad(mass) {
        return 1.5 * (1e6 / this.dist_scale) * Math.pow(mass / 1e29, 1 / 3)
    }

    screen_rad_to_mass(rad) {
        return 1e29 * Math.pow(rad / 1.5 * (this.dist_scale / 1e6), 3)
    }

    to_screen_vect(physics_vect) {
        return add(
            scale(1 / this.dist_scale, 
                sub(
                    physics_vect, 
                    this.screen_center
                ), 
            ),
            new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
        )
    }

    to_physics_vect(screen_vect) {
        return add(
            this.screen_center,
            scale(
                this.dist_scale,
                sub(
                    screen_vect, 
                    new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
                ), 
                this.screen_center
            )
        )
    }

    draw_point(physics_pt, size, clr) {
        this.ctx.fillStyle = clr
        this.ctx.beginPath()
        const screen_pt = this.to_screen_vect(physics_pt)
        this.ctx.arc(screen_pt.x, screen_pt.y, size, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.fillStyle = 'white'
    }

    draw_pos(body) {
        const clr = body === this.focused_body ? 'gold' : 'white'
        this.draw_point(
            body.pos,
            this.mass_to_screen_rad(body.mass),
            clr,
        )
    }

    draw_vect(origin, vect, clr) {
        const screen_origin = this.to_screen_vect(origin)
        const screen_end = this.to_screen_vect(add(origin, vect))
        this.ctx.beginPath()
        this.ctx.moveTo(screen_origin.x, screen_origin.y)
        this.ctx.lineTo(screen_end.x, screen_end.y)
        this.ctx.strokeStyle = clr
        this.ctx.stroke()
        this.ctx.strokeStyle = 'white'
    }

    draw_vel(body) {
        this.draw_vect(body.pos, body.vel, 'red')
    }

    draw_acc(body) {
        this.draw_vect(body.pos, body.acc, 'blue')
    }

    draw_circle(physics_pt, physics_r) {
        const screen_pt = this.to_screen_vect(physics_pt)
        this.ctx.beginPath()
        this.ctx.arc(screen_pt.x, screen_pt.y, physics_r / this.dist_scale, 0, 2 * Math.PI)
        this.ctx.stroke()
    }

    draw_text(txt, physics_loc, offset, mass) {
        this.ctx.fillStyle = 'green'
        this.ctx.font = '12px sans-serif'
        const mass_offset =this. mass_to_screen_rad(mass)
        const screen_loc = add(
            this.to_screen_vect(physics_loc),
            new Vector(mass_offset / Math.sqrt(2), mass_offset / Math.sqrt(2) + offset * 12)
        )
        this.ctx.fillText(txt, screen_loc.x, screen_loc.y)
        this.ctx.fillStyle = 'white'
    }

    draw_debug_info(body) {
        this.draw_text(`mass: ${body.mass}`, body.pos, 1, body.mass)
        this.draw_text(`pos: ${body.pos} (${norm(body.pos).toExponential(2)})`, body.pos, 2, body.mass)
        this.draw_text(`vel: ${body.vel} (${norm(body.vel).toExponential(2)})`, body.pos, 3, body.mass)
        this.draw_text(`acc: ${body.acc} (${norm(body.acc).toExponential(2)})`, body.pos, 4, body.mass)
    }

    draw_crosshairs() {
        this.ctx.strokeStyle = 'lime'
        this.ctx.beginPath()
        this.ctx.moveTo(SCREEN_WIDTH / 2 - 10, SCREEN_WIDTH / 2)
        this.ctx.lineTo(SCREEN_WIDTH / 2 + 10, SCREEN_WIDTH / 2)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2 - 10)
        this.ctx.lineTo(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2 + 10)
        this.ctx.stroke()
        this.ctx.strokeStyle = 'white'
    }

    draw_trace(body) {
        this.ctx.strokeStyle = 'teal'
        let screen_pt = this.to_screen_vect(body.pos)
        this.ctx.moveTo(screen_pt.x, screen_pt.y)
        this.ctx.beginPath()
        for(const past_pos of body.past_pos) {
            screen_pt = this.to_screen_vect(past_pos)
            this.ctx.lineTo(screen_pt.x, screen_pt.y)
        }
        this.ctx.stroke()
        this.ctx.strokeStyle = 'white'
    }
}
