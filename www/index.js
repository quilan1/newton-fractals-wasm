import { Config, render } from "newton_web";
import { memory } from "newton_web/newtons_method_bg.wasm";

const canvas = document.getElementById("fractal");
const polynomial = document.getElementById("polynomial");
const method = document.getElementById("method");
const loopmax = document.getElementById("loopmax");
const resolution = document.getElementById("resolution");
const saturation = document.getElementById("saturation");
const showloops = document.getElementById("showloops");
const render_button = document.getElementById("render");
const render_time = document.getElementById("render_time");

canvas.height = 800;
canvas.width = 800;

render_button.addEventListener("click", () => render_func(), true);

const render_func = () => {
    let width = resolution.value, height = resolution.value;
    let config = Config.new(width, height, loopmax.value, saturation.value, showloops.value);

    let formula = getFormula();

    let start = performance.now();
    let image = render(formula, config, method.value);
    let end = performance.now();
    render_time.value = "Render time: " + Math.round(end - start) + " ms";

    drawImage(image, width, height);
}

const drawImage = (image, width, height) => {
    let bufferSize = 4 * width * height;
    let usub = new Uint8ClampedArray(memory.buffer, image.buffer(), bufferSize);
    let img = new ImageData(usub, width, height);

    var ctx = canvas.getContext("2d");
    ctx.putImageData(img, 0, 0);

    var imageObject=new Image();
    imageObject.onload=function(){
        ctx.save();
        ctx.scale(canvas.width / width, canvas.height / height);
        ctx.drawImage(imageObject, 0, 0);
        ctx.restore();
    }
    imageObject.src=canvas.toDataURL();
}

const getFormula = () => {
    var coef = [];
    var pow = [];
    for(var i=0; i<16; ++i) {
        coef.push(document.getElementById("z" + i).value);
        pow.push(i);
    }
    return coef.join(", ") + " | " + pow.join(", ");
}