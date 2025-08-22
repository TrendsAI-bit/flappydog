class x{constructor(){this.gameState="menu",this.score=0,this.highScore=0,this.dog={y:150,velocity:0},this.obstacles=[],this.animationId=null,this.pixelDogImage=null,this.dogImageLoaded=!1,this.sounds={},this.soundEnabled=!0,this.CANVAS_WIDTH=800,this.CANVAS_HEIGHT=600,this.DOG_SIZE=50,this.OBSTACLE_WIDTH=60,this.GAP_SIZE=150,this.GRAVITY=.6,this.JUMP_STRENGTH=-12,this.OBSTACLE_SPEED=3,this.gameLoop=()=>{this.updateGame(),this.draw(),this.animationId=requestAnimationFrame(this.gameLoop)},this.canvas=document.createElement("canvas"),this.canvas.width=this.CANVAS_WIDTH,this.canvas.height=this.CANVAS_HEIGHT,this.canvas.style.border="3px solid #2c3e50",this.canvas.style.borderRadius="8px",this.canvas.style.display="block",this.canvas.style.margin="20px auto",this.canvas.style.cursor="pointer",this.canvas.style.boxShadow="0 4px 8px rgba(0,0,0,0.2)",this.canvas.style.imageRendering="pixelated",this.ctx=this.canvas.getContext("2d");const t=localStorage.getItem("flappydog-highscore");t&&(this.highScore=parseInt(t,10)),this.canvas.addEventListener("click",()=>this.handleInput()),document.addEventListener("keydown",e=>{e.code==="Space"&&(e.preventDefault(),this.handleInput())}),document.body.innerHTML=`
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
                <!-- Game Header -->
                <div style="
                    border: 2px solid #2c3e50;
                    border-radius: 8px 8px 0 0;
                    padding: 15px;
                    background: white;
                    width: 800px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <h3 style="margin: 0; font-size: 18px; color: #2c3e50; font-weight: bold;">FlappyDog</h3>
                    <div style="display: flex; gap: 10px;">
                        <button id="soundBtn" style="
                            padding: 8px 16px;
                            background: #27ae60;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        ">🔊 Sound</button>
                        <button id="resetBtn" style="
                            padding: 8px 16px;
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                        ">Reset</button>
                    </div>
                </div>
                
                <!-- Game Canvas Container -->
                <div id="game-container" style="
                    border: 2px solid #2c3e50;
                    border-top: none;
                    border-bottom: none;
                    background: white;
                    padding: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 8px rgba(0,0,0,0.1);
                "></div>
                
                <!-- Instructions -->
                <div style="
                    border: 2px solid #2c3e50;
                    border-radius: 0 0 8px 8px;
                    padding: 15px;
                    background: white;
                    width: 800px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <div id="instructions" style="
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 8px;
                    ">Click canvas or press Space to start flying!</div>
                    <div id="scoreDisplay" style="
                        font-size: 12px;
                        color: #999;
                    ">Current: ${this.score} • Best: ${this.highScore} • Navigate through the obstacles!</div>
                </div>
            </div>
        `,document.getElementById("game-container").appendChild(this.canvas),document.getElementById("resetBtn").addEventListener("click",()=>{this.resetGame()}),document.getElementById("soundBtn").addEventListener("click",()=>{this.toggleSound()}),this.loadPixelDog(),this.initializeSounds(),this.gameLoop(),console.log("Working FlappyDog initialized successfully!")}loadPixelDog(){this.pixelDogImage=new Image,this.pixelDogImage.onload=()=>{this.dogImageLoaded=!0,console.log("Pixel dog sprite loaded!")},this.pixelDogImage.onerror=()=>{console.warn("Pixel dog sprite failed to load, using fallback"),this.dogImageLoaded=!1},this.pixelDogImage.src="/pixeldog.png"}initializeSounds(){try{const t=new(window.AudioContext||window.webkitAudioContext);this.generateSound("flap",t,200,.1,"sine"),this.generateSound("score",t,400,.2,"sine"),this.generateSound("gameover",t,150,.5,"sawtooth"),console.log("Sounds initialized successfully!")}catch(t){console.warn("Audio not supported:",t),this.soundEnabled=!1}}generateSound(t,e,i,s,o){const l=e.sampleRate,c=l*s,d=e.createBuffer(1,c,l).getChannelData(0);for(let a=0;a<c;a++){const n=a/l;let h=0;o==="sine"?h=Math.sin(2*Math.PI*i*n):o==="sawtooth"&&(h=2*(n*i-Math.floor(n*i+.5)));const g=Math.exp(-n*3);d[a]=h*g*.3}const r=new Audio;r.volume=.3,this.sounds[t]=r}playSound(t){if(this.soundEnabled)try{const e=new(window.AudioContext||window.webkitAudioContext),i=e.createOscillator(),s=e.createGain();switch(i.connect(s),s.connect(e.destination),t){case"flap":i.frequency.setValueAtTime(300,e.currentTime),s.gain.setValueAtTime(.1,e.currentTime),s.gain.exponentialRampToValueAtTime(.01,e.currentTime+.1),i.start(),i.stop(e.currentTime+.1);break;case"score":i.frequency.setValueAtTime(500,e.currentTime),s.gain.setValueAtTime(.2,e.currentTime),s.gain.exponentialRampToValueAtTime(.01,e.currentTime+.3),i.start(),i.stop(e.currentTime+.3);break;case"gameover":i.frequency.setValueAtTime(150,e.currentTime),i.type="sawtooth",s.gain.setValueAtTime(.3,e.currentTime),s.gain.exponentialRampToValueAtTime(.01,e.currentTime+.8),i.start(),i.stop(e.currentTime+.8);break}}catch(e){console.warn("Could not play sound:",e)}}toggleSound(){this.soundEnabled=!this.soundEnabled;const t=document.getElementById("soundBtn");t&&(t.textContent=this.soundEnabled?"🔊 Sound":"🔇 Muted",t.style.background=this.soundEnabled?"#27ae60":"#7f8c8d"),console.log("Sound",this.soundEnabled?"enabled":"disabled")}handleInput(){this.gameState==="menu"?this.startGame():this.gameState==="playing"?this.jump():this.gameState==="gameOver"&&this.resetGame(),this.updateInstructions()}startGame(){this.gameState="playing",this.score=0,this.dog={y:this.CANVAS_HEIGHT/2,velocity:0},this.obstacles=[],this.updateScoreDisplay(),console.log("Game started")}jump(){this.dog.velocity=this.JUMP_STRENGTH,this.playSound("flap")}resetGame(){this.gameState="menu",this.dog={y:this.CANVAS_HEIGHT/2,velocity:0},this.obstacles=[],this.score=0,this.updateScoreDisplay(),this.updateInstructions()}updateInstructions(){const t=document.getElementById("instructions");t&&(this.gameState==="menu"?t.textContent="Click canvas or press Space to start flying!":this.gameState==="playing"?t.textContent="Click or Space to flap • Avoid the obstacles!":this.gameState==="gameOver"&&(t.textContent="Game Over! Click or Space to restart"))}updateScoreDisplay(){const t=document.getElementById("scoreDisplay");t&&(t.textContent=`Current: ${this.score} • Best: ${this.highScore} • Navigate through the obstacles!`)}updateGame(){this.gameState==="playing"&&(this.dog.velocity+=this.GRAVITY,this.dog.y+=this.dog.velocity,this.obstacles.forEach(t=>{t.x-=this.OBSTACLE_SPEED,!t.passed&&t.x+this.OBSTACLE_WIDTH<100&&(t.passed=!0,this.score++,this.updateScoreDisplay(),this.playSound("score"),console.log("Score:",this.score))}),this.obstacles=this.obstacles.filter(t=>t.x>-this.OBSTACLE_WIDTH),(this.obstacles.length===0||this.obstacles[this.obstacles.length-1].x<this.CANVAS_WIDTH-300)&&this.obstacles.push({x:this.CANVAS_WIDTH,gapY:100+Math.random()*(this.CANVAS_HEIGHT-300),passed:!1}),this.checkCollisions()&&this.gameOver())}checkCollisions(){if(this.dog.y<=0||this.dog.y+this.DOG_SIZE>=this.CANVAS_HEIGHT)return!0;for(const t of this.obstacles)if(100+this.DOG_SIZE>t.x&&100<t.x+this.OBSTACLE_WIDTH&&(this.dog.y<t.gapY||this.dog.y+this.DOG_SIZE>t.gapY+this.GAP_SIZE))return!0;return!1}gameOver(){this.gameState="gameOver",this.playSound("gameover"),this.score>this.highScore&&(this.highScore=this.score,localStorage.setItem("flappydog-highscore",this.highScore.toString()),console.log("New high score:",this.highScore)),this.updateScoreDisplay(),this.updateInstructions()}draw(){this.ctx.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.drawBackground(),this.gameState==="menu"?this.drawMenu():this.gameState==="playing"?this.drawGame():this.gameState==="gameOver"&&this.drawGameOver()}drawBackground(){const t=this.ctx.createLinearGradient(0,0,0,this.CANVAS_HEIGHT);t.addColorStop(0,"#87CEEB"),t.addColorStop(1,"#E0F6FF"),this.ctx.fillStyle=t,this.ctx.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.ctx.fillStyle="#ffffff";for(let e=0;e<5;e++){const i=e*150+50,s=30+e*30%80;this.ctx.fillRect(i,s,60,30),this.ctx.fillRect(i+15,s-15,30,30),this.ctx.fillRect(i+30,s-20,20,35)}}drawMenu(){this.ctx.fillStyle="#2c3e50",this.ctx.font="bold 48px Arial",this.ctx.textAlign="center",this.ctx.fillText("FlappyDog",this.CANVAS_WIDTH/2,200),this.ctx.font="24px Arial",this.ctx.fillText("Click to Start",this.CANVAS_WIDTH/2,280);const t=350+Math.sin(Date.now()*.003)*10;this.drawDog(this.CANVAS_WIDTH/2-15,t)}drawGame(){this.obstacles.forEach(t=>this.drawObstacle(t)),this.drawDog(100,this.dog.y),this.ctx.fillStyle="#ffffff",this.ctx.font="bold 32px Arial",this.ctx.textAlign="left",this.ctx.strokeStyle="#2c3e50",this.ctx.lineWidth=3,this.ctx.strokeText(`${this.score}`,30,50),this.ctx.fillText(`${this.score}`,30,50)}drawGameOver(){this.obstacles.forEach(t=>this.drawObstacle(t)),this.drawDog(100,this.dog.y),this.ctx.fillStyle="rgba(0, 0, 0, 0.7)",this.ctx.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.ctx.fillStyle="#fff",this.ctx.font="bold 48px Arial",this.ctx.textAlign="center",this.ctx.fillText("Game Over",this.CANVAS_WIDTH/2,250),this.ctx.font="32px Arial",this.ctx.fillText(`Score: ${this.score}`,this.CANVAS_WIDTH/2,300),this.score===this.highScore&&this.score>0&&(this.ctx.fillStyle="#f39c12",this.ctx.font="24px Arial",this.ctx.fillText("NEW RECORD!",this.CANVAS_WIDTH/2,340))}drawDog(t,e){if(this.dogImageLoaded&&this.pixelDogImage){const i=this.DOG_SIZE+20,s=this.DOG_SIZE+20;if(this.gameState==="playing"){this.ctx.save(),this.ctx.translate(t+i/2,e+s/2);const o=Math.max(-.3,Math.min(.3,this.dog.velocity*.03));this.ctx.rotate(o),this.ctx.drawImage(this.pixelDogImage,-i/2,-s/2,i,s),this.ctx.restore()}else{const o=this.gameState==="menu"?Math.sin(Date.now()*.003)*2:0;this.ctx.drawImage(this.pixelDogImage,t,e+o,i,s)}}else this.ctx.fillStyle="#D2B48C",this.ctx.fillRect(t,e,this.DOG_SIZE,this.DOG_SIZE),this.ctx.fillStyle="#DDB892",this.ctx.fillRect(t+5,e-8,20,20),this.ctx.fillStyle="#ffffff",this.ctx.fillRect(t+15,e-3,6,6),this.ctx.fillStyle="#000000",this.ctx.fillRect(t+17,e-1,2,2),this.ctx.fillStyle="#000000",this.ctx.fillRect(t+22,e+3,2,2),this.ctx.fillStyle="#CD853F",this.ctx.fillRect(t+8,e-12,4,8),this.ctx.fillRect(t+18,e-12,4,8)}drawObstacle(t){this.ctx.fillStyle="#228B22",this.ctx.fillRect(t.x,0,this.OBSTACLE_WIDTH,t.gapY),this.ctx.fillRect(t.x,t.gapY+this.GAP_SIZE,this.OBSTACLE_WIDTH,this.CANVAS_HEIGHT-t.gapY-this.GAP_SIZE),this.ctx.fillStyle="#32CD32",this.ctx.fillRect(t.x-5,t.gapY-20,this.OBSTACLE_WIDTH+10,20),this.ctx.fillRect(t.x-5,t.gapY+this.GAP_SIZE,this.OBSTACLE_WIDTH+10,20)}destroy(){this.animationId&&cancelAnimationFrame(this.animationId)}}export{x as W};
