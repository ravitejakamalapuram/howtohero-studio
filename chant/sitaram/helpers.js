const rnd=(s)=>{let x=Math.sin(s*127.1)*43758.5453;return x-Math.floor(x)};const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
function halo(x,y,r,a){const gr=g.createRadialGradient(x,y,r*.4,x,y,r*1.6);gr.addColorStop(0,`rgba(232,176,74,${.35*a})`);gr.addColorStop(1,'rgba(232,176,74,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r*1.6,0,7);g.fill();g.strokeStyle=`rgba(232,176,74,${.8*a})`;g.lineWidth=3;g.beginPath();g.arc(x,y,r,0,7);g.stroke()}
function limb(x1,y1,x2,y2,w,col){g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
function crown(x,y,s,col){g.fillStyle=col;g.beginPath();g.moveTo(x-34*s,y);g.lineTo(x-30*s,y-30*s);g.lineTo(x-14*s,y-14*s);g.lineTo(x,y-46*s);g.lineTo(x+14*s,y-14*s);g.lineTo(x+30*s,y-30*s);g.lineTo(x+34*s,y);g.closePath();g.fill();g.fillStyle='#c0392b';g.beginPath();g.arc(x,y-12*s,5*s,0,7);g.fill()}
function face(x,y,s,skin,t,sm=1){g.fillStyle=skin;g.beginPath();g.ellipse(x,y,32*s,38*s,0,0,7);g.fill();g.fillStyle='#1b1020';for(const d of[-1,1]){g.beginPath();g.ellipse(x+d*12*s,y-4*s,3.5*s,(Math.abs(Math.sin(t*.7))>.98?.5:3)*s,0,0,7);g.fill()}
 g.strokeStyle='#7a3a30';g.lineWidth=2.5*s;g.beginPath();g.arc(x,y+10*s,9*s*sm,.2,Math.PI-.2);g.stroke()}
function god(x,y,t,o){ // standing figure: x,y = feet center
 const s=o.s||1,sw=Math.sin(t*1.2+(o.ph||0))*3;const hy=y-330*s;
 halo(x,hy+sw,62*s,1);
 // legs / dhoti
 g.fillStyle=o.bot;g.beginPath();g.moveTo(x-48*s,y-180*s);g.lineTo(x+48*s,y-180*s);g.lineTo(x+(o.skirt?70:52)*s,y);g.lineTo(x-(o.skirt?70:52)*s,y);g.closePath();g.fill();
 g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(x+k*12*s,y-170*s);g.lineTo(x+k*16*s,y);g.stroke()}
 // torso
 g.fillStyle=o.skin;g.beginPath();g.moveTo(x-44*s,y-300*s);g.lineTo(x+44*s,y-300*s);g.lineTo(x+36*s,y-175*s);g.lineTo(x-36*s,y-175*s);g.closePath();g.fill();
 if(o.top){g.fillStyle=o.top;g.beginPath();g.moveTo(x-44*s,y-300*s);g.lineTo(x+44*s,y-300*s);g.lineTo(x+38*s,y-232*s);g.lineTo(x-38*s,y-232*s);g.closePath();g.fill()}
 // garland
 g.strokeStyle='#f3e9d2';g.lineWidth=5*s;g.beginPath();g.moveTo(x-30*s,y-300*s);g.quadraticCurveTo(x,y-215*s,x+30*s,y-300*s);g.stroke();
 // arms
 const a=o.pose;
 if(a==='bless'){limb(x-44*s,y-292*s,x-96*s,y-240*s+sw,18*s,o.skin);limb(x+44*s,y-292*s,x+84*s,y-340*s-sw,18*s,o.skin);g.fillStyle=o.skin;g.beginPath();g.arc(x+84*s,y-352*s,12*s,0,7);g.fill()}
 else if(a==='bow'){limb(x-44*s,y-292*s,x-110*s,y-250*s,17*s,o.skin);limb(x+44*s,y-292*s,x+104*s,y-370*s,17*s,o.skin);g.strokeStyle='#8a5a2b';g.lineWidth=7*s;g.beginPath();g.arc(x+120*s,y-300*s,100*s,-1.2,1.2);g.stroke();g.lineWidth=2;g.beginPath();g.moveTo(x+120*s+100*s*Math.cos(-1.2),y-300*s+100*s*Math.sin(-1.2));g.lineTo(x+120*s+100*s*Math.cos(1.2),y-300*s+100*s*Math.sin(1.2));g.stroke()}
 else if(a==='sita'){limb(x-44*s,y-292*s,x-86*s,y-232*s+sw,16*s,o.skin);limb(x+44*s,y-292*s,x+92*s,y-250*s-sw,16*s,o.skin)}
 // head
 face(x,hy+sw,s,o.skin,t);
 if(o.hair){g.fillStyle=o.hair;g.beginPath();g.ellipse(x,hy-26*s+sw,34*s,18*s,0,Math.PI,0);g.fill();g.fillRect(x-36*s,hy-26*s+sw,8*s,70*s);g.fillRect(x+28*s,hy-26*s+sw,8*s,70*s)}
 if(o.crown)crown(x,hy-28*s+sw,s*1.15,'#d9a441');
 if(o.bindi){g.fillStyle='#c0392b';g.beginPath();g.arc(x,hy-16*s+sw,3.5*s,0,7);g.fill()}
}
function hanuman(x,y,t){ // kneeling, hands folded
 const s=1,sw=Math.sin(t*1.5)*2;halo(x,y-250,64,1);
 g.strokeStyle='#b8651f';g.lineWidth=22;g.lineCap='round';g.beginPath();g.moveTo(x+60,y-60);g.bezierCurveTo(x+210,y-30+sw*3,x+240,y-330,x+110,y-480-Math.sin(t*1.5)*8);g.bezierCurveTo(x+70,y-500,x+40,y-470,x+60,y-440);g.stroke(); // tail
 g.fillStyle='#8a2b2b';g.beginPath();g.ellipse(x,y-40,150,50,0,0,7);g.fill(); // seat
 g.fillStyle='#d98a3c';g.beginPath();g.ellipse(x,y-120,78,92,0,0,7);g.fill(); // body
 g.fillStyle='#e8c07a';g.beginPath();g.ellipse(x,y-112,44,66,0,0,7);g.fill();
 limb(x-62,y-170,x-26,y-128,20,'#d98a3c');limb(x+62,y-170,x+26,y-128,20,'#d98a3c');g.fillStyle='#e0974a';g.beginPath();g.ellipse(x,y-128,22,16,0,0,7);g.fill(); // folded hands
 g.strokeStyle='#f3e9d2';g.lineWidth=5;g.beginPath();g.moveTo(x-52,y-190);g.quadraticCurveTo(x,y-120,x+52,y-190);g.stroke();
 const hy=y-258+sw;g.fillStyle='#c97a35';g.beginPath();g.ellipse(x,hy,56,52,0,0,7);g.fill();
 g.fillStyle='#e8c07a';g.beginPath();g.ellipse(x,hy+10,38,34,0,0,7);g.fill();
 g.fillStyle='#c97a35';for(const d of[-1,1]){g.beginPath();g.ellipse(x+d*58,hy,13,20,0,0,7);g.fill()}
 g.strokeStyle='#2a1408';g.lineWidth=5;g.lineCap='round';for(const d of[-1,1]){g.beginPath();g.arc(x+d*18,hy-4,9,Math.PI*1.1,Math.PI*1.9);g.stroke()} // happy closed eyes
 g.beginPath();g.arc(x,hy+10,15,.1,Math.PI-.1);g.stroke();
 crown(x,hy-42,1.3,'#d9a441');
}
