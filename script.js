const ecosystemSimulator = function(p) {
  // Global Variables
  let grass, pademelons, devils, bandicoots, chart;
  let season = 0; // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
  let seasonDuration = 300;
  let showSeasons = true;
  let showDisasters = true;
  let disasterDuration = 100;
  let disasterFrame = -disasterDuration;
  let isPaused = false;
  let grassLimitEnabled = true;
  let points = 0;
  let stabilityCheckFrames = 0;
  const stabilityThreshold = 1000;
  const stabilityPoints = 50;
  const rangerBadgePoints = 1500;
  let rangerBadgeAchieved = false;

  // Speed control
  let speedMultiplier = 1;
  let lastFrameTime = performance.now();
  let customFrameCount = 0;

  // Ecological metrics
  let biodiversityIndex = 0;
  let ecosystemHealth = 100;
  let maxGrass = 0;
  let maxPademelons = 0;
  let maxDevils = 0;
  let maxBandicoots = 0;

  // Learning objectives
  let objectives = [
    { 
      description: "Increase pademelon population to 200", 
      target: 200, 
      achieved: false, 
      points: 200, 
      type: "pademelons" 
    },
    { 
      description: "Maintain devil population > 100 with grass > 400", 
      target: 100, 
      achieved: false, 
      points: 300, 
      type: "apex_stability" 
    },
    { 
      description: "Trigger bandicoot-driven grass recovery (50% increase)", 
      target: 1.5, 
      achieved: false, 
      points: 200, 
      type: "keystone_effect" 
    },
    { 
      description: "Survive 8 natural disasters", 
      target: 8, 
      achieved: false, 
      points: 100, 
      count: 0, 
      type: "disasters" 
    },
    { 
      description: "Maintain biodiversity index > 0.7 for 1000 frames", 
      target: 1000, 
      achieved: false, 
      points: 150, 
      type: "biodiversity" 
    }
  ];

  let ongoingObjectives = [
    { 
      description: "Keep grass population > 700 for 800 frames", 
      target: 800, 
      achieved: false, 
      points: 300, 
      type: "grass", 
      condition: (g) => g > 700 
    },
    { 
      description: "Keep devil population > 70 for 800 frames", 
      target: 800, 
      achieved: false, 
      points: 300, 
      type: "devils", 
      condition: (d) => d > 70 
    },
    { 
      description: "Maintain balanced ecosystem for 1500 frames", 
      target: 1500, 
      achieved: false, 
      points: 500, 
      type: "balanced", 
      condition: (g, p, d, b) => g > 500 && p > 100 && d > 50 && b > 100 
    }
  ];

  let achievements = [
    { 
      description: "Ecosystem Guardian: Achieve all ongoing objectives", 
      achieved: false, 
      points: 500 
    },
    { 
      description: "Devil Advocate: Maintain healthy devil population for 5000 frames", 
      achieved: false, 
      frames: 0, 
      target: 5000, 
      points: 300 
    },
    { 
      description: "Keystone Keeper: Double bandicoot population from starting value", 
      achieved: false, 
      target: 60, 
      points: 200 
    }
  ];

  let populationHistory = [];
  const historyLength = 200;

  // Seasonal parameters
  let seasonParams = [
    { name: "Spring", rainfall: 70, temperature: 20, color: "#d4f1f4" },
    { name: "Summer", rainfall: 30, temperature: 35, color: "#f7d794" },
    { name: "Autumn", rainfall: 50, temperature: 15, color: "#f5cd79" },
    { name: "Winter", rainfall: 40, temperature: 5, color: "#c8d6e5" }
  ];

  // Interpolation variables
  let targetRainfall, targetTemperature;
  let currentRainfall, currentTemperature;
  const interpolationSpeed = 0.01;

  // DOM Elements
  let disasterMessage, seasonDisplay, pointsDisplay, objectiveDisplay;
  let ecosystemHealthDisplay, grassValue, pademelonsValue;
  let devilsValue, bandicootsValue, healthStatus, healthText;
  let progressBar, progressText;

  p.setup = function() {
    // Initialize p5.js canvas
    let canvas = p.createCanvas(800, 300);
    canvas.parent("canvas-container");
    
    // Initialize chart
    initChart();
    
    // Get DOM elements
    disasterMessage = document.getElementById('disasterMessage');
    seasonDisplay = document.getElementById('seasonDisplay');
    pointsDisplay = document.getElementById('pointsDisplay');
    objectiveDisplay = document.getElementById('objectiveDisplay');
    ecosystemHealthDisplay = document.getElementById('ecosystemHealth');
    grassValue = document.getElementById('grass-value');
    pademelonsValue = document.getElementById('pademelons-value');
    devilsValue = document.getElementById('devils-value');
    bandicootsValue = document.getElementById('bandicoots-value');
    healthStatus = document.querySelector('.health-status');
    healthText = document.querySelector('.health-text');
    progressBar = document.querySelector('.progress-bar');
    progressText = document.querySelector('.progress-text');
    
    // Set up controls
    initControls();
    
    // Reset simulation to starting state
    resetSim();
    
    // Start the game loop
    p.loop();
  };

  p.draw = function() {
    if (!isPaused) {
      update();
      drawVisualization();
      customFrameCount++;
    }
  };

  // Initialize the population chart
  function initChart() {
    const ctx = document.getElementById('populationChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { 
            label: "Grass", 
            data: [], 
            borderColor: "#4CAF50", 
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: true,
            tension: 0.4
          },
          { 
            label: "Pademelons", 
            data: [], 
            borderColor: "#FF9800", 
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            fill: true,
            tension: 0.4
          },
          { 
            label: "Devils", 
            data: [], 
            borderColor: "#F44336", 
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            fill: true,
            tension: 0.4
          },
          { 
            label: "Bandicoots", 
            data: [], 
            borderColor: "#FFEB3B", 
            backgroundColor: "rgba(255, 235, 59, 0.1)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          }
        },
        elements: {
          point: {
            radius: 0,
            hoverRadius: 5
          }
        }
      }
    });
  }

  // Set up control event listeners
  function initControls() {
    // Speed control
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");
    speedSlider.addEventListener("input", () => {
      speedMultiplier = parseFloat(speedSlider.value);
      speedValue.textContent = speedMultiplier.toFixed(1) + "x";
    });

    // Slider value updates
    document.querySelectorAll("input[type='range']").forEach(slider => {
      slider.addEventListener("input", function() {
        document.getElementById(this.id + 'Value').textContent = this.value;
      });
    });

    // Button controls
    document.getElementById("resetButton").addEventListener("click", resetSim);
    document.getElementById("pauseButton").addEventListener("click", togglePause);
    document.getElementById("exportCSV").addEventListener("click", exportCSV);
    document.getElementById("toggleGrassLimitButton").addEventListener("click", toggleGrassLimit);

    // Toggle switches
    document.getElementById("toggleSeasons").addEventListener("change", toggleSeasonsDisplay);
    document.getElementById("toggleDisasters").addEventListener("change", toggleDisasters);

    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        
        btn.classList.add("active");
        document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
      });
    });
  }

  // Reset simulation to initial state
  function resetSim() {
    // Reset populations
    grass = 100;
    pademelons = 50;
    devils = 10;
    bandicoots = 30;
    
    // Reset tracking variables
    customFrameCount = 0;
    lastFrameTime = performance.now();
    points = 0;
    ecosystemHealth = 100;
    biodiversityIndex = 0;
    maxGrass = 0;
    maxPademelons = 0;
    maxDevils = 0;
    maxBandicoots = 0;
    
    // Reset objectives
    objectives.forEach(obj => obj.achieved = false);
    ongoingObjectives.forEach(obj => {
      obj.achieved = false;
      obj.target = obj.type === "balanced" ? 1500 : 800;
    });
    achievements.forEach(ach => ach.achieved = false);
    
    // Reset chart
    if (chart) {
      chart.data.labels = [];
      chart.data.datasets.forEach(dataset => dataset.data = []);
      chart.update();
    }
    
    populationHistory = [];
    
    // Reset sliders to default
    document.getElementById("rainfall").value = 50;
    document.getElementById("rainfallValue").textContent = "50";
    document.getElementById("temperature").value = 20;
    document.getElementById("temperatureValue").textContent = "20";
    document.getElementById("invasiveSpecies").value = 5;
    document.getElementById("invasiveSpeciesValue").textContent = "5";
    document.getElementById("humanImpact").value = 2;
    document.getElementById("humanImpactValue").textContent = "2";
    
    // Reset season
    season = 0;
    targetRainfall = currentRainfall = seasonParams[season].rainfall;
    targetTemperature = currentTemperature = seasonParams[season].temperature;
    seasonDisplay.textContent = seasonParams[season].name;
    
    // Update UI
    updateUI();
  }

  // Update simulation state
  function update() {
    // Seasonal changes
    updateSeasons();
    
    // Get environmental factors
    const rainfall = getModifiedRainfall();
    const temperature = getModifiedTemperature();
    const invasiveSpecies = parseFloat(document.getElementById("invasiveSpecies").value);
    const humanImpact = parseFloat(document.getElementById("humanImpact").value);
    
    // Update populations
    updateGrass(rainfall, invasiveSpecies);
    updatePademelons(temperature, humanImpact, invasiveSpecies);
    updateBandicoots(temperature, invasiveSpecies, humanImpact);
    updateDevils(humanImpact, temperature);
    
    // Apply population limits
    enforceLimits();
    
    // Track history for stability checks
    updateHistory();
    
    // Check for events and objectives
    checkRandomEvents();
    checkObjectives();
    updateEcosystemMetrics();
    
    // Update species value displays
    updateSpeciesDisplays();
  }

  // Update seasonal changes
  function updateSeasons() {
    if (customFrameCount % seasonDuration === 0) {
      season = (season + 1) % 4;
      seasonDisplay.textContent = seasonParams[season].name;
      targetRainfall = seasonParams[season].rainfall;
      targetTemperature = seasonParams[season].temperature;
    }
    
    // Smooth seasonal transitions
    currentRainfall += (targetRainfall - currentRainfall) * interpolationSpeed;
    currentTemperature += (targetTemperature - currentTemperature) * interpolationSpeed;
  }

  // Get modified rainfall value
  function getModifiedRainfall() {
    const rainfallSlider = parseFloat(document.getElementById("rainfall").value) - 50;
    return currentRainfall + rainfallSlider;
  }

  // Get modified temperature value
  function getModifiedTemperature() {
    const tempSlider = parseFloat(document.getElementById("temperature").value) - 20;
    return currentTemperature + tempSlider;
  }

  // Update grass population
  function updateGrass(rainfall, invasiveSpecies) {
    // Base growth affected by rainfall and bandicoots (keystone effect)
    const bandicootEffect = 1 + (bandicoots * 0.002);
    const growthRate = (rainfall / 20) * bandicootEffect;
    
    // Loss from pademelons grazing and invasive species
    const lossRate = (pademelons / 25) + (invasiveSpecies / 2);
    
    // Update grass population
    grass += growthRate - lossRate;
    grass = p.max(grass, 0);
    
    // Track max grass for objectives
    if (grass > maxGrass) maxGrass = grass;
  }

  // Update pademelon population
  function updatePademelons(temperature, humanImpact, invasiveSpecies) {
    // Growth depends on available grass
    const growthRate = grass / 200;
    
    // Losses from predation, environment, and humans
    const predationLoss = devils / 8;
    const tempStress = temperature > 25 ? (temperature - 25) / 10 : 0;
    const humanLoss = humanImpact / 3;
    const invasiveLoss = invasiveSpecies / 8;
    
    pademelons += growthRate - predationLoss - tempStress - humanLoss - invasiveLoss;
    pademelons = p.max(pademelons, 0);
    
    if (pademelons > maxPademelons) maxPademelons = pademelons;
  }

  // Update bandicoot population
  function updateBandicoots(temperature, invasiveSpecies, humanImpact) {
    // Bandicoots benefit from grass but compete with pademelons
    const resourceAvailability = (grass / 300) - (pademelons / 400);
    const tempEffect = temperature > 30 ? -(temperature - 30) / 15 : 0;
    
    // Threats from devils and human impact
    const predationRisk = devils / 15;
    const humanThreat = humanImpact / 4;
    const invasiveThreat = invasiveSpecies / 6;
    
    bandicoots += resourceAvailability - predationRisk - humanThreat - invasiveThreat + tempEffect;
    bandicoots = p.max(bandicoots, 0);
    
    if (bandicoots > maxBandicoots) maxBandicoots = bandicoots;
  }

  // Update devil population
  function updateDevils(humanImpact, temperature) {
    // Devils primarily depend on pademelons but will scavenge
    const foodAvailability = (pademelons / 70) + (bandicoots / 100);
    
    // Carrying capacity based on available prey
    const carryingCapacity = (pademelons + bandicoots) * 0.4;
    const densityDependence = 1 - (devils / (carryingCapacity + 1));
    
    // Environmental stresses
    const tempStress = p.abs(temperature - 20) / 15;
    const humanStress = humanImpact / 3;
    
    devils += foodAvailability * densityDependence - tempStress - humanStress;
    devils = p.max(devils, 0);
    
    if (devils > maxDevils) maxDevils = devils;
  }

  // Enforce population limits
  function enforceLimits() {
    // Apply carrying capacities
    if (grassLimitEnabled) grass = p.constrain(grass, 0, 1500);
    
    // Devils can't exceed prey-based capacity
    const devilCapacity = (pademelons + bandicoots) * 0.5;
    devils = p.min(devils, devilCapacity);
    
    // Bandicoots have grass-dependent limit
    const bandicootCapacity = grass * 0.15;
    bandicoots = p.min(bandicoots, bandicootCapacity);
  }

  // Update population history
  function updateHistory() {
    // Record current state
    populationHistory.push({
      frame: customFrameCount,
      grass: grass,
      pademelons: pademelons,
      devils: devils,
      bandicoots: bandicoots
    });
    
    // Trim history
    if (populationHistory.length > historyLength) {
      populationHistory.shift();
    }
    
    // Update chart data
    chart.data.labels.push(customFrameCount);
    chart.data.datasets[0].data.push(grass);
    chart.data.datasets[1].data.push(pademelons);
    chart.data.datasets[2].data.push(devils);
    chart.data.datasets[3].data.push(bandicoots);
    
    if (chart.data.labels.length > 100) {
      chart.data.labels.shift();
      chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
  }

  // Check for random events
  function checkRandomEvents() {
    if (showDisasters && customFrameCount % 1000 === 0 && p.random() < 0.3) {
      triggerRandomEvent();
    }
    
    // Educational narrative events
    if (customFrameCount % 750 === 0) {
      triggerNarrativeEvent();
    }
  }

  // Trigger random ecosystem event
  function triggerRandomEvent() {
    const events = [
      { 
        name: "Bushfire", 
        effect: () => {
          grass *= 0.3;
          pademelons *= 0.7;
          devils *= 0.9;
          showEventMessage("Bushfire occurred! Grass reduced by 70%", "#e74c3c");
        }
      },
      {
        name: "Devil Facial Tumor Disease",
        effect: () => {
          const diseaseSeverity = p.random(0.3, 0.7);
          devils *= (1 - diseaseSeverity);
          bandicoots *= (1 + diseaseSeverity * 0.5);
          showEventMessage(`Devil disease outbreak! ${Math.round(diseaseSeverity * 100)}% of devils affected`, "#9b59b6");
        }
      },
      {
        name: "Drought",
        effect: () => {
          targetRainfall *= 0.4;
          showEventMessage("Severe drought! Rainfall drastically reduced", "#3498db");
        }
      }
    ];
    
    const event = events[Math.floor(p.random(events.length))];
    event.effect();
    disasterFrame = customFrameCount;
    
    // Update disaster counters
    const disasterObj = objectives.find(obj => obj.type === "disasters");
    if (disasterObj) disasterObj.count++;
  }

  // Show narrative event message
  function triggerNarrativeEvent() {
    const messages = [];
    
    if (grass < 100 && pademelons > 150) {
      messages.push("Overgrazing alert! Pademelons are consuming grass faster than it can regrow");
    }
    
    if (devils > 100 && pademelons < 80) {
      messages.push("Predator pressure! High devil populations are suppressing pademelon numbers");
    }
    
    if (bandicoots < 20 && grass > 300) {
      messages.push("Keystone species decline: Low bandicoot numbers may lead to reduced soil health");
    }
    
    if (messages.length > 0) {
      showNarrativeMessage(messages[Math.floor(p.random(messages.length))]);
    }
  }

  // Check objectives and achievements
  function checkObjectives() {
    // Standard objectives
    objectives.forEach(obj => {
      if (obj.achieved) return;
      
      let isAchieved = false;
      switch(obj.type) {
        case "pademelons":
          isAchieved = pademelons >= obj.target;
          break;
        case "apex_stability":
          isAchieved = devils >= obj.target && grass > 400;
          break;
        case "keystone_effect":
          isAchieved = grass >= 150 * obj.target;
          break;
        case "disasters":
          isAchieved = obj.count >= obj.target;
          break;
        case "biodiversity":
          isAchieved = biodiversityIndex > 0.7 && customFrameCount >= obj.target;
          break;
      }
      
      if (isAchieved) {
        obj.achieved = true;
        points += obj.points;
        showAchievement(obj.description, obj.points);
      }
    });
    
    // Ongoing objectives
    ongoingObjectives.forEach(obj => {
      if (obj.achieved) return;
      
      let conditionMet = false;
      switch(obj.type) {
        case "grass":
          conditionMet = obj.condition(grass);
          break;
        case "devils":
          conditionMet = obj.condition(devils);
          break;
        case "balanced":
          conditionMet = obj.condition(grass, pademelons, devils, bandicoots);
          break;
      }
      
      if (conditionMet) {
        obj.target--;
        if (obj.target <= 0) {
          obj.achieved = true;
          points += obj.points;
          showAchievement(obj.description, obj.points);
        }
      } else {
        // Reset progress if condition fails
        obj.target = obj.type === "balanced" ? 1500 : 800;
      }
    });
    
    // Achievements
    checkAchievements();
  }

  // Check for achievement unlocks
  function checkAchievements() {
    achievements.forEach(achievement => {
      if (achievement.achieved) return;
      
      let achieved = false;
      
      if (achievement.description.includes("ongoing objectives")) {
        achieved = ongoingObjectives.every(obj => obj.achieved);
      } 
      else if (achievement.description.includes("devil population")) {
        achievement.frames = devils > 70 ? achievement.frames + 1 : 0;
        achieved = achievement.frames >= achievement.target;
      }
      else if (achievement.description.includes("bandicoot population")) {
        achieved = bandicoots >= achievement.target;
      }
      
      if (achieved) {
        achievement.achieved = true;
        points += achievement.points;
        showAchievement(achievement.description, achievement.points);
      }
    });
  }

  // Update ecosystem metrics
  function updateEcosystemMetrics() {
    // Calculate biodiversity index (simplified)
    const total = grass + pademelons + devils + bandicoots;
    if (total > 0) {
      const p1 = grass / total;
      const p2 = pademelons / total;
      const p3 = devils / total;
      const p4 = bandicoots / total;
      biodiversityIndex = 1 - (p1*p1 + p2*p2 + p3*p3 + p4*p4);
    }
    
    // Update ecosystem health display
    updateHealthDisplay();
  }

  // Update health display
  function updateHealthDisplay() {
    let healthStatusText = "Healthy";
    let healthPercentage = 100;
    let healthColor = "#2ecc71";
    
    if (grass === 0 || pademelons === 0 || devils === 0 || bandicoots === 0) {
      healthStatusText = "Collapsed";
      healthPercentage = 0;
      healthColor = "#e74c3c";
    } else if (biodiversityIndex < 0.4) {
      healthStatusText = "Unstable";
      healthPercentage = 40;
      healthColor = "#f39c12";
    } else if (biodiversityIndex < 0.7) {
      healthStatusText = "Stable";
      healthPercentage = 70;
      healthColor = "#3498db";
    }
    
    // Update health meter
    healthStatus.style.width = `${healthPercentage}%`;
    healthStatus.style.background = healthColor;
    healthText.textContent = healthStatusText;
    healthText.style.color = healthColor;
    
    // Update biodiversity display
    document.getElementById("biodiversityValue").textContent = biodiversityIndex.toFixed(2);
  }

  // Update species value displays
  function updateSpeciesDisplays() {
    grassValue.textContent = Math.round(grass);
    pademelonsValue.textContent = Math.round(pademelons);
    devilsValue.textContent = Math.round(devils);
    bandicootsValue.textContent = Math.round(bandicoots);
  }

  // Draw visualization
  function drawVisualization() {
    if (isPaused) return;
    
    // Background with seasonal colors
    p.background(showSeasons ? seasonParams[season].color : 240);
    
    // Draw ecosystem visualization
    drawEcosystem();
    
    // Update chart
    chart.update();
    
    // Update UI
    updateUI();
  }

  // Draw ecosystem visualization
  function drawEcosystem() {
    // Draw food web connections
    drawFoodWeb();
    
    // Draw population indicators
    drawPopulationIndicator(200, p.height/2, grass, "#4CAF50", "Grass");
    drawPopulationIndicator(400, p.height/2, pademelons, "#FF9800", "Pademelons");
    drawPopulationIndicator(600, p.height/2, devils, "#F44336", "Devils");
    drawPopulationIndicator(800, p.height/2, bandicoots, "#FFEB3B", "Bandicoots");
  }

  // Draw food web connections
  function drawFoodWeb() {
    p.strokeWeight(2);
    
    // Grass → Pademelons
    if (grass > 10 && pademelons > 10) {
      p.stroke(76, 175, 80, 150);
      p.line(220, p.height/2, 380, p.height/2);
    }
    
    // Pademelons → Devils
    if (pademelons > 10 && devils > 10) {
      p.stroke(244, 67, 54, 150);
      p.line(420, p.height/2, 580, p.height/2);
    }
    
    // Bandicoots → Grass (positive feedback)
    if (bandicoots > 10 && grass > 10) {
      p.stroke(255, 235, 59, 150);
      p.drawingContext.setLineDash([5, 3]);
      p.line(780, p.height/2, 250, p.height/2);
      p.drawingContext.setLineDash([]);
    }
  }

  // Draw population indicator
  function drawPopulationIndicator(x, y, population, color, label) {
    const size = p.map(population, 0, 1000, 10, 100);
    p.fill(color);
    p.noStroke();
    
    // Draw multiple circles for animal populations
    const count = p.min(10, p.ceil(population / 50));
    for (let i = 0; i < count; i++) {
      const offsetX = p.random(-size/2, size/2);
      const offsetY = p.random(-size/3, size/3);
      p.ellipse(x + offsetX, y + offsetY, size);
    }
    
    // Label
    p.fill(0);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text(`${label}: ${Math.round(population)}`, x, y + size/2 + 20);
  }

  // Update UI elements
  function updateUI() {
    // Update points display
    pointsDisplay.textContent = points;
    
    // Update objective display
    updateObjectiveDisplay();
    
    // Check for ranger badge
    if (points >= rangerBadgePoints && !rangerBadgeAchieved) {
      rangerBadgeAchieved = true;
      showRangerBadge();
    }
  }

  // Update objective display
  function updateObjectiveDisplay() {
    const nextObj = objectives.find(obj => !obj.achieved) || 
                    ongoingObjectives.find(obj => !obj.achieved);
    
    if (nextObj) {
      objectiveDisplay.textContent = nextObj.description;
      
      // Calculate progress percentage
      let progress = 0;
      if (nextObj.target && nextObj.target !== nextObj.points) {
        const total = nextObj.type === "balanced" ? 1500 : 800;
        progress = Math.round(((total - nextObj.target) / total) * 100);
      }
      
      // Update progress bar
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `${progress}% complete`;
    } else {
      objectiveDisplay.textContent = "All objectives completed! Try for achievements.";
      progressBar.style.width = "100%";
      progressText.textContent = "100% complete";
    }
  }

  // Show event message
  function showEventMessage(message, color) {
    disasterMessage.querySelector('.message-text').textContent = message;
    disasterMessage.style.backgroundColor = color;
    disasterMessage.style.opacity = "1";
    
    setTimeout(() => {
      disasterMessage.style.opacity = "0";
    }, 3000);
  }

  // Show narrative message
  function showNarrativeMessage(message) {
    const narrativeElement = document.createElement("div");
    narrativeElement.className = "narrative-message";
    narrativeElement.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.body.appendChild(narrativeElement);
    
    setTimeout(() => {
      narrativeElement.style.opacity = "0";
      setTimeout(() => narrativeElement.remove(), 1000);
    }, 5000);
  }

  // Show achievement
  function showAchievement(message, points) {
    const achievementElement = document.createElement("div");
    achievementElement.className = "achievement-message";
    achievementElement.innerHTML = `
      <div class="achievement-icon"><i class="fas fa-trophy"></i></div>
      <div class="achievement-content">
        <h3>Achievement Unlocked!</h3>
        <p>${message}</p>
        ${points > 0 ? `<div class="achievement-points">+${points} points</div>` : ''}
      </div>
    `;
    document.getElementById("achievementsContainer").appendChild(achievementElement);
    
    setTimeout(() => {
      achievementElement.style.opacity = "0";
      setTimeout(() => achievementElement.remove(), 1000);
    }, 3000);
  }

  // Show ranger badge
  function showRangerBadge() {
    document.getElementById("medalIcon").style.display = "flex";
    document.getElementById("rangerBadge").style.display = "flex";
    setTimeout(() => {
      document.getElementById("rangerBadge").classList.add("show");
    }, 100);
  }

  // Toggle pause state
  function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById("pauseButton");
    if (isPaused) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
      pauseBtn.classList.remove("btn-primary");
      pauseBtn.classList.add("btn-success");
      p.noLoop();
    } else {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      pauseBtn.classList.remove("btn-success");
      pauseBtn.classList.add("btn-primary");
      p.loop();
    }
  }

  // Toggle seasons display
  function toggleSeasonsDisplay() {
    showSeasons = document.getElementById("toggleSeasons").checked;
  }

  // Toggle disasters
  function toggleDisasters() {
    showDisasters = document.getElementById("toggleDisasters").checked;
  }

  // Toggle grass limit
  function toggleGrassLimit() {
    grassLimitEnabled = !grassLimitEnabled;
    const toggleBtn = document.getElementById("toggleGrassLimitButton");
    if (grassLimitEnabled) {
      toggleBtn.textContent = "Disable Grass Limit";
      toggleBtn.classList.remove("btn-danger");
      toggleBtn.classList.add("btn-secondary");
    } else {
      toggleBtn.textContent = "Enable Grass Limit";
      toggleBtn.classList.remove("btn-secondary");
      toggleBtn.classList.add("btn-danger");
    }
  }

  // Export data to CSV
  function exportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time,Grass,Pademelons,Devils,Bandicoots\n";
    
    chart.data.labels.forEach((time, i) => {
      csvContent += `${time},${chart.data.datasets[0].data[i]},${chart.data.datasets[1].data[i]},${chart.data.datasets[2].data[i]},${chart.data.datasets[3].data[i]}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecosystem_data.csv");
    link.textContent = "Download CSV";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Show quiz answer
  function showAnswer(id) {
    document.getElementById(id).style.display = 'block';
  }
};

// Initialize the simulation when page loads
window.addEventListener('DOMContentLoaded', () => {
  new p5(ecosystemSimulator);
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      const pauseBtn = document.getElementById("pauseButton");
      if (pauseBtn) pauseBtn.click();
    }
  });
});
