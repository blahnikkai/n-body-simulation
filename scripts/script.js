import {FRAMERATE, SCREEN_WIDTH, CAM_MOVE, CAM_ZOOM_FACTOR} from './constants.js'
import Body from './body.js'
import {Vector, scale, add, sub} from './vector.js'
// DIST_SCALE = meters per pixel
let dist_scale = 1_000_000
let screen_center = new Vector(0, 0)

function to_screen_vect(physics_vect) {
    return add(
        sub(
            scale(1 / dist_scale, physics_vect), 
            screen_center
        ), 
        new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2)
    )
}

function to_physics_vect(screen_vect) {
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

function draw_point(ctx, origin, size) {
    ctx.beginPath()
    const screen_origin = to_screen_vect(origin)
    ctx.arc(screen_origin.x, screen_origin.y, size, 0, 2 * Math.PI)
    ctx.fill()
}

function draw_pos(ctx, body) {
    draw_point(
        ctx, 
        body.pos, 
        2 // 2 * (1_000_000 / DIST_SCALE) * Math.pow(body.mass / 1e29, 1 / 3)
    )
}

function draw_vect(ctx, origin, vect, clr) {
    ctx.beginPath()
    const screen_origin = to_screen_vect(origin)
    ctx.moveTo(screen_origin.x, screen_origin.y)
    const screen_end = to_screen_vect(add(origin, vect))
    ctx.lineTo(screen_end.x, screen_end.y)
    ctx.strokeStyle = clr
    ctx.stroke()
    ctx.strokeStyle = 'white'
}

function draw_vel(ctx, body) {
    draw_vect(ctx, body.pos, body.vel, 'red')
}

function draw_acc(ctx, body) {
    draw_vect(ctx, body.pos, body.acc, 'blue')
}

function handle_add_body(event) {
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
    bodies.push(new_body)
}

function handle_keypress(event) {
    const key = event.key
    if(key == '=') {
        dist_scale /= CAM_ZOOM_FACTOR
    }
    if(key == '-') {
        dist_scale *= CAM_ZOOM_FACTOR
    }
    if(key == 'w') {
        screen_center.y -= CAM_MOVE
    }
    else if(key == 'a') {
        screen_center.x -= CAM_MOVE
    }
    else if(key == 's') {
        screen_center.y += CAM_MOVE
    }
    else if(key == 'd') {
        screen_center.x += CAM_MOVE
    }
}

function main() {
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    let adding_body = null;
    let pause = true
    let bodies = []
    // sun
    bodies.push(new Body(1.99e33, new Vector(0, 0)))
    // earth
    // const v_earth = -37983549.0706
    bodies.push(new Body(5.97e29, new Vector(92 * dist_scale, 0), new Vector(0, -37983549.0706 + -13000000)))
    bodies.push(new Body(5.97e29, new Vector(-92 * dist_scale, 0), new Vector(0, -37983549.0706 + 10000000)))
    // moon ?!
    // bodies.push(new Body(7.35e22, new Vector((400 + 92 - 6.1) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, -37983549.0706 - 1.5 * 2555031)))
    let adding = false;
    canvas.addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect()
        const click_pos = new Vector(e.clientX - rect.left, e.clientY - rect.top)
        if(!adding) {
            adding_body = new Body(1e33, to_physics_vect(click_pos))
        }
        else {
            adding_body.vel = sub(to_physics_vect(click_pos), adding_body.pos)
            bodies.push(adding_body)
        }
        adding = !adding
    })
    const step = () => {
        if(!pause) {
            for(let i = 0; i < bodies.length; ++i) {
                bodies[i].acc = new Vector(0, 0)
            }
            for(let i = 0; i < bodies.length; ++i) {
                for(let j = i + 1; j < bodies.length; ++j) {
                    bodies[i].interact(bodies[j])
                    bodies[j].interact(bodies[i])
                }
            }
        }   
        render()
        if(!pause) {
            for(let i = 0; i < bodies.length; ++i) {
                bodies[i].integrate()
            }
        }
        // 1000 / FRAMERATE converts frames per second to ms per frame
        setTimeout(step, 1000 / FRAMERATE)
    }
    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // draw circle to show approx orbital path
        // ctx.beginPath()
        // ctx.arc(400, 400, 92, 0, 2 * Math.PI)
        // ctx.stroke()
        if(adding_body) {
            draw_pos(ctx, adding_body)
        }
        for(let i = 0; i < bodies.length; ++i) {
            draw_pos(ctx, bodies[i])
            draw_vel(ctx, bodies[i])
            draw_acc(ctx, bodies[i])
        }
    }
    render()
    const step_btn = document.getElementById('step')
    const play_btn = document.getElementById('play')
    const add_body_form = document.getElementById('add_body_form')
    step_btn.addEventListener('click', () => {
        if(pause) {
            step()
        }
    })
    play_btn.addEventListener('click', () => {
        pause = !pause;
        if(pause) {
            play_btn.innerText = 'Play'
        }
        else {
            play_btn.innerText = 'Pause'
            step()
        }
    })
    add_body_form.addEventListener('submit', handle_add_body)
    canvas.addEventListener('keypress', handle_keypress)
}

main()