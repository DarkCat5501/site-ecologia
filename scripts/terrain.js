let seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
function nrand() {
    return random()*2.0 - 1.0
}
let rseed = random();
function rsin(x,n) {
	let output = 0;
	for(let i=1;i<=n;i++){
		if(i%2){
			output += (Math.cos(2*i*x)*0.5+0.5)/i;
		} else {
			output += (Math.sin(10*i*x)*0.5+0.5)/i;
		}
	}
	return output;
}


const canvas = document.getElementById("mainCanvas");
const content = document.getElementById("content");
/** @type {CanvasRenderingheightContext2D} */
const ctx = canvas.getContext("2d");

function angleToPoint(r,angle){
	return { x:r * Math.cos(angle),y: r * Math.sin(angle)};
}


function updateCanvas(){
	const { x,y,width,height } = content.getBoundingClientRect();
	const aspect = width/height;
	canvas.width = 900 * aspect;
	canvas.height = 900;
	//canvas.style.setProperty("--position-x",`${x}px`);
	//canvas.style.setProperty("--position-y",`${y}px`);
	//canvas.style.setProperty("--position-z",`-3`);
	return {x,y,width,height};
}

function randomHsv(bH, bS, bV, d){
	const [r1,r2,r3] = [nrand(),nrand(),nrand()]
	return `hsl(${bH+r1*d},${bS+r2*d}%,${bV+r3*d}%)`
}

function drawClouds(offset=1,n=3){
	const h = canvas.height;
	const w = canvas.width;
	
	ctx.fillStyle = randomHsv(217,20,98,7);
	for(let i=0;i<n;i++){
		const r = 50 + nrand()*20
		const l = (offset+500*rseed) % (w+6*r)
		const x = (w + nrand()*r-l)+(3*r);
		const y = nrand()*50+10*rsin(x/500,3);
		ctx.beginPath();
    	ctx.ellipse(x,h/3+y,r,r,0,0,2 * Math.PI);
		ctx.fill();
	}
}

function drawTerrain(depth){
	const h = canvas.height;
	const w = canvas.width;
	ctx.fillStyle = randomHsv(88,53,31,8);
	ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(0, h);

	const S = 80;
	const offset = random()*100+nrand()*rseed;
	for(let i=0;i<=S;i++){
		ctx.lineTo(w/S*i, h-(rsin(i/S+offset,4)*100)-depth);
	}
	ctx.stroke();
    ctx.fill();
}


function drawLeaf(x,y){
		// Draw the ellipse
	const [r1, r2, r3,r4] = [ 
		0.3*random(),
		0.7 + (random()*0.2),
		random()*0.2,
		30+random()*20]
	// const { x:dx, y:dy } = angleToPoint(r4*1.5,angle)
	// ctx.strokeStyle="brown"
	// ctx.beginPath();
	// ctx.setLineDash([10, 5]);
	// ctx.moveTo(x-dy, y+dx);
	// ctx.lineTo(x+dy, y-dx);
	// ctx.stroke();
}

function loop(delta){	
	const ski = ctx.createLinearGradient(0,0,0,canvas.height);
	ski.addColorStop(0,"hsl(173,53%,53%)")
	ski.addColorStop(1,"hsl(173,53%,77%)")
	ctx.fillStyle=ski;
	ctx.fillRect(0,0,canvas.width,canvas.height);

	seed = 1;
	rseed += delta*0.33;
	drawTerrain(150);
	drawTerrain(50);
	drawTerrain(0);

	drawClouds(canvas.width/3,12);
	drawClouds(2*canvas.width/3,6);
	drawClouds(-canvas.width/3,7);

	//drawTerrain();
	// let r=500.0;
	// for(let t=0; t<4*Math.PI; t+=0.1){
	// 	const {x,y} = angleToPoint(r,t);
	// 	drawLeaf(width/2 + x, height/2 + y);
	// 	r-=3.0
	// }


	// for(let i=width;i>width/2;i-= width/20){
	// 	for(let j=10;j<height+10;j += height/15){
	// 	}
	// }

	// ctx.fillStyle="red";
	// ctx.beginPath();
	// ctx.ellipse(width/2,height/2,100,100,0,2*Math.PI);
	// ctx.stroke();



	// // Draw the ellipse's line of reflection
	// ctx.beginPath();
	// ctx.setLineDash([5, 5]);
	// ctx.moveTo(0, 200);
	// ctx.lineTo(200, 0);
	// ctx.stroke();
	//ctx.fillRect(10,10,width-20,height-20);
}

function main(){
	let deltaStart = 0;
	updateCanvas();
	window.addEventListener("resize",()=>{
		updateCanvas();
	});

	const runFrame = (timestamp) => {
		const fps =  timestamp - deltaStart;
		loop(fps/1000 );
		deltaStart = timestamp;
		requestAnimationFrame(runFrame);
	}
	requestAnimationFrame(runFrame)
}

exports.main = main;