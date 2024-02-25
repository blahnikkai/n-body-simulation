const G = 6.67e-11
const DIST_SCALE = 1000000
const TIME_SCALE = 5
const FRAMERATE = 60
let screen_x = 0
let screen_y = 0

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    let bodies = []
    let adding_body = null;
    let pause = true
    // sun
    // bodies.push(new Body(1.99e33, new Vector(400 * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, 0)))
    // earth
    // const v_earth = -37983549.0706
    bodies.push(new Body(5.97e29, new Vector((400 + 92) * DIST_SCALE, 400 * DIST_SCALE), new Vector(0, 0)))
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
            const x_vel = DIST_SCALE * x - adding_body.pos.x
            const y_vel = DIST_SCALE * y - adding_body.pos.y
            adding_body.vel = new Vector(x_vel, y_vel)
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
            adding_body.draw_pos(ctx)
            adding_body.draw_vel(ctx)
        }
        for(let i = 0; i < bodies.length; ++i) {
            bodies[i].draw_pos(ctx)
            bodies[i].draw_vel(ctx)
            bodies[i].draw_acc(ctx)
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
            screen_y -= move
        }
        else if(key == 'a') {
            screen_x -= move
        }
        else if(key == 's') {
            screen_y += move
        }
        else if(key == 'd') {
            screen_x += move
        }
    })
}

main()