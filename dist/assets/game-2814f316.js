class f{constructor(){this.gameState="menu",this.score=0,this.highScore=0,this.dog={y:150,velocity:0},this.obstacles=[],this.animationId=null,this.pixelDogImage=null,this.dogImageLoaded=!1,this.sounds={},this.soundEnabled=!0,this.CANVAS_WIDTH=800,this.CANVAS_HEIGHT=600,this.DOG_SIZE=50,this.OBSTACLE_WIDTH=60,this.GAP_SIZE=150,this.GRAVITY=.6,this.JUMP_STRENGTH=-12,this.OBSTACLE_SPEED=3,this.gameLoop=()=>{this.updateGame(),this.draw(),this.animationId=requestAnimationFrame(this.gameLoop)},this.canvas=document.createElement("canvas"),this.canvas.width=this.CANVAS_WIDTH,this.canvas.height=this.CANVAS_HEIGHT,this.canvas.style.border="4px solid #2c3e50",this.canvas.style.borderRadius="0px",this.canvas.style.display="block",this.canvas.style.margin="0 auto",this.canvas.style.cursor="pointer",this.canvas.style.boxShadow=`
            inset 2px 2px 0px #ffffff,
            inset -2px -2px 0px #adb5bd,
            4px 4px 0px #2c3e50
        `,this.canvas.style.imageRendering="pixelated",this.canvas.style.background="linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)",this.ctx=this.canvas.getContext("2d");const t=localStorage.getItem("flappydog-highscore");t&&(this.highScore=parseInt(t,10)),this.canvas.addEventListener("click",()=>this.handleInput()),document.addEventListener("keydown",i=>{i.code==="Space"&&(i.preventDefault(),this.handleInput())}),document.body.innerHTML=`
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            ">
                <!-- Retro Pixel Game Header -->
                <div style="
                    border: 4px solid #2c3e50;
                    border-style: solid;
                    border-image: none;
                    padding: 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    width: 800px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd,
                        4px 4px 0px #2c3e50;
                    image-rendering: pixelated;
                    font-family: 'Courier New', monospace;
                ">
                    <h3 style="
                        margin: 0; 
                        font-size: 20px; 
                        color: #2c3e50; 
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                        text-shadow: 
                            1px 1px 0px #ffffff,
                            2px 2px 0px #adb5bd;
                        letter-spacing: 2px;
                    ">FLAPPY DOG</h3>
                    <div style="display: flex; gap: 8px;">
                        <button id="soundBtn" style="
                            padding: 10px 14px;
                            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                            color: white;
                            border: 3px solid #1e8449;
                            border-style: solid;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            text-shadow: 1px 1px 0px #1e8449;
                            box-shadow: 
                                inset 1px 1px 0px rgba(255,255,255,0.3),
                                inset -1px -1px 0px rgba(0,0,0,0.3),
                                2px 2px 0px #1e8449;
                            image-rendering: pixelated;
                            letter-spacing: 1px;
                        ">🔊 SOUND</button>
                        <button id="resetBtn" style="
                            padding: 10px 14px;
                            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                            color: white;
                            border: 3px solid #a93226;
                            border-style: solid;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                            font-family: 'Courier New', monospace;
                            text-shadow: 1px 1px 0px #a93226;
                            box-shadow: 
                                inset 1px 1px 0px rgba(255,255,255,0.3),
                                inset -1px -1px 0px rgba(0,0,0,0.3),
                                2px 2px 0px #a93226;
                            image-rendering: pixelated;
                            letter-spacing: 1px;
                        ">RESET</button>
                    </div>
                </div>
                
                <!-- Retro Pixel Game Canvas Container -->
                <div id="game-container" style="
                    border: 4px solid #2c3e50;
                    border-top: none;
                    border-bottom: none;
                    background: linear-gradient(45deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 12px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd;
                    image-rendering: pixelated;
                "></div>
                
                <!-- Retro Pixel Instructions Footer -->
                <div style="
                    border: 4px solid #2c3e50;
                    padding: 15px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    width: 800px;
                    text-align: center;
                    box-shadow: 
                        inset 2px 2px 0px #ffffff,
                        inset -2px -2px 0px #adb5bd,
                        4px 4px 0px #2c3e50;
                    image-rendering: pixelated;
                    font-family: 'Courier New', monospace;
                ">
                    <div id="instructions" style="
                        font-size: 14px;
                        color: #2c3e50;
                        margin-bottom: 8px;
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                        text-shadow: 1px 1px 0px #ffffff;
                        letter-spacing: 1px;
                    ">CLICK CANVAS OR PRESS SPACE TO START FLYING!</div>
                    <div id="scoreDisplay" style="
                        font-size: 12px;
                        color: #495057;
                        font-family: 'Courier New', monospace;
                        font-weight: bold;
                        text-shadow: 1px 1px 0px #ffffff;
                        letter-spacing: 1px;
                    ">CURRENT: ${this.score} • BEST: ${this.highScore} • NAVIGATE THROUGH THE OBSTACLES!</div>
                </div>
            </div>
        `,document.getElementById("game-container").appendChild(this.canvas),document.getElementById("resetBtn").addEventListener("click",()=>{this.resetGame()}),document.getElementById("soundBtn").addEventListener("click",()=>{this.toggleSound()}),this.loadPixelDog(),this.initializeSounds(),this.gameLoop(),console.log("Working FlappyDog initialized successfully!")}loadPixelDog(){this.pixelDogImage=new Image,this.pixelDogImage.onload=()=>{this.dogImageLoaded=!0,console.log("Pixel dog sprite loaded!")},this.pixelDogImage.onerror=()=>{console.warn("Pixel dog sprite failed to load, using fallback"),this.dogImageLoaded=!1},this.pixelDogImage.src="/pixeldog.png"}initializeSounds(){try{const t=new(window.AudioContext||window.webkitAudioContext);this.generateSound("flap",t,200,.1,"sine"),this.generateSound("score",t,400,.2,"sine"),this.generateSound("gameover",t,150,.5,"sawtooth"),console.log("Sounds initialized successfully!")}catch(t){console.warn("Audio not supported:",t),this.soundEnabled=!1}}generateSound(t,i,e,s,o){const l=i.sampleRate,h=l*s,r=i.createBuffer(1,h,l).getChannelData(0);for(let a=0;a<h;a++){const n=a/l;let c=0;o==="sine"?c=Math.sin(2*Math.PI*e*n):o==="sawtooth"&&(c=2*(n*e-Math.floor(n*e+.5)));const p=Math.exp(-n*3);r[a]=c*p*.3}const x=new Audio;x.volume=.3,this.sounds[t]=x}playSound(t){if(this.soundEnabled)try{const i=new(window.AudioContext||window.webkitAudioContext),e=i.createOscillator(),s=i.createGain();switch(e.connect(s),s.connect(i.destination),e.type="square",t){case"flap":e.frequency.setValueAtTime(400,i.currentTime),e.frequency.exponentialRampToValueAtTime(600,i.currentTime+.08),s.gain.setValueAtTime(.08,i.currentTime),s.gain.exponentialRampToValueAtTime(.01,i.currentTime+.08),e.start(),e.stop(i.currentTime+.08);break;case"score":e.frequency.setValueAtTime(523,i.currentTime),e.frequency.setValueAtTime(659,i.currentTime+.08),e.frequency.setValueAtTime(784,i.currentTime+.16),s.gain.setValueAtTime(.12,i.currentTime),s.gain.exponentialRampToValueAtTime(.01,i.currentTime+.25),e.start(),e.stop(i.currentTime+.25);break;case"gameover":e.frequency.setValueAtTime(300,i.currentTime),e.frequency.exponentialRampToValueAtTime(150,i.currentTime+.4),s.gain.setValueAtTime(.1,i.currentTime),s.gain.exponentialRampToValueAtTime(.01,i.currentTime+.4),e.start(),e.stop(i.currentTime+.4);break}}catch(i){console.warn("Could not play sound:",i)}}toggleSound(){this.soundEnabled=!this.soundEnabled;const t=document.getElementById("soundBtn");t&&(t.textContent=this.soundEnabled?"🔊 SOUND":"🔇 MUTED",t.style.background=this.soundEnabled?"linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)":"linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)",t.style.borderColor=this.soundEnabled?"#1e8449":"#5d6d7e",t.style.boxShadow=this.soundEnabled?`inset 1px 1px 0px rgba(255,255,255,0.3),
                 inset -1px -1px 0px rgba(0,0,0,0.3),
                 2px 2px 0px #1e8449`:`inset 1px 1px 0px rgba(255,255,255,0.3),
                 inset -1px -1px 0px rgba(0,0,0,0.3),
                 2px 2px 0px #5d6d7e`),console.log("Sound",this.soundEnabled?"enabled":"disabled")}handleInput(){this.gameState==="menu"?this.startGame():this.gameState==="playing"?this.jump():this.gameState==="gameOver"&&this.resetGame(),this.updateInstructions()}startGame(){this.gameState="playing",this.score=0,this.dog={y:this.CANVAS_HEIGHT/2,velocity:0},this.obstacles=[],this.updateScoreDisplay(),console.log("Game started")}jump(){this.dog.velocity=this.JUMP_STRENGTH,this.playSound("flap")}resetGame(){this.gameState="menu",this.dog={y:this.CANVAS_HEIGHT/2,velocity:0},this.obstacles=[],this.score=0,this.updateScoreDisplay(),this.updateInstructions()}updateInstructions(){const t=document.getElementById("instructions");t&&(this.gameState==="menu"?t.textContent="Click canvas or press Space to start flying!":this.gameState==="playing"?t.textContent="Click or Space to flap • Avoid the obstacles!":this.gameState==="gameOver"&&(t.textContent="Game Over! Click or Space to restart"))}updateScoreDisplay(){const t=document.getElementById("scoreDisplay");t&&(t.textContent=`Current: ${this.score} • Best: ${this.highScore} • Navigate through the obstacles!`)}updateGame(){this.gameState==="playing"&&(this.dog.velocity+=this.GRAVITY,this.dog.y+=this.dog.velocity,this.obstacles.forEach(t=>{t.x-=this.OBSTACLE_SPEED,!t.passed&&t.x+this.OBSTACLE_WIDTH<100&&(t.passed=!0,this.score++,this.updateScoreDisplay(),this.playSound("score"),console.log("Score:",this.score))}),this.obstacles=this.obstacles.filter(t=>t.x>-this.OBSTACLE_WIDTH),(this.obstacles.length===0||this.obstacles[this.obstacles.length-1].x<this.CANVAS_WIDTH-300)&&this.obstacles.push({x:this.CANVAS_WIDTH,gapY:100+Math.random()*(this.CANVAS_HEIGHT-300),passed:!1}),this.checkCollisions()&&this.gameOver())}checkCollisions(){if(this.dog.y<=0||this.dog.y+this.DOG_SIZE>=this.CANVAS_HEIGHT)return!0;for(const t of this.obstacles)if(100+this.DOG_SIZE>t.x&&100<t.x+this.OBSTACLE_WIDTH&&(this.dog.y<t.gapY||this.dog.y+this.DOG_SIZE>t.gapY+this.GAP_SIZE))return!0;return!1}gameOver(){this.gameState="gameOver",this.playSound("gameover"),this.score>this.highScore&&(this.highScore=this.score,localStorage.setItem("flappydog-highscore",this.highScore.toString()),console.log("New high score:",this.highScore)),this.updateScoreDisplay(),this.updateInstructions()}draw(){this.ctx.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.drawBackground(),this.gameState==="menu"?this.drawMenu():this.gameState==="playing"?this.drawGame():this.gameState==="gameOver"&&this.drawGameOver()}drawBackground(){const t=this.ctx.createLinearGradient(0,0,0,this.CANVAS_HEIGHT);t.addColorStop(0,"#87CEEB"),t.addColorStop(.3,"#98D8E8"),t.addColorStop(.7,"#B0E0E6"),t.addColorStop(1,"#E0F6FF"),this.ctx.fillStyle=t,this.ctx.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT);const i=Date.now()*5e-4;this.ctx.fillStyle="rgba(255, 255, 255, 0.4)";for(let e=0;e<4;e++){const s=e*200+i*10%(this.CANVAS_WIDTH+100)-100,o=40+e*25;this.drawPixelCloud(s,o,80,40)}this.ctx.fillStyle="rgba(255, 255, 255, 0.6)";for(let e=0;e<3;e++){const s=e*250+i*20%(this.CANVAS_WIDTH+120)-120,o=80+e*40;this.drawPixelCloud(s,o,100,50)}this.ctx.fillStyle="rgba(255, 255, 255, 0.8)";for(let e=0;e<3;e++){const s=e*180+i*35%(this.CANVAS_WIDTH+80)-80,o=120+e*35;this.drawPixelCloud(s,o,70,35)}this.ctx.fillStyle="rgba(255, 255, 255, 0.7)";for(let e=0;e<15;e++){const s=(e*53+i*5)%this.CANVAS_WIDTH,o=e*37%(this.CANVAS_HEIGHT*.6);this.ctx.fillRect(s,o,2,2)}this.ctx.fillStyle="rgba(34, 139, 34, 0.3)";for(let e=0;e<this.CANVAS_WIDTH;e+=20){const s=40+Math.sin(e*.02)*20;this.ctx.fillRect(e,this.CANVAS_HEIGHT-s,20,s)}this.ctx.fillStyle="rgba(34, 139, 34, 0.5)";for(let e=0;e<this.CANVAS_WIDTH;e+=4)Math.random()>.7&&this.ctx.fillRect(e,this.CANVAS_HEIGHT-8,2,8)}drawPixelCloud(t,i,e,s){const l=Math.floor(e/8),h=Math.floor(s/8);for(let d=0;d<l;d++)for(let r=0;r<h;r++){const x=l/2,a=h/2,n=Math.sqrt((d-x)**2+(r-a)**2),c=Math.min(x,a);(n<c*.8||n<c&&Math.random()>.3)&&this.ctx.fillRect(t+d*8,i+r*8,8-1,8-1)}}drawMenu(){this.ctx.fillStyle="#2c3e50",this.ctx.font="bold 48px Arial",this.ctx.textAlign="center",this.ctx.fillText("FlappyDog",this.CANVAS_WIDTH/2,200),this.ctx.font="24px Arial",this.ctx.fillText("Click to Start",this.CANVAS_WIDTH/2,280);const t=350+Math.sin(Date.now()*.003)*10;this.drawDog(this.CANVAS_WIDTH/2-15,t)}drawGame(){this.obstacles.forEach(t=>this.drawObstacle(t)),this.drawDog(100,this.dog.y),this.ctx.fillStyle="#ffffff",this.ctx.font="bold 32px Arial",this.ctx.textAlign="left",this.ctx.strokeStyle="#2c3e50",this.ctx.lineWidth=3,this.ctx.strokeText(`${this.score}`,30,50),this.ctx.fillText(`${this.score}`,30,50)}drawGameOver(){this.obstacles.forEach(t=>this.drawObstacle(t)),this.drawDog(100,this.dog.y),this.ctx.fillStyle="rgba(0, 0, 0, 0.7)",this.ctx.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.ctx.fillStyle="#fff",this.ctx.font="bold 48px Arial",this.ctx.textAlign="center",this.ctx.fillText("Game Over",this.CANVAS_WIDTH/2,250),this.ctx.font="32px Arial",this.ctx.fillText(`Score: ${this.score}`,this.CANVAS_WIDTH/2,300),this.score===this.highScore&&this.score>0&&(this.ctx.fillStyle="#f39c12",this.ctx.font="24px Arial",this.ctx.fillText("NEW RECORD!",this.CANVAS_WIDTH/2,340))}drawDog(t,i){if(this.dogImageLoaded&&this.pixelDogImage){const e=this.DOG_SIZE+20,s=this.DOG_SIZE+20;if(this.gameState==="playing"){this.ctx.save(),this.ctx.translate(t+e/2,i+s/2);const o=Math.max(-.3,Math.min(.3,this.dog.velocity*.03));this.ctx.rotate(o),this.ctx.drawImage(this.pixelDogImage,-e/2,-s/2,e,s),this.ctx.restore()}else{const o=this.gameState==="menu"?Math.sin(Date.now()*.003)*2:0;this.ctx.drawImage(this.pixelDogImage,t,i+o,e,s)}}else this.ctx.fillStyle="#D2B48C",this.ctx.fillRect(t,i,this.DOG_SIZE,this.DOG_SIZE),this.ctx.fillStyle="#DDB892",this.ctx.fillRect(t+5,i-8,20,20),this.ctx.fillStyle="#ffffff",this.ctx.fillRect(t+15,i-3,6,6),this.ctx.fillStyle="#000000",this.ctx.fillRect(t+17,i-1,2,2),this.ctx.fillStyle="#000000",this.ctx.fillRect(t+22,i+3,2,2),this.ctx.fillStyle="#CD853F",this.ctx.fillRect(t+8,i-12,4,8),this.ctx.fillRect(t+18,i-12,4,8)}drawObstacle(t){this.ctx.fillStyle="#228B22",this.ctx.fillRect(t.x,0,this.OBSTACLE_WIDTH,t.gapY),this.ctx.fillRect(t.x,t.gapY+this.GAP_SIZE,this.OBSTACLE_WIDTH,this.CANVAS_HEIGHT-t.gapY-this.GAP_SIZE),this.ctx.fillStyle="#32CD32",this.ctx.fillRect(t.x-5,t.gapY-20,this.OBSTACLE_WIDTH+10,20),this.ctx.fillRect(t.x-5,t.gapY+this.GAP_SIZE,this.OBSTACLE_WIDTH+10,20)}destroy(){this.animationId&&cancelAnimationFrame(this.animationId)}}export{f as W};
