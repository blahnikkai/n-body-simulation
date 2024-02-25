canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.arc(50, 50, 40, 0, 2 * Math.PI)
ctx.stroke()