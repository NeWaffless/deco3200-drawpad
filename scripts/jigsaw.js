/*
todo:
    - change variable names in function call to represent purpose
    - order drawing presentation (storing drawings with uid?)
    - get current users drawing to make it stand out / animate in
    - fix puzzle piece gaps (little slithers of white)
    - fix puzzle piece sizing and ratio
    - remove grid demo
    - jigsaw placement algorithm
    - probably split this file into multiple js files
        - and / or organise functions
    - for all documents, comment functions that aren't explicit or are complex
    - shift jigsaw position when zooming
        - or add to future that middle of screen stays consistent with resize
*/

const jigsawTemplatePath = '../assets/jigsaw/jigsaw_pieces/';
let jigsaw;
let drawings = [];
const minWidth = 110;
const minHeight = 110;

function createDOMElements() {
    for(let i = 1; i < jigsaw.grid.length; i++) {
        const piece = document.createElement('div');
        piece.className += "jigsaw-piece";
        
        let col = 'blk';
        let name = '';
        if(i > prompt) {
            const drawing = document.createElement('img');
            drawing.className += "drawing";
            drawing.src = drawings[i - prompt - 1].drawStr;
            drawing.onclick = function() { drawingClicked(i); };
            drawing.setAttribute('draggable', false);
            piece.appendChild(drawing);
            
            col = drawings[i - prompt - 1].col;
            name = drawings[i - prompt - 1].name;
        }

        const template = document.createElement('img');
        template.className += "template";
        template.src = jigsawTemplatePath + `${col}.svg`;
        template.setAttribute('draggable', false);
        if(i > prompt) template.onclick = function() { drawingClicked(i); };
        piece.appendChild(template);

        jigsaw.addToGrid(i, {dom: piece, name: name});
        document.getElementById('jigsaw').appendChild(piece);
    }
}

function positionPieces(width, height) {
    for(let i = 1; i < jigsaw.grid.length; i++) {
        const piece = jigsaw.grid[i].dom;
        const xOffset = parseInt(width / 10, 10);
        const yOffset = parseInt(height/ 10, 10);


        piece.style.width = `${width}px`;
        piece.style.height = `${height}px`;

        const pos = jigsaw.gridPos(i);
        let x = pos[0];
        let y = pos[1];
        // x,y position math because the grid does not contain a 0 row or col
        if(y > 0) y -= 1;
        x *= -1;
        if(x > 0) x -= 1;

        piece.style.top = `${(x * height)}px`;
        piece.style.left = `${(y * width)}px`;
        
        if(i > prompt) {
            // drawing
            piece.childNodes[0].style.width = `${width - xOffset}px`;
            piece.childNodes[0].style.height = `${height - yOffset}px`;
            piece.childNodes[0].style.top = `${xOffset}px`;
            piece.childNodes[0].style.left = `${yOffset}px`;

            // piece template
            piece.childNodes[1].style.width = `${width + xOffset}px`;
            piece.childNodes[1].style.height = `${height + yOffset}px`;
        } else {
            // piece template
            piece.childNodes[0].style.width = `${width + xOffset}px`;
            piece.childNodes[0].style.height = `${height + yOffset}px`;
        }
        
    }
}

// todo: reformat this function
function createGrid() {
    const width = minWidth;
    const height = minHeight;

    jigsaw = new JigsawGrid(drawings.length);
    createDOMElements();
    positionPieces(width, height);
    document.body.removeChild(document.getElementById('loading'));

}

async function getDrawings() {

    const loading = document.createElement('p');
    loading.innerHTML = 'LOADING PIECES';
    loading.setAttribute("id", "loading");
    document.body.appendChild(loading);

    const options = {
        method: 'GET',
        headers: {
            "Content-Type": "application/json"
        }
    };
    // todo: standardise these calls
    const serverContact = await fetch('/drawings', options);
    const result = await serverContact.json();
    drawings.push(...result);
    createGrid();
}



getDrawings();



async function logout() {
    const options = {
        method: 'DELETE',
        headers: {
            "Content-Type": "application/json"
        }
    };
    
    fetch('/logout', options);
    
    window.location.href = 'landing-page.html';
}

let clicked = false;
let moved = false;
let startX = 0;
let startY = 0;
let lastX, lastY;
const delta = 6;
const jigsawElement = document.getElementById('jigsaw');

document.addEventListener('mousedown', function(ev) {
    clicked = true;
    moved = false;
    startX = ev.clientX;
    startY = ev.clientY;
});

