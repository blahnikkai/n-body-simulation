canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.arc(150, 150, 40, 0, 2 * Math.PI)
ctx.stroke()