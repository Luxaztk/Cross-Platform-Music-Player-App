# Mobile app UI description

## Style
- The app UI should feel modern, with similarities to apps like Spotify
- It should support theming, with color variables to support future extra themes, like the desktop app
- The app should use the Lucide icon pack

## Screens
- Home
- Playlist details
- Search
- Settings
- Now playing

## Common layout
- There's a top bar at the top, a main area, and a player bar at the bottom 
- The top bar and the player bar are persistent across screens
- The top bar and the player bar should avoid colliding with the system UI (notch, gesture bar, etc.)

### Top bar
- Elements: "Import songs" button, Current page name, "Search" button, "Sidebar menu" button
- Buttons are icons
- Arrangement:
  - "Import songs" button is on the leftmost of the top bar
  - "Search" button and "Sidebar menu" button are on the rightmost of the top bar (Search button is on the left of Sidebar menu button)
  - "Current page name" are in the center of the top bar
  - If the "Search" button is clicked, it opens the Search page

### Player bar
- Elements: Current song cover image, current song title, current song's artist, play/pause button, "next song" button, progress bar
- Arrangement:
    - The cover image is on the leftmost side of the bar
    - Next to it is the current song information area, consisting of the current song title above the current song's artist
    - Next to the information area is the play/pause button
    - Next to the play/pause button is the "next song" button
    - The progress bar is at the top of the player bar and should not be "seek"-able
- If the song doesn't have a cover image, a placeholder image should be used
- If no song is playing, there cover image should be blank and a message saying "No song is being played" should appear in the current song animation area
- When the player bar is clicked on, the "Now playing" page appears with a transition animation showing the "Now playing" page appearing from the bottom of the screen.

### Sidebar menu
- If the "sidebar menu" button is clicked on, a sidebar menu appears on the right and overlays the current screen, with the overlaid screen being greyed out
- Elements: App logo, app name, app current version, links to "Home", "Search" and "Settings" screens
- Links consist of an icon on the left and the page name next to it
- Tapping on the links should lead to the corresponding page
- The currently active page in the list should be highlighted
- Tapping on the greyed out area should collapse the menu

## Screens/Pages
### Home
#### Main area
- Elements: Playlist list, "Add new playlist" button
    - Each playlist is represented by a row consisting of the cover image on the leftmost side, followed by playlist information area (name and number of songs), followed by an "Actions menu" button
- There should be a default playlist consisting of all songs imported into the app. This playlist should be named "All songs" and should not be able to be deleted.
- The playlists should be displayed in an alphabetical order
- Tapping on a playlist in the list should open the playlist detail page with transition animation.
- Long pressing on a playlist or pressing the "Actions menu" button should open the Actions menu
- The Actions menu should allow the user to do the following: 
    - Editing actions tab:
        - Rename playlist
        - Delete playlist
        - Duplicate playlist
    - Playing actions tab:
        - Play next
        - Add to queue
        - Shuffle

### Playlist details
#### Top bar
- The "Import songs" button should be replaced by a "Go back" button
- The current page name should display the current playlist's name

#### Main area
- Elements (from top to bottom): 
    1. Playlist header 
        - Playlist song count, playlist duration
        - Actions: Add songs, edit playlist songs, search songs
    2. Song list
        - At the top of the song list, on the rightmost side is a sort button.
            - Tapping on the button reveals a list with different sorting the orders the user can display the song list with
        - Each song is represented by a row consisting of the song cover image on the leftmost side, followed by song information area (name and artist), followed by song duration and an "Actions menu" button on the rightmost side
        - Tapping on a song in the list should play the song
        - Long pressing on a song or pressing the "Actions menu" button should open the Actions menu
        - The Actions menu should allow the user to do the following: 
            - Editing actions tab:
                - Edit metadata
                - Add to playlist
                - Remove from playlist
            - Playing actions tab:
                - Play next
                - Add to queue

### Search
#### Top bar
- The top bar on the Search page should have a "Go back" button on the leftmost side and the "Sidebar menu" button on the rightmost side, removing the "Import songs" button and "Search" button.

#### Main area
- Elements (from top to bottom): Search bar, Filter & Sort bar, search results (list view)

### Settings
#### Top bar
- The top bar on the Settings page should have a "Go back" button on the leftmost side and the "Sidebar menu" button on the rightmost side, removing the "Import songs" button and "Search" button.

#### Main area
- Elements (from top to bottom): 
    1. Theme
    2. Language

#### Player bar
- The player bar should be hidden

### Now playing
- The "Now playing" page should use a custom layout, not the common layout

#### Top bar
- Elements: "Go back" button (downwards chevron icon), "Actions menu" button (ellipsis icon)
- The "Go back" button should be on the leftmost side
- The "Actions menu" button should be on the rightmost side
- Tapping on the "Go back" button should close the "Now playing" page
- Tapping on the "Actions menu" button should open the Actions menu
- The Actions menu should allow the user to do the following: 
    - Editing actions tab:
        - Edit metadata
        - Add to playlist
        - Remove from playlist
    - Playing actions tab:
        - Play next
        - Add to queue
        - Dismiss queue (empty current queue, displays "No song is being played" in the player bar, close the "Now playing" page)

#### Main area
- Elements (from top to bottom): 
    1. Song cover image
    2. Song information area (name and artist)
        - Long-pressing on the song name should open the edit song metadata modal
    3. "Lyrics" button, "Add to playlist" button
        - Pressing the lyrics button should open the lyrics modal (take up almost the entire screen when opened, leaving space only for a player bar on top, closed by swiping down or pressing on the player bar)
        - Pressing the add to playlist button should open the add to playlist modal
    4. Progress bar
    5. Play/pause button, "next song" button, "previous song" button
    6. Current queue (partially hidden, can be viewed in full when user swipes up, like Youtube Music)

#### Current queue modal
- Elements:
    1. Queue header (show "Up next" text and "Clear queue" button on the rightmost side)
    2. Song list
- The current queue should be partially hidden by default, can be viewed in full when user swipes up, like Youtube Music
- Swiping down should collapse the current queue modal
- Tapping on the "Clear queue" button should clear the current queue, return the user to the previous page (before the "Now playing" page) and display "No song is being played" in the player bar
- Tapping on a song in the list should play the song
- The songs in the queue should be re-arrangeable by drag-and-drop and removeable from queue with an X button

#### Player bar
- The player bar should be hidden

