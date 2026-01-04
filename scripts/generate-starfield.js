
const fs = require('fs');

function random(max) {
    return Math.floor(Math.random() * max);
}

function createShadows(n) {
    let shadows = [];
    for (let i = 0; i < n; i++) {
        shadows.push(`${random(100)}vw ${random(100)}vh #FFF`);
    }
    return shadows.join(', ');
}

const smallShadows = createShadows(100); // reduced count for performance
const mediumShadows = createShadows(50);
const bigShadows = createShadows(20);

const css = `
/* ============================================
   STARFIELD ANIMATION (Restored)
   ============================================ */

.starfield-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
  opacity: 0.6; /* 60% opacity as per changelog */
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3)); /* 30% opacity gradient */
}

.star-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
}

.stars-small {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${smallShadows};
  animation: animStar 50s linear infinite;
}

.stars-small:after {
  content: " ";
  position: absolute;
  top: 100vh;
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${smallShadows};
}

.stars-medium {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${mediumShadows};
  animation: animStar 100s linear infinite;
}

.stars-medium:after {
  content: " ";
  position: absolute;
  top: 100vh;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${mediumShadows};
}

.stars-large {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: ${bigShadows};
  animation: animStar 150s linear infinite;
}

.stars-large:after {
  content: " ";
  position: absolute;
  top: 100vh;
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: ${bigShadows};
}

@keyframes animStar {
  from { transform: translateY(0px) }
  to { transform: translateY(-100vh) }
}
`;

console.log(css);
