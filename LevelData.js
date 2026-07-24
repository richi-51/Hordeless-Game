export const Levels = [
  {
    name: "Level 1: Grassland",
    bgImage: "/Assets/Free/Background/Blue.png",
    terrainColor: "#8B4513",
    grassColor: "#228B22",
    length: 3600,
    gaps: [
      { x: 900, width: 120 },
      { x: 2100, width: 140 },
    ],
    terrain: [
      // Spawn Hill 1 (Stepped Pyramid)
      { x: 300, y: 280, width: 140, height: 40 },
      { x: 340, y: 240, width: 100, height: 80 },
      { x: 380, y: 200, width: 60, height: 120 },

      // Gap 1 Stepping Island (Easy jump with 0 skills)
      { x: 935, y: 260, width: 50, height: 60 },

      // Mid-level Fortress Cliff
      { x: 1300, y: 270, width: 220, height: 50 },
      { x: 1360, y: 210, width: 160, height: 110 },
      { x: 1420, y: 150, width: 100, height: 170 },

      // Gap 2 Stepping Island
      { x: 2145, y: 250, width: 50, height: 70 },

      // Pre-Goal High Ridge
      { x: 2700, y: 270, width: 180, height: 50 },
      { x: 2760, y: 210, width: 120, height: 110 },
      { x: 2820, y: 150, width: 60, height: 170 },
    ],
    platforms: [
      // Multi-tier Sky Bridges (Accessible via trampolines or climbing hills)
      { x: 420, y: 150, width: 96, height: 8 },
      { x: 550, y: 120, width: 96, height: 8 },
      { x: 700, y: 150, width: 96, height: 8 },

      { x: 1080, y: 210, width: 96, height: 8 },
      { x: 1200, y: 160, width: 80, height: 8 },
      { x: 1540, y: 120, width: 112, height: 8 },
      { x: 1700, y: 160, width: 96, height: 8 },
      { x: 1850, y: 210, width: 96, height: 8 },

      { x: 2250, y: 190, width: 96, height: 8 },
      { x: 2400, y: 140, width: 112, height: 8 },
      { x: 2550, y: 180, width: 96, height: 8 },
      { x: 2900, y: 120, width: 96, height: 8 },
      { x: 3050, y: 160, width: 96, height: 8 },
      { x: 3200, y: 210, width: 96, height: 8 },
    ],
    boxes: [
      { x: 400, y: 160 },
      { x: 600, y: 80 },
      { x: 1450, y: 110 },
      { x: 1600, y: 80 },
      { x: 2450, y: 100 },
      { x: 2840, y: 110 },
    ],
    enemies: [
      { x: 500, type: 0 },
      { x: 750, type: 0 },
      { x: 1350, type: 0 },
      { x: 1750, type: 0 },
      { x: 2350, type: 0 },
      { x: 3100, type: 0 },
    ],
    spikes: [
      { x: 700, count: 4 },
      { x: 1650, count: 4 },
      { x: 2450, count: 4 },
    ],
    trampolines: [
      { x: 580, y: 292 },
      { x: 1800, y: 292 },
    ],
  },
  {
    name: "Level 2: Dungeon",
    bgImage: "/Assets/Free/Background/Brown.png",
    terrainColor: "#4a4a4a",
    grassColor: "#2b2b2b",
    length: 5400,
    gaps: [
      { x: 1100, width: 150 },
      { x: 2600, width: 160 },
      { x: 3700, width: 140 },
    ],
    terrain: [
      // Dungeon Entrance Guard Tower
      { x: 500, y: 270, width: 160, height: 50 },
      { x: 550, y: 210, width: 110, height: 110 },

      // Gap 1 Stepping Pillar
      { x: 1145, y: 250, width: 60, height: 70 },

      // Fortress Main Keep
      { x: 1600, y: 270, width: 280, height: 50 },
      { x: 1660, y: 210, width: 220, height: 110 },
      { x: 1720, y: 150, width: 160, height: 170 },

      // Gap 2 Stepping Pillar
      { x: 2645, y: 240, width: 70, height: 80 },

      // Pre-Boss Bastion
      { x: 3100, y: 270, width: 220, height: 50 },
      { x: 3160, y: 210, width: 160, height: 110 },

      // Gap 3 Stepping Pillar
      { x: 3740, y: 250, width: 60, height: 70 },
    ],
    platforms: [
      { x: 350, y: 240, width: 80, height: 8 },
      { x: 700, y: 160, width: 96, height: 8 },
      { x: 850, y: 200, width: 96, height: 8 },
      { x: 1000, y: 230, width: 80, height: 8 },

      { x: 1250, y: 200, width: 96, height: 8 },
      { x: 1400, y: 150, width: 96, height: 8 },
      { x: 1900, y: 110, width: 128, height: 8 },
      { x: 2100, y: 160, width: 96, height: 8 },
      { x: 2300, y: 210, width: 96, height: 8 },

      { x: 2750, y: 180, width: 96, height: 8 },
      { x: 2900, y: 130, width: 96, height: 8 },

      { x: 3350, y: 160, width: 96, height: 8 },
      { x: 3500, y: 200, width: 96, height: 8 },

      // Boss Arena Tactical Platforms
      { x: 4180, y: 200, width: 96, height: 8 },
      { x: 4330, y: 140, width: 96, height: 8 },
      { x: 4480, y: 200, width: 96, height: 8 },
    ],
    boxes: [
      { x: 570, y: 170 },
      { x: 1750, y: 110 },
      { x: 2920, y: 90 },
      { x: 3200, y: 170 },
    ],
    enemies: [
      { x: 750, type: 2 },
      { x: 1350, type: 2 },
      { x: 2000, type: 2 },
      { x: 2800, type: 2 },
      { x: 3400, type: 2 },
    ],
    spikes: [
      { x: 400, count: 4 },
      { x: 1480, count: 4 },
      { x: 2420, count: 4 },
      { x: 2980, count: 4 },
    ],
    trampolines: [
      { x: 800, y: 292 },
      { x: 2200, y: 292 },
    ],
    boss: {
      x: 4600,
      y: 240,
      health: 1,
      triggerX: 4100,
    },
  },
  {
    name: "Level 3: Twilight",
    bgImage: "/Assets/Free/Background/Pink.png",
    terrainColor: "#800000",
    grassColor: "#8B008B",
    length: 5000,
    gaps: [
      { x: 800, width: 140 },
      { x: 2000, width: 150 },
      { x: 3400, width: 140 },
    ],
    terrain: [
      // Twilight Entrance Spire
      { x: 350, y: 270, width: 140, height: 50 },
      { x: 390, y: 210, width: 100, height: 110 },
      { x: 430, y: 150, width: 60, height: 170 },

      // Gap 1 Stepping Island
      { x: 840, y: 250, width: 60, height: 70 },

      // Twilight Central Castle
      { x: 1300, y: 270, width: 240, height: 50 },
      { x: 1360, y: 210, width: 180, height: 110 },
      { x: 1420, y: 150, width: 120, height: 170 },

      // Gap 2 Stepping Island
      { x: 2045, y: 240, width: 60, height: 80 },

      // Grand Twilight Ridge
      { x: 2600, y: 270, width: 220, height: 50 },
      { x: 2660, y: 210, width: 160, height: 110 },
      { x: 2720, y: 150, width: 100, height: 170 },

      // Gap 3 Stepping Island
      { x: 3440, y: 250, width: 60, height: 70 },
    ],
    platforms: [
      { x: 200, y: 240, width: 80, height: 8 },
      { x: 600, y: 160, width: 96, height: 8 },
      { x: 720, y: 200, width: 80, height: 8 },

      { x: 980, y: 210, width: 96, height: 8 },
      { x: 1120, y: 160, width: 96, height: 8 },
      { x: 1600, y: 120, width: 128, height: 8 },
      { x: 1780, y: 170, width: 96, height: 8 },

      { x: 2150, y: 190, width: 96, height: 8 },
      { x: 2300, y: 140, width: 112, height: 8 },
      { x: 2480, y: 180, width: 96, height: 8 },

      { x: 2850, y: 110, width: 112, height: 8 },
      { x: 3000, y: 160, width: 96, height: 8 },
      { x: 3180, y: 210, width: 96, height: 8 },

      { x: 3550, y: 200, width: 96, height: 8 },
      { x: 3700, y: 150, width: 96, height: 8 },
      { x: 3850, y: 210, width: 96, height: 8 },
      { x: 4000, y: 170, width: 96, height: 8 },
    ],
    boxes: [
      { x: 450, y: 110 },
      { x: 1440, y: 110 },
      { x: 2740, y: 110 },
      { x: 3720, y: 110 },
    ],
    enemies: [
      { x: 700, type: 1 },
      { x: 1200, type: 1 },
      { x: 1800, type: 1 },
      { x: 2500, type: 1 },
      { x: 3100, type: 1 },
      { x: 3900, type: 1 },
    ],
    spikes: [
      { x: 600, count: 4 },
      { x: 1150, count: 4 },
      { x: 1850, count: 4 },
      { x: 3200, count: 4 },
    ],
    trampolines: [
      { x: 250, y: 292 },
      { x: 1650, y: 292 },
    ],
  },
];
