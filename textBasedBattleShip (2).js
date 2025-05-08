"use strict";

// PREPROCESSABLE CONSTANTS
const GRID_SIZE = 10;

// CONSTANTS (tier 1)
const idxOfCoord = (x, y) => y * GRID_SIZE + x;

const pair = (val1, val2) => [val1, val2];

const query = (data, system, componentIds, state) => {
	const querySize = componentIds.length;
	const components = Array(querySize);
	
	outer: for(let i = 0, l = data.length; i < l; ++i){
		for(let j = 0; j < querySize; ++j){
			const component = data[componentIds[j]][i];
			if(component === undefined){
				continue outer;
			} else{
				components[j] = component;
			}
		}
		system(...components, ...state, i)
	}
};

const randBit = () => Math.floor(Math.random() + 0.5);

const randInt = (ceil) => Math.floor(Math.random() * ceil);

const shipSizes = new Uint8Array([0,0,0, 2,3,3,4,5]);

const swap = (val1, val2) => [val2, val1];

const tileCharactersLookup = {
	AI: [
		" ", // water
		"*", // hit
		"_", // miss
		" ", // patrol boat
		" ", // submarine
		" ", // destroyer
		" ", // battleship
		" ", // carrier
	],
	Player: [
		" ", // water
		"*", // hit
		"_", // miss
		"P", // patrol boat
		"S", // submarine
		"D", // destroyer
		"B", // battleship
		"C", // carrier
	],
};

const wait = (ms) => {
	const stop = Date.now() + ms;
	while(Date.now() < stop);
};

// CONSTANTS (tier 2)
const choiceGetterLookup = {
	AI: (grid) => {
		const x = randInt(GRID_SIZE);
		const y = randInt(GRID_SIZE);
		return [x, y];
	},
	
	Player: (grid) => {
		const x = prompt("X coordinate (1-10):");
		const y = prompt("Y coordinate (1-10):");
		return [
			Math.min(GRID_SIZE, Math.abs(x - 1)),
			Math.min(GRID_SIZE, Math.abs(y - 1)),
		];
	},
};

const getTileCode = (grid, x, y) => grid[idxOfCoord(x, y)];

const modifyTile = (grid, x, y, code) => {
	grid[idxOfCoord(x, y)] = code;
};

// CONSTANTS (tier 3)
const displayGrid = (grid, playerType, stringBuilder) => {
	let idx = 0;
	const tileCharacters = tileCharactersLookup[playerType];
	
	for(let y = 0; y < GRID_SIZE; ++y){
		for(let x = 0; x < GRID_SIZE; ++x){
			stringBuilder[idx++] = tileCharacters[getTileCode(grid, x, y)];
		}
		stringBuilder[idx++] = "\n";
	}
	console.log("|" + stringBuilder.join("|"));
};

const fillEmptyLine = (grid, pos1, pos2, size, horizontal, tileCode) => {
	const dimensionTransform = horizontal && pair || swap;
	for(let i = 0; i < size; ++i){
		const point = dimensionTransform(pos1 + i, pos2);
		const tileCode = getTileCode(grid, point[0], point[1]);
		if(tileCode){return false;}
	}
	
	for(let i = 0; i < size; ++i){
		const point = dimensionTransform(pos1 + i, pos2);
		modifyTile(grid, point[0], point[1], tileCode);
	}
	return true;
};

const scanForSurvivors = (grid, hitTileCode) => {
	let remainingShips = false;
	for(let y = 0; y < GRID_SIZE; ++y){
		for(let x = 0; x < GRID_SIZE; ++x){
			const tileCode = getTileCode(grid, x, y);
			if(tileCode === hitTileCode){return true;}
			else if(tileCode > 2){remainingShips = true;}
		}
	}
	return remainingShips && "shipSunk" || "gameOver";
};

// CONSTANTS (tier 4)
const createRandomGrid = () => {
	const grid = new Uint8Array(GRID_SIZE * GRID_SIZE);
	for(let i = 3, l = shipSizes.length; i < l; ++i){
		const shipSize = shipSizes[i];
		while(!fillEmptyLine(
			grid,
			randInt(GRID_SIZE - shipSize + 1),
			randInt(GRID_SIZE),
			shipSize,
			!randBit(),
			i
		));
	}
	return grid;
};

const fireGun = (playerType, grids, metadata, entity) => {
	wait(750);
	console.log(playerType + " turn...");
	
	if(playerType === "AI"){
		wait(750);
		console.log("Thinking...");
		wait(1250);
	}
	
	const getChoice = choiceGetterLookup[playerType];
	const fireCoord = getChoice();
	const x = fireCoord[0];
	const y = fireCoord[1];
	
	const enemy = 1 - entity;
	const grid = grids[enemy];
	const tileCode = getTileCode(grid, x, y);
	
	const isPlayer = playerType === "Player";
	if(tileCode === 0){
		modifyTile(grid, x, y, 2);
		console.log(
			isPlayer
			&& "Miss!"
			|| "Your ship is safe... what a let-down"
		);
	} else if(tileCode === 1){
		console.log(
			isPlayer
			&& "Shooting the same spot doesn't really help..."
			|| "Ok... the enemies are sort of stupid"
		);
	} else if(tileCode === 2){
		console.log(
			isPlayer
			&& (
				!randBit()
				&& "It didn't work the first time..."
				|| "What was the definition of insanity again?"
			)
			|| "They never learn..."
		);
	} else{
		modifyTile(grid, x, y, 1);
		console.log(
			isPlayer
			&& (
				!randBit()
				&& "Wow. You actually hit that?"
				|| "Lucky shot I guess"
			)
			|| "Wow, you're getting destroyed right now!"
		);
		
		// scan
		const scan = scanForSurvivors(grid, tileCode);
		if(scan === "shipSunk"){
			wait(500);
			console.log("A ship was sunk");
		} else if(scan === "gameOver"){
			metadata.gameOver = playerType;
			wait(1000);
			console.log(
				isPlayer
				&& "You won? HOW?!?"
				|| "YES!! THEY FINALLY BEAT YOU!!"
			);
		}
	}
	
	// display stuff
	wait(1500);
	query(data, displayGrid, ["grid", "playerType"], [stringBuilder]);
};

// STATE
const data = {
	length: 2,
	grid: [createRandomGrid(), createRandomGrid()],
	playerType: ["AI", "Player"],
};

const metadata = {
	gameOver: false,
};

// allocating enough space for \n
const stringBuilder = Array((GRID_SIZE + 1) * GRID_SIZE);

// GAME INITIALIZATION

query(data, displayGrid, ["grid", "playerType"], [stringBuilder]);

while(!metadata.gameOver){
	query(data, fireGun, ["playerType"], [data.grid, metadata]);
}
