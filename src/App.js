import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [speed, setSpeed] = useState(1);
  const [orbs, setOrbs] = useState([]);
  const audioContext = useRef(new (window.AudioContext || window.webkitAudioContext)());

  const handleSpeedChange = (event) => {
    setSpeed(event.target.value);
  };

  const spawnOrb = () => {
    const newOrb = {
      id: orbs.length,
      size: Math.random() * 50 + 10,
      x: Math.random() * 700, 
      y: Math.random() * 700,
      dx: (Math.random() - 0.5) * speed,
      dy: (Math.random() - 0.5) * speed,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      sound: `${process.env.PUBLIC_URL}/sounds/sound${Math.floor(Math.random() * 20) + 1}.wav`,
      collided: false,
    };
    setOrbs([...orbs, newOrb]);
  };

  const playSound = (url, volume) => {
    fetch(url)
      .then(response => {
        const ct = response.headers.get('content-type');
        if (!ct || !ct.includes('audio')) {
          throw new Error('content type = ' + ct);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioContext.current.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const source = audioContext.current.createBufferSource();
        const gainNode = audioContext.current.createGain();
        gainNode.gain.value = volume;
        source.buffer = audioBuffer;
        source.connect(gainNode).connect(audioContext.current.destination);
        source.start(0);
      });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOrbs((prevOrbs) =>
        prevOrbs.map((orb, index) => {
          let { x, y, dx, dy, size, sound, collided } = orb;

          x += dx;
          y += dy;
          collided = false;

          if (x < 0 || x + size > 800) {
            dx = -dx;
            x = x < 0 ? 0 : 800 - size;
            if (!collided) {
              playSound(sound, size / 60);
              collided = true;
            }
          }

          if (y < 0 || y + size > 800) {
            dy = -dy;
            y = y < 0 ? 0 : 800 - size;
            if (!collided) {
              playSound(sound, size / 60);
              collided = true;
            }
          }

          // Handle collisions with other orbs
          prevOrbs.forEach((otherOrb, otherIndex) => {
            if (index !== otherIndex) {
              const dist = Math.sqrt(
                (x - otherOrb.x) ** 2 + (y - otherOrb.y) ** 2
              );
              if (dist < (size + otherOrb.size) / 2) {
                // Calculate new velocities
                const angle = Math.atan2(y - otherOrb.y, x - otherOrb.x);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);

                // Rotate orb velocities
                const vx1 = dx * cos + dy * sin;
                const vy1 = dy * cos - dx * sin;
                const vx2 = otherOrb.dx * cos + otherOrb.dy * sin;
                const vy2 = otherOrb.dy * cos - otherOrb.dx * sin;

                // Swap velocities
                const temp = vx1;
                dx = vx2 * cos - vy1 * sin;
                dy = vx2 * sin + vy1 * cos;
                otherOrb.dx = temp * cos - vy2 * sin;
                otherOrb.dy = temp * sin + vy2 * cos;

                // Update positions to prevent overlap
                const overlap = (size + otherOrb.size) / 2 - dist;
                x += overlap * cos;
                y += overlap * sin;
                otherOrb.x -= overlap * cos;
                otherOrb.y -= overlap * sin;

                if (!collided) {
                  playSound(sound, size / 60);
                  playSound(otherOrb.sound, otherOrb.size / 60);
                  collided = true;
                  otherOrb.collided = true;
                }
              }
            }
          });

          return { ...orb, x, y, dx, dy, collided };
        })
      );
    }, 16);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className="App">
      <div className="controls">
        <label>Speed</label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
        />
        <button className="spawn-orb-button" onClick={spawnOrb}></button>
      </div>
      <div className="simulation">
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className="orb"
            style={{
              width: orb.size,
              height: orb.size,
              backgroundColor: orb.color,
              left: orb.x,
              top: orb.y,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default App;
