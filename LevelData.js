export const Levels = [
  {
    name: "Level 1: Grassland",
    bgImage: "/Assets/Free/Background/Blue.png",
    terrainColor: "#8B4513",
    grassColor: "#228B22",
    length: 3000,
    platforms: [
      { x: 300, y: 240, width: 96, height: 8 },
      { x: 600, y: 240, width: 96, height: 8 },
      { x: 750, y: 160, width: 96, height: 8 },
      { x: 1000, y: 240, width: 128, height: 8 },
      { x: 1400, y: 210, width: 96, height: 8 },
      { x: 1800, y: 240, width: 96, height: 8 },
      { x: 2000, y: 160, width: 96, height: 8 },
      { x: 2300, y: 240, width: 96, height: 8 },
    ],
    boxes: [
      { x: 400, y: 150 },
      { x: 450, y: 150 },
      { x: 1000, y: 140 },
      { x: 1200, y: 100 },
    ],
    enemies: [
      { x: 500, type: 0 }, // Mask Dude
      { x: 1500, type: 0 },
      { x: 2500, type: 0 },
    ],
    spikes: [
      { x: 1300, count: 4 }, // gap spikes
    ],
    trampolines: [
      { x: 1200, y: 292 }, // ground level is 360-40 = 320, minus 28 = 292
    ],
  },
  {
    name: "Level 2: Dungeon",
    bgImage: "/Assets/Free/Background/Brown.png",
    terrainColor: "#4a4a4a", // dark grey
    grassColor: "#2b2b2b",
    length: 5400,
    platforms: [
      { x: 400, y: 260, width: 64, height: 8 }, // collision height only 8 (visual rendered as thick)
      { x: 600, y: 160, width: 64, height: 8 },
      { x: 900, y: 240, width: 128, height: 8 },
      { x: 1400, y: 100, width: 64, height: 8 },
      { x: 1600, y: 200, width: 64, height: 8 },
      { x: 1900, y: 240, width: 128, height: 8 },
      { x: 2300, y: 140, width: 64, height: 8 },
      { x: 2500, y: 240, width: 128, height: 8 },
      { x: 3100, y: 180, width: 96, height: 8 },
      { x: 4180, y: 120, width: 96, height: 8 },
      { x: 4330, y: 120, width: 96, height: 8 },
      { x: 4480, y: 120, width: 96, height: 8 },
      { x: 4260, y: 200, width: 96, height: 8 },
      { x: 4410, y: 200, width: 96, height: 8 },
      { x: 4560, y: 200, width: 96, height: 8 },
      { x: 4180, y: 280, width: 96, height: 8 },
      { x: 4330, y: 280, width: 96, height: 8 },
      { x: 4480, y: 280, width: 96, height: 8 },
    ],
    boxes: [
      { x: 610, y: 70 },
      { x: 1400, y: 20 },
      { x: 2520, y: 150 },
    ],
    enemies: [
      { x: 800, type: 2 }, // Ninja Frog
      { x: 1200, type: 2 },
      { x: 2100, type: 2 },
      { x: 2600, type: 2 },
      { x: 3100, type: 2 },
    ],
    spikes: [
      { x: 500, count: 6 },
      { x: 1050, count: 10 },
      { x: 2050, count: 12 },
      { x: 3000, count: 8 },
    ],
    trampolines: [
      { x: 1500, y: 292 },
      { x: 2930, y: 292 },
    ],
    boss: {
      x: 4600,
      y: 240,
      health: 20,
      triggerX: 4100,
    },
  },
  {
    name: "Level 3: Twilight",
    bgImage: "/Assets/Free/Background/Pink.png",
    terrainColor: "#800000", // maroon
    grassColor: "#8B008B", // dark magenta
    length: 5000,
    platforms: [
      { x: 300, y: 200, width: 32, height: 8 }, // tall walls for wall jump
      { x: 600, y: 150, width: 32, height: 8 },
      { x: 1000, y: 250, width: 96, height: 8 },
      { x: 1400, y: 150, width: 96, height: 8 },
      { x: 1800, y: 200, width: 32, height: 8 },
      { x: 2200, y: 100, width: 32, height: 8 },
      { x: 2600, y: 240, width: 64, height: 8 },
      { x: 3200, y: 150, width: 64, height: 8 },
      { x: 3800, y: 200, width: 32, height: 8 },
      { x: 4200, y: 100, width: 64, height: 8 },
    ],
    boxes: [
      { x: 1020, y: 160 },
      { x: 2600, y: 160 },
      { x: 3200, y: 80 },
    ],
    enemies: [
      { x: 800, type: 1 }, // Pink Man (fast runner)
      { x: 1200, type: 1 },
      { x: 2400, type: 1 },
      { x: 2900, type: 1 },
      { x: 3500, type: 1 },
      { x: 4000, type: 1 },
    ],
    spikes: [
      { x: 350, count: 14 },
      { x: 650, count: 20 },
      { x: 1850, count: 20 },
      { x: 3850, count: 20 },
    ],
    trampolines: [
      { x: 900, y: 292 },
      { x: 3000, y: 292 },
      { x: 4500, y: 292 },
    ],
  },
];
