// TRAFFIC Simulator was created by Alexander Carron on April 15th 2022

// ^ Starts a new game
function runGame() {
	const 
		MOVE_LEFT_KEY = "KeyA", // When A is pressed move left
		MOVE_MIDDLE_KEY = "KeyS", // When S is pressed go to the middle
		MOVE_RIGHT_KEY = "KeyD", // When D is pressed move right
		POSITIONS = { // Turns semantic words into the x position of the player in pixels
			"left": 0,
			"middle": 100,
			"right": 200
		},
		RUN_ZONE_HEIGHT = 800,
		SELECTED_LANE_OPACITY = 0.1,
		CHANGE_LANES_ANIMATION_LENGTH = 5,
		FPS = 50,
		STARTING_TIME = 45,
		TIME_IT_TAKES_TO_REACH_END = 35,
		MOVEMENT_SPEED = 300;
		
		
	// @ Game Settings (Changes Starting Game State)
	let fps = FPS, // Frames Per Second
		starting_time = STARTING_TIME, // How long before the player loses
		distance_from_end_in_sec_at_start = TIME_IT_TAKES_TO_REACH_END;	// How long till the player reaches the end
	
	// @ All Variables
	let player_pos_x = 100, // The player's position on the x-axiaaaaaaaaaaaaaaaaaaaaaaaaaaaas in pixels
		distance_walked_in_sec = 0, // How far you've traveled in second
		distance_from_end_in_sec = distance_from_end_in_sec_at_start, // How far you've traveled in second
		time_remaining = starting_time, // The time you have left in seconds
		time_player_has_to_run_forward = starting_time, // The time you have left in seconds
		time_lost = 0, // How many seconds were lost due to hitting enemies
		distance_set_back = 0, // How many seconds were lost due to hitting enemies
		progress = 0, // Percent way to the finish 
		end_marker_pos_y = 800, 
		didEnemiesStopSpawning = false,
		needNewEnemySpawned = true,
		isPlayerBlocked = false,
		hasPlayerWon = false,
		hasPlayerLost = false, 
		normal_enemy_spawn_delay_range = [1, 3], // How often enemies spawn in seconds
		movement_speed_in_px_per_frame = MOVEMENT_SPEED / fps, // How far things move every frame
		run_zone_height_in_seconds = RUN_ZONE_HEIGHT / MOVEMENT_SPEED, // How long it takes to get from the bottom to the player
		time_remaining_sec_counter, // The seconds on the timer
		time_remaining_min_counter, // The minute on the timer
		left_lane_opacity = 0,
		center_lane_opacity = SELECTED_LANE_OPACITY,
		right_lane_opacity = 0,
		current_broken_line_lane = 0;
		normal_enemies = [], // All enemies that are on screen
		keys_down = [], // They keys that are currently being pressed
		broken_lines = [];
		
	// @ All HTML elements
	let action_background_music = new Audio('./Audio/Final_Bowser_Battle_Super_Mario_Ga_(getmp3.pro).mp3'),
		start_menu_elm = document.querySelector("#start_menu"),
		game_box_div_elm = document.querySelector("#game_box"),
		progress_bar_filled_elm = document.querySelector("#progress_bar_filled"),
		progress_percent_elm = document.querySelector("#progress_percent"),
		time_left_elm = document.querySelector("#time_left"),
		run_zone_elm = document.querySelector("#run_zone"),
		backdrop_elm = document.querySelector("#backdrop"),
		left_lane_elm = document.querySelector(".row:first-child"),
		center_lane_elm = document.querySelector(".row:nth-child(2)"),
		right_lane_elm = document.querySelector(".row:nth-child(3)"),
		player_character_elm = document.querySelector("#player_character"),
		end_marker_elm = document.querySelector("#end_marker"),
		enemies_div_elm = document.querySelector("#enemies"),
		you_win_elm = document.querySelector("#you_win"),
		you_lost_elm = document.querySelector("#you_lost"),
		try_again_button_elm = document.querySelector("#try_again_button"),
		main_menu_button_elm = document.querySelector("#main_menu_button");
		
	// ? Makes sure the game screen is the only thing visible
	game_box_div_elm.style.display = "block";
	start_menu_elm.style.display = "none";
	
	// ? Kill all previous enemies and everything in the backdrop
	enemies_div_elm.innerHTML = "";
	backdrop_elm.innerHTML = "";
	
	// ? Play background music
	action_background_music.play();
	
	// ? Spawn the first enemy and broken line
	createBrokenLine();
	createBrokenLine();
	
	// * Brings up win screen and stops game
	function winGame() {
		hasPlayerWon = true;
		
		// ? Bring up win screen
		you_win_elm.style.display = "block";
		try_again_button_elm.style.display = "block";
		main_menu_button_elm.style.display = "block";
		
		you_win_elm.style = `
			display: block;
		`;
		
		function animateWin() {
			you_win_elm.style = `
				display: block;
				width: 700px;
				height: 200px;
				box-shadow: 0 0 20px 5px var(--good-dark-color);
				text-shadow: 0 0 5px var(--good-highlight-color);
				font-size: 100pt;
				font-weight: bold;
				opacity: 1;
			`;
			
		}
		
		setTimeout(animateWin, 1);
		
		// ? Pause Music
		action_background_music.pause();
		action_background_music.currentTime = 0;
	}
	
	// * Brings up lose screen and stops game
	function loseGame() {
		hasPlayerLost = true
		
		// ? Bring up win screen
		you_lost_elm.style.display = "block";
		try_again_button_elm.style.display = "block";
		main_menu_button_elm.style.display = "block";
		
		function animateLose() {
			you_lost_elm.style = `
				display: block;
				width: 800px;
				height: 200px;
				box-shadow: 0 0 20px 5px var(--bad-dark-color);
				text-shadow: 0 0 5px var(--bad-highlight-color);
				font-size: 100pt;
				font-weight: bold;
				opacity: 1;
			`;
			
		}
		
		setTimeout(animateLose, 1);
		
		// ? Pause Music
		action_background_music.pause();
		action_background_music.currentTime = 0;
	}
	
	// * Gets a random integer between two integers
	function getRandomNumBetween(min, max) {
		let range = max - min + 1;
		return Math.floor( Math.random()*range ) + min;
	}
		
	// * Detects if an enemy is touching the player character
	function areBoxesTouching(box1_position, box1_size, box2_position, box2_size) {
		let box1_x = box1_position[0], // box_position is an array of two values where the first is it's x position and the second is its y position
			box1_y = box1_position[1],
			box2_x = box2_position[0],
			box2_y = box2_position[1],
			
			box1_left_side = box1_x, // The x position of Box #1's left side
			box1_right_side = box1_x + box1_size, // The x position of Box #1's right side
			box1_top_side = box1_y, // The y position of Box #1's top
			box1_bottom_side = box1_y + box1_size, // The y position of Box #1's bottom
			
			box2_left_side = box2_x, // The x position of Box #2's left side
			box2_right_side = box2_x + box2_size, // The x position of Box #2's right side
			box2_top_side = box2_y, // The y position of Box #2's top
			box2_bottom_side = box2_y + box2_size; // The y position of Box #2's bottom
			
		if (
			(box1_left_side < box2_right_side) && 	// Is Box #1's left side to the left of Box #2's right side
			(box1_right_side > box2_left_side) &&	// Is Box #1's right side to the right of Box #2's left side
			(box1_top_side < box2_bottom_side) && 	// Is Box #1's top side above of Box #2's bottom side
			(box1_bottom_side > box2_top_side) 		// Is Box #1's bottom side below of Box #2's top side
		) {
			return true
		} 
		
		return false
	}
	
	// * Creates the enemy character div, puts it on a random lane, and does it again after a delay
	function createNormalEnemy() {
		if ( // Stop spawning enemies after the game has ended
			hasPlayerWon || 
			hasPlayerLost ||
			distance_from_end_in_sec <= run_zone_height_in_seconds ||
			isPlayerBlocked
		) {return didEnemiesStopSpawning = true} 
		
		let new_normal_enemy = document.createElement("div");
		new_normal_enemy.enemy_pos_x = getRandomNumBetween(0, 2)*100, // Puts enemy on random lane
		new_normal_enemy.enemy_pos_y = 800;
		new_normal_enemy.classList.add("normal_enemy"); // Gives enemy the default styles set in main.css
		new_normal_enemy.style = `
			transform: translate(${new_normal_enemy.enemy_pos_x}px, ${new_normal_enemy.enemy_pos_y}px);
		`
		enemies_div_elm.appendChild(new_normal_enemy); // Put enemy on web page
		normal_enemies.push(new_normal_enemy);
		
		// ? Runs function again after random delay
		setTimeout(
			createNormalEnemy, 
			getRandomNumBetween(
				normal_enemy_spawn_delay_range[0] * (1000 / 3), 
				normal_enemy_spawn_delay_range[1] * (1000 / 3)
			)
		); 
	}
	
	// * Creates the enemy character div, puts it on a random lane, and does it again after a delay
	function createBrokenLine() {
		if ( // Stop spawning enemies after the game has ended
			hasPlayerWon || 
			hasPlayerLost ||
			isPlayerBlocked
		) {return} 
		
		if (current_broken_line_lane < 1) {current_broken_line_lane++;}
		else {current_broken_line_lane = 0}
		
		let new_broken_line = document.createElement("div");
		new_broken_line.classList.add("broken_line"); // Gives enemy the default styles set in main.css
		new_broken_line.pos_x = current_broken_line_lane * 100 + 100;
		new_broken_line.pos_y = 800;
		new_broken_line.style = `
			left: ${new_broken_line.pos_x}px;
			top: ${new_broken_line.pos_y}px;
		`
		backdrop_elm.appendChild(new_broken_line); // Put enemy on web page
		broken_lines.push(new_broken_line);
		
		// ? Runs function again after random delay
		setTimeout(
			createBrokenLine, 
			1000
		); 
	}
	
	// ^ Executes every time a key is pressed
	document.addEventListener(
		"keydown",
		(key_pressed) => {
			
			let key_code = key_pressed.code, // Formatted: Key(Key Name Here)
				key_name = key_pressed.key; // Just the name of the key
			
			// ? Adds the key name to the array of all keys that are currently pressed down
			// ? If the key is already listed in the array it won't add it again
			if (!keys_down.includes(key_name)) {
				keys_down.push(key_name)
			}
			
			// ? Changes the player's position depending on the key pressed
			switch (key_code) {
				case MOVE_LEFT_KEY:
					if (player_pos_x != POSITIONS.left) {
						player_pos_x = POSITIONS.left;
						
						left_lane_opacity = SELECTED_LANE_OPACITY;
						center_lane_opacity = 0;
						right_lane_opacity = 0;
						
						run_zone_elm.style.right = `${CHANGE_LANES_ANIMATION_LENGTH}px`;
					}
					break;
					
				case MOVE_MIDDLE_KEY:
					if (player_pos_x != POSITIONS.middle) {
						player_pos_x = POSITIONS.middle;
					
						center_lane_opacity = SELECTED_LANE_OPACITY;
						left_lane_opacity = 0;
						right_lane_opacity = 0;
						
						run_zone_elm.style.right = `0px`;
					}
					break;
				
				case MOVE_RIGHT_KEY:
					if (player_pos_x != POSITIONS.right) {
						player_pos_x = POSITIONS.right;
						
						right_lane_opacity = SELECTED_LANE_OPACITY;
						center_lane_opacity = 0;
						left_lane_opacity = 0;
						
						run_zone_elm.style.right = `-${CHANGE_LANES_ANIMATION_LENGTH}px`;
					}
					break;
			}
		}	
		
	)
	
	// ^ Executes every time a key is unpressed
	document.addEventListener(
		"keyup",
		(key_unpressed) => {
			let key_code = key_unpressed.code, // Formatted: Key(Key Name Here)
				key_name = key_unpressed.key, // Just the name of the key
				keys_down_index = keys_down.indexOf(key_name); // Gets the index of the key that was just unpressed in the keys_down array
			
			// Removes the key that was just unpressed from the keys_down array
			keys_down.splice(keys_down_index, keys_down_index + 1);
			
			// Only sends the player to the middle if they aren't pressing another key
			if (keys_down.length === 0) {
				if (player_pos_x != POSITIONS.middle) {
					player_pos_x = POSITIONS.middle;
					
					center_lane_opacity = SELECTED_LANE_OPACITY;
					left_lane_opacity = 0;
					right_lane_opacity = 0;
						
					run_zone_elm.style.right = `0px`;
				}
			}
		}	
	)
	
	// ^ Executes every frame
	setInterval(function(){ 
		
		if (hasPlayerWon || hasPlayerLost) return; // Stops game when player has won or lost
		
		console.table({
			time_remaining,
			time_player_has_to_run_forward,
			time_lost,
			distance_set_back,
			isPlayerBlocked,
			didEnemiesStopSpawning,
			needNewEnemySpawned
		})
		
		if (didEnemiesStopSpawning && !isPlayerBlocked && distance_set_back <= 0) {
			needNewEnemySpawned = true;
		}
		
		if (needNewEnemySpawned) {
			setTimeout(createNormalEnemy, 400);
			setTimeout(createBrokenLine, 1000);
			setTimeout(createBrokenLine, 1000);
			didEnemiesStopSpawning = false;
			needNewEnemySpawned = false;
		}
			
		{ // ? Update variables
			distance_walked_in_sec = 
				starting_time - (time_player_has_to_run_forward + time_lost);
				
			distance_from_end_in_sec = 
				distance_from_end_in_sec_at_start - distance_walked_in_sec;
				
			progress = 
				distance_walked_in_sec / distance_from_end_in_sec_at_start;
			
			time_remaining -= 1/fps; // Counts down timer
			
			if (time_lost > 0) {
				if (!isPlayerBlocked) {
					time_lost -= 1.5 / fps;
				}
			} else 
			{
				time_player_has_to_run_forward -= 1/fps;
				
				if (!isPlayerBlocked) {
					time_lost = 0;
				}
			}
			
			if (distance_set_back > 0) {
				if (!isPlayerBlocked) {
					distance_set_back -= movement_speed_in_px_per_frame 
				}
			} else {
				if (!isPlayerBlocked) {
					distance_set_back = 0 
				}
			}
			
			time_remaining_min_counter = Math.floor(time_remaining / 60);
			
			if (time_remaining % 60 <= 9) {
				time_remaining_sec_counter = `0${Math.ceil(time_remaining % 60)}`
			} 
			else {
				time_remaining_sec_counter = Math.ceil(time_remaining % 60)
			}
			
			time_left_elm.textContent = `${time_remaining_min_counter}:${time_remaining_sec_counter}`
		}
		
		if (time_remaining < 1/fps) { // ? LOSE if time runs out
			loseGame();
		}
		
		if (progress < 1) { // ? Change progress bar
			progress_bar_filled_elm.style.height = `${progress * 780}px`;
			
			progress_percent_elm.textContent = `${Math.floor(progress * 100)}%`
		}
		else { // ? WIN
			progress_bar_filled_elm.style.height = `780px`;
			
			progress_percent_elm.textContent = `100%`
			
			winGame();
		}
		
		
		// ? Detect if enemies touching player character
		let areAnyEnemiesTouchingThePlayer = false;
		for (let enemy of normal_enemies) { 
			if (areBoxesTouching(
				[player_pos_x, 0], 100, 
				[enemy.enemy_pos_x, (enemy.enemy_pos_y - movement_speed_in_px_per_frame)], 100
			)) {
				time_lost += 1.5 / fps;
				distance_set_back += (.5/fps)/run_zone_height_in_seconds * (RUN_ZONE_HEIGHT);
				enemy.isBlockingPlayer = true;
				enemy.enemy_pos_y = 100;
				enemy.style.transition = `transform 200ms ease`
				isPlayerBlocked = true;
				areAnyEnemiesTouchingThePlayer = true;
			} else {
				enemy.isBlockingPlayer = false;
				enemy.style.transition = ``
			}
			enemy.style.transform = `
				translate(${enemy.enemy_pos_x}px, ${enemy.enemy_pos_y}px)
			`
		}
		isPlayerBlocked = areAnyEnemiesTouchingThePlayer;
		
		// ? Move Enemies
		for (let enemy of normal_enemies) { 
			// ? Move enemies upwards
			if (!enemy.isBlockingPlayer) {
				if (!isPlayerBlocked) {
					enemy.enemy_pos_y -= movement_speed_in_px_per_frame;
				} else {
					enemy.enemy_pos_y += (.5/fps)/run_zone_height_in_seconds * (RUN_ZONE_HEIGHT);
				}	
			}
			
			// ? Delete enemies that go off the screen
			if (enemy.enemy_pos_y <= -100) {
				enemy.remove()
				normal_enemies.splice(normal_enemies.indexOf(enemy), 1);
			}
		}
		
		{ // ? Change player's position based on position variables
			player_character_elm.style = `
				transform: translate(${player_pos_x}px, 0px);
			`
		}
		
		 // ? Change background based on progress
		if (time_remaining > 3) {
			run_zone_elm.style.opacity = (time_remaining - 3)/(starting_time - 3)*0.5 + 0.5
		} else {
			run_zone_elm.style.opacity = time_remaining/3 * 0.5;
		}
		
		// ? Animate End Marker
		if (distance_from_end_in_sec <= run_zone_height_in_seconds) {  // If distance from end is less than the run zone's height
			end_marker_elm.style.display = "block";
			
			// ? Calculate End Marker's y position
			end_marker_pos_y = distance_from_end_in_sec/run_zone_height_in_seconds * (RUN_ZONE_HEIGHT) + 100;
			
			end_marker_elm.style = `
				transform: translate(0px, ${end_marker_pos_y}px);
			`
		} else {
			// ? Make end marker invisible
			end_marker_elm.style.display = "none"
			end_marker_elm.style = `
				transform: translate(0px, ${RUN_ZONE_HEIGHT}px);
			`
		}
		
		{ // ? Change lane opacity
			left_lane_elm.style.opacity = left_lane_opacity;
			center_lane_elm.style.opacity = center_lane_opacity;
			right_lane_elm.style.opacity = right_lane_opacity;
		}
		
		{ // ? Animate backdrop
			for (broken_line_elm of broken_lines) {
				if (isPlayerBlocked) {
					broken_line_elm.pos_y += (.5/fps)/run_zone_height_in_seconds * (RUN_ZONE_HEIGHT);
				} else {
					broken_line_elm.pos_y -= movement_speed_in_px_per_frame;
				}
				broken_line_elm.style = `
					left: ${broken_line_elm.pos_x}px;
					top: ${broken_line_elm.pos_y}px;
				`
			}
		}
		
	}, (1000 / fps));
}


