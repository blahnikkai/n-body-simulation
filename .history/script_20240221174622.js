class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

class Body {
    
    constructor(mass, pos, vel) {
        this.mass = mass
        this.pos = pos
        this.vel = vel
    }
}

function main() {
    canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    ctx.arc(150, 150, 10, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    
}

main()