document.addEventListener('mousemove', function(ev) {
    // todo: only register if not hidden
    if(clicked && (Math.abs(ev.clientX - startX) > delta
    || Math.abs(ev.clientY - startY) > delta)) {
        moved = true;

        // todo: lock panning so middle of puzzle cannot go offscreen
        jigsawElement.style.top = `${jigsawElement.offsetTop + ev.clientY - lastY}px`;
        jigsawElement.style.left = `${jigsawElement.offsetLeft + ev.clientX - lastX}px`;
    }
    lastX = ev.clientX;
    lastY = ev.clientY;
});

document.addEventListener('mouseup', function() {
    clicked = false;
});

function drawingClicked(d) {
    if(moved) {
        moved = false;
        return;
    }

    switchPage(1, d);
}

// todo: this is TERRIBLE, change it to local storage or something of that nature
    // not some random floating variable
// todo: these magic numbers are horrific
let currDrawing;

function changeCurrentDrawing(d) {
    let newDrawing = currDrawing + d;
    if(newDrawing < 5) {
        newDrawing = drawings.length + 5 - 1;
    } else if(newDrawing >= drawings.length + 5) {
        newDrawing = 5;
    }
    switchPage(1, newDrawing);
}

function switchPage(state, d) {
    if(state === 1) {
        document.getElementById('all-drawings').style.display = 'none';
        document.getElementById('individual-drawing').style.display = 'initial';
        const piece = jigsaw.grid[d].dom;
        currDrawing = d;
        document.getElementById('one-drawing-template').src = piece.childNodes[1].src;
        document.getElementById('one-drawing').src = piece.childNodes[0].src;
        document.getElementById('child-name').innerHTML = jigsaw.grid[d].name;
        document.getElementById('save').href = piece.childNodes[0].src;
        document.getElementById('save').download = jigsaw.grid[d].name + "'s drawing";
    } else {
        document.getElementById('all-drawings').style.display = 'initial';
        document.getElementById('individual-drawing').style.display = 'none';
    }
}

let zoomState = 0;
function switchZoom() {
    if(zoomState === 0) {
        positionPieces(300, 300);
        document.getElementById('prompt-content').style.width = '450px';
        document.getElementById('prompt-content').style.height = '450px';
        document.getElementById('week').style.fontSize = "45px";
        document.getElementById('prompt').style.fontSize = "70px";
        document.getElementById('zoom-text').innerHTML = "Zoom Out";
        zoomState = 1;
    } else {
        positionPieces(minWidth, minHeight);
        document.getElementById('prompt-content').style.width = '180px';
        document.getElementById('prompt-content').style.height = '180px';
        document.getElementById('week').style.fontSize = "18px";
        document.getElementById('prompt').style.fontSize = "28px";
        document.getElementById('zoom-text').innerHTML = "Zoom In";
        zoomState = 0;
    }
}

// ------------------------ GRID DEMO  ------------------------ //



/*

const red = 'rgb(255, 0, 0)';
const green = 'rgb(0, 255, 0)';

const size = 36;
const width = 110;
const height = 110;

const grid = new JigsawGrid(size);
for(let i = 1; i <= size; i++) {
    let pos = grid.gridPos(i);

    const piece = document.createElement('div');
    piece.className += "jigsaw-piece";
    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;

    if(pos[1] > 0) pos[1] -= 1;
    pos[0] *= -1;
    if(pos[0] > 0) pos[0] -= 1;
    piece.style.top = `${(pos[0] * height)}px`;
    piece.style.left = `${(pos[1] * width)}px`;
    
    // used for visual testing
    // const r = Math.floor(Math.random() * 256);
    // const g = Math.floor(Math.random() * 256);
    // const b = Math.floor(Math.random() * 256);
    // piece.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    piece.style.backgroundColor = green;

    const text = document.createElement('h1');
    text.innerHTML = `${i}`;

    piece.appendChild(text);
    grid.addToGrid(i, piece);
    document.getElementById('jigsaw').appendChild(piece);
}


// used for demonstrative purposes
let cursor = 1;
grid.grid[cursor].style.backgroundColor = red;
document.onkeydown = function(e) {
    let dir;
    switch(e.key) {
        case 'w':
            dir = Direction.UP;
            break;
        case 'd':
            dir = Direction.RIGHT;
            break;
        case 's':
            dir = Direction.DOWN;
            break;
        case 'a':
            dir = Direction.LEFT;
            break;
        default:
            console.log(e.key);
            break;
    }
    const temp = cursor;
    cursor = grid.gridPosInDir(cursor, dir);
    if(cursor < grid.grid.length) {
        grid.grid[temp].style.backgroundColor = green;
        grid.grid[cursor].style.backgroundColor = red;
    }  else {
        cursor = temp;
    }
}

*/

