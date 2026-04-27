# Mobile playback modes

This file describes the audio playback modes to be implemented on mobile.

## 1. No-loop
- Songs should be added to the queue in the order of songs in the screen where the user last clicked on a song.
    - The queue should be cleared when the user clicks on a song in a different screen.
    - The queue should not be cleared when the user navigates to a different screen without playing a song.
    - The queue should be updated when the user navigates to a different screen and plays a song.
- When the user reaches the end of the queue, playback should stop.
    - E.g. The library has the following list of songs: 1, 2, 3, 4, 5.
        - If the user clicked on song 1, the queue should be: 1, 2, 3, 4, 5.
        - If the user clicked on song 4, the queue should be: 4, 5.
- There should be an option for the user to shuffle.
    - If this option is enabled, the remaining songs on the queue should be played in a randomized order.
    - However, when the user reaches the end of the queue, playback should still stop.     


## 2. Loop all
- Similar to no-loop, but when the user reaches the end of the queue, the playback should continue with the first song in the queue.
    - i.e. A song that has been played/removed from queue should be added back to the end of the queue.
    - E.g. The library has the following list of songs: 1, 2, 3, 4, 5.
        - If the user clicked on song 1, the queue should be: 1, 2, 3, 4, 5, 1, 2, 3, 4, 5...
        - If the user clicked on song 4, the queue should be: 4, 5, 1, 2, 3, 4, 5, 1...
- There should be an option for the user to shuffle.
    - If this option is enabled, the songs on the queue should be played in a randomized order.
    - However, when the user reaches the end of the queue, the playback should still continue with the first song in the queue.     


## 3. Loop one
- Only the currently selected song should be played.
- When playback ends, the song should be played again.
- The option to shuffle should be disabled.
- The option to go to previous/next song should lead to the current song being played again.