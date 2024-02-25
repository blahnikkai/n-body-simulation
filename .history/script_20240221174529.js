class 

class Body {
    
    constructor(x, y, mass) {
        this.x = x
        this.y = y
        this.mass = mass
        this.v = 
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