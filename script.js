document.getElementById('startButton').addEventListener('click',initializeCube);
let solutionMoves = [];
let userMoveCount = 0;
let hasSolvedManually = false;

const Cube = {
    solve: async function(cubeString) {
        try {
            const response = await fetch("https://2c2a8d06-dfda-41e0-8c30-85fc102ed36c-00-xxfq0s326gcs.kirk.replit.dev/solve", {
                
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ cubeString: cubeString })

            });

            const data = await response.json();

            if (data.solution && Array.isArray(data.solution)) {
                console.log("Optimal solution from backend:", data.solution);
                return data.solution;
            } else {
                console.error("Solver error:", data.error || "Unexpected response format");
                return ["R", "U", "R'", "U'", "F2"]; // fallback
            }
            
        } catch (error) {
            console.error("API call failed:", error);
            return ["R", "U", "R'", "U'", "F2"]; // fallback
        }
    }
};


function initializeCube (){
    document.getElementById('startButton').style.display='none';
    document.getElementById('cubeCanvas').style.display='block';
    document.getElementById('timer').style.display='block';
    document.getElementById('instructions').style.display='block';

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1e1e1e, 5, 15);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('cubeCanvas')});
    renderer.setSize(1200 , 430);
    renderer.setClearColor(0x2c3e50);

    const cubeSize = 3;
    const cubeletSize = 1;
    const cubelets = [];

    const colors = [
        0xff0000,
        0x00ff00,
        0x0000ff,
        0xffff00,
        0xffa500,
        0xffffff
    ];

    for(let x=0;x<cubeSize;x++)
    {
        for(let y=0;y<cubeSize;y++)
        {
            for(let z=0;z<cubeSize;z++)
            {
                const geometry = new THREE.BoxGeometry(cubeletSize, cubeletSize, cubeletSize);
                
                const red     = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const green   = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const blue    = new THREE.MeshStandardMaterial({ color: 0x0000ff });
                const yellow  = new THREE.MeshStandardMaterial({ color: 0xffff00 });
                const orange  = new THREE.MeshStandardMaterial({ color: 0xffa500 });
                const white   = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const black   = new THREE.MeshStandardMaterial({ color: 0x111111 });

                const materials = [];
                const px = x - 1;
                const py = y - 1;
                const pz = z - 1;

                materials[0] = (px === 1)  ? red    : black;   // right
                materials[1] = (px === -1) ? orange : black;   // left
                materials[2] = (py === 1)  ? white  : black;   // top
                materials[3] = (py === -1) ? yellow : black;   // bottom
                materials[4] = (pz === 1)  ? green  : black;   // front
                materials[5] = (pz === -1) ? blue   : black;   // back


                  

                const cubelet = new THREE.Mesh(geometry, materials);
                cubelet.position.set(x-1,y-1,z-1);
                cubelets.push(cubelet);
                scene.add(cubelet);

                const edgeGeometry = new THREE.EdgesGeometry(geometry);
                const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
                cubelet.add(edges); // add to each cubelet

            }
        }
    }
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Make it brighter
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    


    camera.position.z=5;
    const controls= new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    function rotateSide(axis, layer, direction)
    {
        const rotationAxis = new THREE.Vector3();
        rotationAxis[axis] = 1;
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, direction * Math.PI/2);

        cubelets.forEach(cubelet => {
            if(Math.round(cubelet.position[axis]) === layer){
                cubelet.applyMatrix4(rotationMatrix);
                cubelet.position.round();
            }
        });
    }

    function randomRotations() {
        const axes = ['x','y','z'];
        const layers = [-1,0,1];
        const directions = [-1,1];

        for(let i=0;i<20;i++)
        {
            const axis = axes[Math.floor(Math.random()*axes.length)];
            const layer = layers[Math.floor(Math.random()*layers.length)];
            const direction = directions[Math.floor(Math.random()*directions.length)];
            rotateSide(axis, layer, direction);
        }
    }

    function closestColor(hex) {
        const colors = {
            "U": "ffffff", // white
            "R": "ff0000", // red
            "F": "00ff00", // green
            "D": "ffff00", // yellow
            "L": "ffa500", // orange
            "B": "0000ff"  // blue
        };
    
        let minDiff = Infinity;
        let closest = null;
    
        for (let face in colors) {
            const target = colors[face];
            let diff = 0;
    
            for (let i = 0; i < 6; i += 2) {
                const c1 = parseInt(hex.substring(i, i + 2), 16);
                const c2 = parseInt(target.substring(i, i + 2), 16);
                diff += Math.abs(c1 - c2);
            }
    
            if (diff < minDiff) {
                minDiff = diff;
                closest = face;
            }
        }
    
        return closest;
    }
    

    function getCubeStateString() {
        const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
        const facelets = { U: [], R: [], F: [], D: [], L: [], B: [] };
    
        const colorMap = {
            "ffffff": "U",  // white
            "ff0000": "R",  // red
            "00ff00": "F",  // green
            "ffff00": "D",  // yellow
            "ffa500": "L",  // orange
            "0000ff": "B"   // blue
        };
    
        cubelets.forEach(cubelet => {
            const pos = cubelet.position;
    
            cubelet.material.forEach((mat, i) => {
                if (!mat || !mat.color) return;
                const colorHex = mat.color.getHexString();
    
                const face = (
                    (i === 2 && Math.round(pos.y) === 1)  ? 'U' :
                    (i === 3 && Math.round(pos.y) === -1) ? 'D' :
                    (i === 0 && Math.round(pos.x) === 1)  ? 'R' :
                    (i === 1 && Math.round(pos.x) === -1) ? 'L' :
                    (i === 4 && Math.round(pos.z) === 1)  ? 'F' :
                    (i === 5 && Math.round(pos.z) === -1) ? 'B' :
                    null
                );
    
                if (face) {
                    const faceChar = closestColor(colorHex);
                    if (faceChar) {
                        facelets[face].push(faceChar);
                    }
                }
                
            });
        });
    
        for (let face of faceOrder) {
            if (facelets[face].length !== 9) {
                console.error(`Face ${face} has ${facelets[face].length} stickers, expected 9.`);
                return ""; // prevents sending a bad string to the solver
            }
        }
    
        const cubeString = faceOrder.map(f => facelets[f].join("")).join("");
        console.log("✅ Cube string:", cubeString);
        return cubeString;
    }
    
    
    
    function getSolutionMoves() {
        const cubeString = getCubeStateString();  
        Cube.solve(cubeString).then(moves => {
            solutionMoves = moves;
            console.log("Moves set from server:", solutionMoves);
        });
           
        console.log("Minimum solution:", solutionMoves);
    }

    randomRotations();
    getSolutionMoves();

    function animate()
    {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        checkIfSolved();
    }

    animate();

    document.addEventListener('keydown', (event) =>{
        switch(event.key) {
            case 'ArrowUp':
                rotateSide('y', 1 , 1);
                break;
            case 'ArrowDown':
                rotateSide('y', -1 , -1);
                break;
            case 'ArrowLeft':
                rotateSide('x', -1 , -1);
                break;
            case 'ArrowRight':        
                rotateSide('x', 1 , 1);
                break;
            case 'w':
                rotateSide('z', -1 , 1);
                break;
            case 's':
                rotateSide('z', 1 , -1);
                break;
            case 'a':
                rotateSide('y', -1 , 1);
                break;
            case 'd':
                rotateSide('y', 1 , -1);
                break;
            case 'q':
                rotateSide('x', -1 , 1);
                break;
            case 'e':
                rotateSide('x', 1 , -1);
                break;
            case 'z':
                rotateSide('x', 0 , 1);
                break;
            case 'x':
                rotateSide('x', 0 , -1);
                break;
            case 'c':
                rotateSide('y', 0 , 1);
                break;
            case 'v':
                rotateSide('y', 0 , -1);
                break;
            case 'b':
                rotateSide('z', 0 , 1);
                break;
            case 'n':
                rotateSide('z', 0 , -1);
                break;                             
                
        }
        userMoveCount++;

        checkIfSolved();
    });

    window.addEventListener('resize', () =>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let startTime = Date.now();
    let timerInterval = setInterval(updateTimer, 1000);

    function updateTimer() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) ;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        document.getElementById("timer").innerText = `Timer: ${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    }

function checkIfSolved() {
    const solvedColors = [
        Array(9).fill(0xffffff), // U - White
        Array(9).fill(0xff0000), // R - Red
        Array(9).fill(0x00ff00), // F - Green
        Array(9).fill(0xffff00), // D - Yellow
        Array(9).fill(0xffa500), // L - Orange
        Array(9).fill(0x0000ff)  // B - Blue
    ];

    const currentColors = cubelets.flatMap(cubelet =>
        cubelet.material.map(material => material.color.getHex())
    );

    for (let i = 0; i < solvedColors.length; i++) {
        if (!solvedColors[i].every((color, index) => color === currentColors[index])) {
            return; // Not solved yet
        }
    }

    if (!hasSolvedManually) {
        hasSolvedManually = true; // Prevent multiple win triggers

        clearInterval(timerInterval);

        const messageBox = document.getElementById('winnerMessage');
        messageBox.style.display = 'block';

        if (userMoveCount <= solutionMoves.length) {
            messageBox.innerHTML = `
                <strong>🎉 You solved it in ${userMoveCount} moves! Beast mode! 💪</strong><br>
                <button id="restartButton">Restart</button>
            `;
        } else {
            messageBox.innerHTML = `
                <strong>Nice try! You took ${userMoveCount} moves. Optimal was ${solutionMoves.length}.</strong><br>
                <button id="restartButton">Restart</button>
                <br>
                <button id="autoSolveButton">Show Optimal Solution</button>
            `;
            document.getElementById("autoSolveButton").addEventListener("click", runAutoSolve);
        }

        document.getElementById("restartButton").addEventListener("click", restartGame);
    }
}
    

    function restartGame()
    {
        document.getElementById('winnerMessage').style.display = 'none';
        document.getElementById("timer").innerText = `Timer: 00:00`;
        startTime = Date.now();
        timerInterval = setInterval(updateTimer,1000);
        userMoveCount = 0;
        hasSolvedManually = false;

        cubelets.forEach(cubelet => {
            scene.remove(cubelet);
          });
        cubelets.length = 0;
        initializeCube();
        
    }

    function performMove(move) {
        const baseMove = move[0];
        const prime = move.includes("'");
        const double = move.includes("2");
      
        const moveMap = {
          "F": ["z", 1],
          "B": ["z", -1],
          "U": ["y", 1],
          "D": ["y", -1],
          "L": ["x", -1],
          "R": ["x", 1]
        };
      
        const [axis, layerCoord] = moveMap[baseMove];
        const direction = prime ? 1 : -1;
      
        
        rotateSide(axis, layerCoord, direction);
        if (double) rotateSide(axis, layerCoord, direction);
      }
      

    document.getElementById("showCountBtn").addEventListener("click", () => {
        if (solutionMoves.length > 0) {
            document.getElementById("moveCountDisplay").innerText = 
                `Minimum moves to solve: ${solutionMoves.length}`;
        } else {
            document.getElementById("moveCountDisplay").innerText = 
                "Solution not generated yet!";
        }
    });

    document.getElementById("showSolutionBtn").addEventListener("click", () => {
        if (solutionMoves.length === 0) return;
    
        let index = 0;
        const interval = setInterval(() => {
            if (index < solutionMoves.length) {
                performMove(solutionMoves[index]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 700);
    });
    

      function runAutoSolve() {
        let index = 0;
        const interval = setInterval(() => {
            if (index < solutionMoves.length) {
                performMove(solutionMoves[index]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 700);
    }
    
      
    
}