// ^ Shows the instructions
function showHowToPlayScreen() {
	let how_to_play_screen_elm = document.querySelector("#how_to_play_screen"),
		start_menu_elm = document.querySelector("#start_menu"),
		game_box_div_elm = document.querySelector("#game_box");
		
	game_box_div_elm.style.display = "none";
	start_menu_elm.style.display = "none";
	how_to_play_screen_elm.style.display = "flex";
}


// ^ Goes to the main menu
function showStartMenu() {
	let how_to_play_screen_elm = document.querySelector("#how_to_play_screen"),
		start_menu_elm = document.querySelector("#start_menu"),
		game_box_div_elm = document.querySelector("#game_box"),
		you_win_elm = document.querySelector("#you_win"),
		you_lost_elm = document.querySelector("#you_lost"),
		try_again_button_elm = document.querySelector("#try_again_button");
		main_menu_button_elm = document.querySelector("#main_menu_button");
		
	game_box_div_elm.style.display = "none";
	start_menu_elm.style.display = "flex";
	how_to_play_screen_elm.style.display = "none";
	you_win_elm.style.display = "none";
	you_lost_elm.style.display = "none";
	try_again_button_elm.style.display = "none";
	main_menu_button_elm.style.display = "none";
}


// ^ Resets the game and runs it again
function restartGame() {
	let how_to_play_screen_elm = document.querySelector("#how_to_play_screen"),
		start_menu_elm = document.querySelector("#start_menu"),
		game_box_div_elm = document.querySelector("#game_box"),
		you_win_elm = document.querySelector("#you_win"),
		you_lost_elm = document.querySelector("#you_lost"),
		try_again_button_elm = document.querySelector("#try_again_button");
		main_menu_button_elm = document.querySelector("#main_menu_button");
		
	game_box_div_elm.style.display = "block";
	start_menu_elm.style.display = "none";
	how_to_play_screen_elm.style.display = "none";
	you_win_elm.style.display = "none";
	you_lost_elm.style.display = "none";
	try_again_button_elm.style.display = "none";
	main_menu_button_elm.style.display = "none";
	
	runGame();
}