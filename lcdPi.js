// Import the module
const LCD = require('raspberrypi-liquid-crystal')
const exec = require('child_process').exec
const Gpio = require('onoff').Gpio
const http=require('http').createServer(handler)
const fs=require('fs')
const io=require('socket.io')(http)

const pinFan = new Gpio(21, 'out')
const pinToggle = new Gpio(20, 'in', 'both')

var ht_data = []
var cpu_t = ''

const PORT=8080
http.listen(PORT)

function handler(req, res){
    fs.readFile(__dirname+'/public/index.html', (err, data)=>{
        if(err){
            res.writeHead(404, {'Content-Type':'text/html'})
            return res.end("404 found not")
        }
        res.writeHead(200, {'Content-Type':'text/html'})
        res.write(data)
        return res.end()
    })
}
function dht11_read_val() {
    const cmd = `./humid`
    exec(cmd, (err, stdout, stderr) => {
        ht_data = stdout.split(" ")
    })
}
function cpu_read_temperature() {
    const cmd = `vcgencmd measure_temp`
    exec(cmd, (err, stdout, stderr) => {
        cpu_t = stdout.slice(5, 9);
    })
}

io.on('connection', (socket)=>{
    let fanValue=0
    pinToggle.watch((err, val) => {
        if (err) {
            console.log(err)
            return
        }
        if(val==1){
            if(pinFan.readSync()===0){
                pinFan.writeSync(1)
                socket.emit('fan', 0)
            }
            else{
                pinFan.writeSync(0)
                socket.emit('fan', 1)
            }
        }
    })
    socket.on('fan', (data)=>{
        console.log(`fan control: ${data}`)
        if(data==0){
            pinFan.writeSync(0)
        }
        else{
            pinFan.writeSync(1)
        }
    })
})
process.on('SIGINT', ()=>{
    pinFan.writeSync(0)
    pinFan.unexport()
    pinToggle.unexport()
    process.exit()
})

// Instantiate the LCD object on bus 1 address 3f with 16 chars width and 2 lines
const lcd = new LCD(1, 0x27, 16, 2)
// Init the lcd (must be done before calling any other methods)
lcd.beginSync()
function loop() {
    dht11_read_val()
    cpu_read_temperature()
    const dt = new Date()

    let msg0 = `${dt.toTimeString().slice(0, 8)}` + ` T${ht_data[1]}` + "\337C                "
    let msg1 = `H${ht_data[0]}%   ` + `CPU${cpu_t}` + "\337C       "
    lcd.printLineSync(0, msg0)
    lcd.printLineSync(1, msg1)
}
setInterval(loop, 200)


