# Shoe Interactive Demo

A zero-build vanilla HTML/CSS/JS prototype for testing the illusion:

Social Reel → tap → same final frame → tiny shot continuation → product becomes interactive.

## Files

```text
shoe-interactive-demo/
├── index.html
├── style.css
├── app.js
├── README.md
└── assets/
    ├── hero-frame.png
    └── reel.mp4   # add your completed Reel here
```

`assets/hero-frame.png` is the supplied final-frame reference image and is used unchanged as the first webpage visual.

## Run locally

```bash
cd shoe-interactive-demo
python3 -m http.server 8000 --bind 0.0.0.0
```

Open on the computer:

```text
http://localhost:8000
```

## Test on a phone

1. Put the phone and computer on the same Wi-Fi network.
2. Find the computer's LAN IP:

```bash
hostname -I
```

3. On the phone, open:

```text
http://YOUR_COMPUTER_IP:8000
```

Example:

```text
http://192.168.1.12:8000
```

If the page is unreachable, check whether a local firewall is blocking TCP port 8000.

## Debug mode

Open:

```text
http://localhost:8000/?debug=1
```

The overlay shows hero decode timing, browser FCP, time-to-interactive, video metadata readiness, state, and the transition constants.

## Main experiment controls

Edit the constants at the top of `app.js`:

```js
const HANDOFF_DELAY = 420;
const CONTINUATION_DURATION = 950;
const INTERACTION_REVEAL_DELAY = 780;

const IMAGE_SCALE = 1.000;
const IMAGE_X = 0;
const IMAGE_Y = 0;
```

- `HANDOFF_DELAY`: wait after the hero frame paints before the continuation starts.
- `CONTINUATION_DURATION`: length of the subtle push-in.
- `INTERACTION_REVEAL_DELAY`: how long after the continuation begins before the hotspot becomes interactive.
- `IMAGE_SCALE`: global image scale. Keep `1.000` for an exact source-frame match.
- `IMAGE_X`: horizontal shift in pixels.
- `IMAGE_Y`: vertical shift in pixels.

## Recolour prototype

The BLACK / WHITE / RED controls use a clipped duplicate of the exact hero frame. This is intentionally lightweight and approximate; it preserves the original photography and does not recolour the entire image.
# trying
