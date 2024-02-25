canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.arc(0, 0, 40, 0, 2 * Math.PI)
ctx.stroke()