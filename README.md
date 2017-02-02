# node-music-player
A simple browser-based music player

## Install

```
git clone https://github.com/talkingscott/node-music-player.git
cd node-music-player
npm install
```

## Load

```
export MUSIC_ROOT=path-to-the-root-of-your-files
node loadstore.js
```

## Run

```
# This should be the same as used for loading
export MUSIC_ROOT=path-to-the-root-of-your-files
export PORT=4444
node node-music-player.js
```

Then point your browser to http://localhost:4444/
