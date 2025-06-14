/**
 * F1 Championship Battles Dashboard
 * Main JavaScript Application
 * 
 * This dashboard provides analysis of Formula 1 championship battles
 * throughout history, showing title fights, rivalries, and key moments
 */

// Import championship descriptions
import championshipDescriptions from './descriptions.js';

// Global variables
let racesData = [];
let resultsData = [];
let driversMap = {};
let constructorsMap = {};
let driverStandingsData = [];
let constructorStandingsData = [];
let qualifyingData = [];

// State management
let currentYear = null;
let availableYears = [];
let seasonBattleData = {};

// File paths
const DATA_PATH = 'data/';
const CSV_FILES = {
    races: 'races.csv',
    results: 'results.csv',
    drivers: 'drivers.csv',
    constructors: 'constructors.csv',
    driverStandings: 'driver_standings.csv',
    constructorStandings: 'constructor_standings.csv',
    qualifying: 'qualifying.csv'
};

// Team colors mapping
const teamColors = {
    'ferrari': '#DC0000',
    'mercedes': '#00D2BE',
    'red_bull': '#1414FF',
    'mclaren': '#FF8700',
    'alpine': '#0090FF',
    'aston_martin': '#006F62',
    'williams': '#005AFF',
    'alfa': '#900000',
    'sauber': '#00E2EC',
    'haas': '#FFFFFF',
    'alphatauri': '#2B4562',
    'alpha_tauri': '#2B4562',
    'renault': '#FFF500',
    'racing_point': '#F596C8',
    'force_india': '#F596C8',
    'toro_rosso': '#469BFF',
    'lotus_f1': '#FFB800',
    'manor': '#F40000',
    'jordan': '#FFA100',
    'toyota': '#CC0000',
    'bmw_sauber': '#0054A6',
    'brawn': '#80FF00',
    'honda': '#F7F2F0',
    'bar': '#FFFFFF',
    'jaguar': '#0B4E1C',
    'stewart': '#FFFFFF',
    'minardi': '#191919',
    'arrows': '#FA9E05',
    'prost': '#0082FA',
    'benetton': '#00FF00',
    'tyrrell': '#800080',
    'ligier': '#0E4DA4',
    'brabham': '#00A74E',
    'march': '#E6002D',
    'shadow': '#000000',
    'wolf': '#B8B8B8',
    'hesketh': '#DC143C',
    'ensign': '#FF6347',
    'penske': '#FFD700',
    'copersucar': '#90EE90',
    'fittipaldi': '#FFD700',
    'lotus': '#FFB800',
    'matra': '#0032FF',
    'cooper': '#004225',
    'brm': '#005F00',
    'eagle': '#FFFFFF',
    'lola': '#FF0000'
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAllData();
        processAvailableYears();
        initializeUI();
        hideLoader();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to load data. Please refresh the page.');
    }
});

/**
 * Load all CSV data files
 */
async function loadAllData() {
    try {
        const [races, results, drivers, constructors, driverStandings, constructorStandings, qualifying] = 
            await Promise.all([
                loadCSV(CSV_FILES.races),
                loadCSV(CSV_FILES.results),
                loadCSV(CSV_FILES.drivers),
                loadCSV(CSV_FILES.constructors),
                loadCSV(CSV_FILES.driverStandings),
                loadCSV(CSV_FILES.constructorStandings),
                loadCSV(CSV_FILES.qualifying)
            ]);
        
        // Process the loaded data
        processRacesData(races);
        processResultsData(results);
        processDriversData(drivers);
        processConstructorsData(constructors);
        driverStandingsData = driverStandings;
        constructorStandingsData = constructorStandings;
        qualifyingData = qualifying;
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Load a single CSV file
 */
async function loadCSV(filename) {
    const response = await fetch(`${DATA_PATH}${filename}`);
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
    });
    
    if (parsed.errors.length > 0) {
        console.warn(`${filename} parsing warnings:`, parsed.errors);
    }
    
    return parsed.data;
}

/**
 * Process races data
 */
function processRacesData(data) {
    racesData = data.map(race => ({
        raceId: race.raceId,
        year: race.year,
        round: race.round,
        circuitId: race.circuitId,
        name: race.name,
        date: race.date
    }));
}

/**
 * Process results data
 */
function processResultsData(data) {
    resultsData = data.map(result => ({
        resultId: result.resultId,
        raceId: result.raceId,
        driverId: result.driverId,
        constructorId: result.constructorId,
        grid: result.grid,
        position: result.position,
        positionText: result.positionText,
        positionOrder: result.positionOrder,
        points: result.points,
        laps: result.laps,
        time: result.time,
        milliseconds: result.milliseconds,
        fastestLap: result.fastestLap,
        statusId: result.statusId
    }));
}

/**
 * Process drivers data
 */
function processDriversData(data) {
    data.forEach(driver => {
        driversMap[driver.driverId] = {
            id: driver.driverId,
            ref: driver.driverRef,
            number: driver.number,
            code: driver.code,
            forename: driver.forename,
            surname: driver.surname,
            fullName: `${driver.forename} ${driver.surname}`,
            dob: driver.dob,
            nationality: driver.nationality
        };
    });
}

/**
 * Process constructors data
 */
function processConstructorsData(data) {
    data.forEach(constructor => {
        constructorsMap[constructor.constructorId] = {
            id: constructor.constructorId,
            ref: constructor.constructorRef,
            name: constructor.name,
            nationality: constructor.nationality
        };
    });
}

/**
 * Process available years
 */
function processAvailableYears() {
    availableYears = [...new Set(racesData.map(race => race.year))].sort((a, b) => b - a);
}

/**
 * Initialize UI components
 */
function initializeUI() {
    setupEventListeners();
    populateYearSelector();
    
    // Set initial year to most recent
    currentYear = availableYears[0];
    updateYearDisplay();
    loadChampionshipBattle();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Year navigation
    document.getElementById('prevYearBtn').addEventListener('click', () => navigateYear(-1));
    document.getElementById('nextYearBtn').addEventListener('click', () => navigateYear(1));
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            currentYear = parseInt(e.target.value);
            updateYearDisplay();
            loadChampionshipBattle();
        }
    });
    
    // Head-to-head selectors
    document.getElementById('h2hDriver1').addEventListener('change', updateHeadToHead);
    document.getElementById('h2hDriver2').addEventListener('change', updateHeadToHead);
    
    // Mobile menu
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
}

/**
 * Populate year selector
 */
function populateYearSelector() {
    const select = document.getElementById('yearSelect');
    select.innerHTML = '';
    
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

/**
 * Navigate between years
 */
function navigateYear(direction) {
    const currentIndex = availableYears.indexOf(currentYear);
    const newIndex = currentIndex - direction; // Inverted for correct navigation
    
    if (newIndex >= 0 && newIndex < availableYears.length) {
        currentYear = availableYears[newIndex];
        updateYearDisplay();
        loadChampionshipBattle();
    }
}

/**
 * Update year display
 */
function updateYearDisplay() {
    document.getElementById('yearDisplay').textContent = currentYear;
    document.getElementById('yearSelect').value = currentYear;
    
    // Update navigation buttons
    const currentIndex = availableYears.indexOf(currentYear);
    document.getElementById('prevYearBtn').disabled = currentIndex === availableYears.length - 1;
    document.getElementById('nextYearBtn').disabled = currentIndex === 0;
}

/**
 * Load championship battle data for the selected year
 */
function loadChampionshipBattle() {
    // Get races for the year
    const yearRaces = racesData
        .filter(race => race.year === currentYear)
        .sort((a, b) => a.round - b.round);
    
    if (yearRaces.length === 0) {
        console.error('No races found for year:', currentYear);
        return;
    }
    
    // Process championship data
    const battleData = processChampionshipData(yearRaces);
    seasonBattleData = battleData;
    
    // Update UI sections
    updateChampionSection(battleData);
    updateContendersSection(battleData);
    updateBattleStatistics(battleData);
    updateChampionshipCharts(battleData);
    updateHeadToHeadSection(battleData);
    updateFinalStandings(battleData);
    
    // Show all sections
    showAllSections();
}

/**
 * Process championship data for the year
 */
function processChampionshipData(yearRaces) {
    const battleData = {
        year: currentYear,
        races: yearRaces,
        standings: {},
        progression: [],
        contenders: [],
        champion: null,
        keyMoments: []
    };
    
    // Get final standings
    const lastRace = yearRaces[yearRaces.length - 1];
    const finalStandings = driverStandingsData
        .filter(s => s.raceId === lastRace.raceId)
        .sort((a, b) => (a.position || 999) - (b.position || 999));
    
    // Process top contenders
    const topContenders = finalStandings.slice(0, 5);
    topContenders.forEach(standing => {
        const driver = driversMap[standing.driverId];
        if (!driver) return;
        
        // Get driver's main team
        const driverResults = resultsData.filter(r => 
            r.driverId === standing.driverId && 
            yearRaces.some(race => race.raceId === r.raceId)
        );
        
        const teamCounts = {};
        driverResults.forEach(r => {
            if (r.constructorId) {
                teamCounts[r.constructorId] = (teamCounts[r.constructorId] || 0) + 1;
            }
        });
        
        const mainTeamId = Object.entries(teamCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
        const team = constructorsMap[mainTeamId];
        
        // Calculate statistics
        const wins = driverResults.filter(r => r.position === 1).length;
        const podiums = driverResults.filter(r => r.position >= 1 && r.position <= 3).length;
        const dnfs = driverResults.filter(r => !r.position || r.statusId > 1).length;
        
        // Get poles - Fix for older data
        let poles = 0;
        
        // Try qualifying data first
        const qualifyingPoles = qualifyingData.filter(q => 
            q.driverId == standing.driverId &&  // Using == instead of === for type coercion
            q.position == 1 &&
            yearRaces.some(race => race.raceId == q.raceId)
        ).length;
        
        if (qualifyingPoles > 0) {
            poles = qualifyingPoles;
        } else {
            // For years before qualifying data (pre-1994), count grid position 1
            poles = driverResults.filter(r => r.grid == 1).length;
        }
        
        const contender = {
            driverId: standing.driverId,
            driver: driver,
            team: team,
            position: standing.position || 1,
            points: standing.points || 0,
            wins: wins,
            podiums: podiums,
            poles: poles,
            dnfs: dnfs
        };
        
        battleData.contenders.push(contender);
        
        if (standing.position === 1) {
            battleData.champion = contender;
        }
    });
    
    // Process championship progression
    yearRaces.forEach(race => {
        const raceStandings = driverStandingsData
            .filter(s => s.raceId === race.raceId)
            .sort((a, b) => (a.position || 999) - (b.position || 999));
        
        const raceProgression = {
            raceId: race.raceId,
            round: race.round,
            raceName: race.name,
            standings: {}
        };
        
        raceStandings.forEach(standing => {
            if (topContenders.some(c => c.driverId === standing.driverId)) {
                raceProgression.standings[standing.driverId] = {
                    position: standing.position || 0,
                    points: standing.points || 0
                };
            }
        });
        
        battleData.progression.push(raceProgression);
    });
    
    // Identify key moments
    battleData.keyMoments = identifyKeyMoments(battleData);
    
    return battleData;
}

/**
 * Identify key championship moments
 */
function identifyKeyMoments(battleData) {
    const moments = [];
    const progression = battleData.progression;
    
    // Track lead changes
    let previousLeader = null;
    progression.forEach((race, index) => {
        const standings = Object.entries(race.standings)
            .sort((a, b) => a[1].position - b[1].position);
        
        if (standings.length > 0) {
            const currentLeader = standings[0][0];
            
            if (previousLeader && currentLeader !== previousLeader) {
                const driver = driversMap[currentLeader];
                moments.push({
                    round: race.round,
                    raceName: race.raceName,
                    description: `${driver.fullName} takes the championship lead`
                });
            }
            
            previousLeader = currentLeader;
        }
    });
    
    // Title decided moment
    const champion = battleData.champion;
    if (champion && progression.length > 0) {
        // Find when title was mathematically secured
        for (let i = progression.length - 1; i >= 0; i--) {
            const race = progression[i];
            const remainingRaces = progression.length - i - 1;
            const maxPointsPerRace = 25; // Modern points system approximation
            
            const leaderPoints = race.standings[champion.driverId]?.points || 0;
            let canBeCaught = false;
            
            Object.entries(race.standings).forEach(([driverId, standing]) => {
                if (driverId !== champion.driverId) {
                    const maxPossiblePoints = standing.points + (remainingRaces * maxPointsPerRace);
                    if (maxPossiblePoints >= leaderPoints) {
                        canBeCaught = true;
                    }
                }
            });
            
            if (!canBeCaught && i < progression.length - 1) {
                moments.push({
                    round: race.round,
                    raceName: race.raceName,
                    description: `${champion.driver.fullName} clinches the World Championship`
                });
                break;
            }
        }
    }
    
    return moments.sort((a, b) => a.round - b.round);
}

/**
 * Update champion section
 */
function updateChampionSection(battleData) {
    const champion = battleData.champion;
    
    if (champion) {
        document.getElementById('championName').textContent = champion.driver.fullName;
        document.getElementById('championTeam').textContent = champion.team?.name || 'Unknown';
        document.getElementById('championWins').textContent = champion.wins;
        document.getElementById('championPodiums').textContent = champion.podiums;
        document.getElementById('championPoles').textContent = champion.poles;
        document.getElementById('championPoints').textContent = champion.points;
    }
    
    // Update season description
    const description = championshipDescriptions[currentYear] || 
        'No detailed description available for this season.';
    document.getElementById('seasonDescription').textContent = description;
}

/**
 * Update contenders section
 */
function updateContendersSection(battleData) {
    const grid = document.getElementById('contendersGrid');
    grid.innerHTML = '';
    
    // Show top 3 contenders
    battleData.contenders.slice(0, 3).forEach(contender => {
        const card = createContenderCard(contender);
        grid.appendChild(card);
    });
}

/**
 * Create contender card element
 */
function createContenderCard(contender) {
    const card = document.createElement('div');
    card.className = `contender-card position-${contender.position}`;
    
    const teamColor = contender.team ? getTeamColor(contender.team.ref) : '#808080';
    
    card.innerHTML = `
        <div class="contender-position">#${contender.position}</div>
        <h3 class="contender-name" style="color: ${teamColor}">${contender.driver.fullName}</h3>
        <p class="contender-team">${contender.team?.name || 'Unknown'}</p>
        <div class="contender-stats">
            <div class="contender-stat">
                <span class="contender-stat-value">${contender.wins}</span>
                <span class="contender-stat-label">Wins</span>
            </div>
            <div class="contender-stat">
                <span class="contender-stat-value">${contender.podiums}</span>
                <span class="contender-stat-label">Podiums</span>
            </div>
            <div class="contender-stat">
                <span class="contender-stat-value">${contender.poles}</span>
                <span class="contender-stat-label">Poles</span>
            </div>
            <div class="contender-stat">
                <span class="contender-stat-value">${contender.points}</span>
                <span class="contender-stat-label">Points</span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Update battle statistics
 */
function updateBattleStatistics(battleData) {
    const progression = battleData.progression;
    const contenders = battleData.contenders;
    
    if (progression.length === 0 || contenders.length < 2) return;
    
    // Calculate when title was decided
    let titleDecidedRound = progression.length;
    const champion = battleData.champion;
    
    if (champion) {
        for (let i = progression.length - 1; i >= 0; i--) {
            const race = progression[i];
            const remainingRaces = progression.length - i - 1;
            const maxPointsPerRace = 25;
            
            const leaderPoints = race.standings[champion.driverId]?.points || 0;
            let canBeCaught = false;
            
            Object.entries(race.standings).forEach(([driverId, standing]) => {
                if (driverId !== champion.driverId) {
                    const maxPossiblePoints = standing.points + (remainingRaces * maxPointsPerRace);
                    if (maxPossiblePoints >= leaderPoints) {
                        canBeCaught = true;
                    }
                }
            });
            
            if (!canBeCaught) {
                titleDecidedRound = race.round;
                break;
            }
        }
    }
    
    // Calculate final margin
    const finalMargin = contenders.length >= 2 ? 
        contenders[0].points - contenders[1].points : 0;
    
    // Calculate lead changes
    let leadChanges = 0;
    let previousLeader = null;
    
    progression.forEach(race => {
        const standings = Object.entries(race.standings)
            .sort((a, b) => a[1].position - b[1].position);
        
        if (standings.length > 0) {
            const currentLeader = standings[0][0];
            if (previousLeader && currentLeader !== previousLeader) {
                leadChanges++;
            }
            previousLeader = currentLeader;
        }
    });
    
    // Calculate closest gap
    let closestGap = finalMargin;
    progression.forEach(race => {
        const standings = Object.values(race.standings)
            .sort((a, b) => a.position - b.position);
        
        if (standings.length >= 2) {
            const gap = Math.abs(standings[0].points - standings[1].points);
            if (gap < closestGap) {
                closestGap = gap;
            }
        }
    });
    
    // Update UI
    document.getElementById('titleDecidedRace').textContent = `Round ${titleDecidedRound}`;
    document.getElementById('titleDecidedLabel').textContent = 
        `of ${progression.length} races`;
    document.getElementById('finalMargin').textContent = finalMargin;
    document.getElementById('leadChanges').textContent = leadChanges;
    document.getElementById('closestGap').textContent = closestGap;
}

/**
 * Update championship charts
 */
function updateChampionshipCharts(battleData) {
    // Ensure charts are properly sized on creation
    setTimeout(() => {
        createPointsEvolutionChart(battleData);
        createPointsGapChart(battleData);
        createPositionChart(battleData);
        
        // Force resize to ensure full width
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

/**
 * Create points evolution chart
 */
function createPointsEvolutionChart(battleData) {
    const traces = [];
    const contenders = battleData.contenders.slice(0, 5);
    
    contenders.forEach(contender => {
        const points = battleData.progression.map(race => 
            race.standings[contender.driverId]?.points || 0
        );
        
        const raceNames = battleData.progression.map(race => 
            `R${race.round}: ${race.raceName.replace('Grand Prix', 'GP')}`
        );
        
        const teamColor = contender.team ? getTeamColor(contender.team.ref) : '#808080';
        
        traces.push({
            x: raceNames,
            y: points,
            type: 'scatter',
            mode: 'lines+markers',
            name: contender.driver.surname,
            line: {
                width: contender.position === 1 ? 4 : 2,
                color: teamColor
            },
            marker: {
                size: 8,
                color: teamColor
            }
        });
    });
    
    const layout = {
        title: {
            text: 'Championship Points Evolution',
            font: {
                family: 'Russo One, sans-serif',
                size: 20,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Race',
            tickfont: { color: '#b8b8b8', size: 10 },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Points',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        },
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        },
        margin: {
            l: 60,
            r: 60,
            t: 80,
            b: 120
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('pointsEvolutionChart', traces, layout, config);
}

/**
 * Create points gap chart
 */
function createPointsGapChart(battleData) {
    if (battleData.contenders.length < 2) return;
    
    const leader = battleData.contenders[0];
    const traces = [];
    
    // Create traces for gap to leader
    battleData.contenders.slice(1, 4).forEach(contender => {
        const gaps = battleData.progression.map(race => {
            const leaderPoints = race.standings[leader.driverId]?.points || 0;
            const contenderPoints = race.standings[contender.driverId]?.points || 0;
            return leaderPoints - contenderPoints;
        });
        
        const raceNames = battleData.progression.map(race => 
            `R${race.round}: ${race.raceName.replace('Grand Prix', 'GP')}`
        );
        
        const teamColor = contender.team ? getTeamColor(contender.team.ref) : '#808080';
        
        traces.push({
            x: raceNames,
            y: gaps,
            type: 'scatter',
            mode: 'lines+markers',
            name: `Gap to ${contender.driver.surname}`,
            line: {
                width: 2,
                color: teamColor
            },
            marker: {
                size: 6,
                color: teamColor
            }
        });
    });
    
    const layout = {
        title: {
            text: `Points Gap from ${leader.driver.surname}`,
            font: {
                family: 'Russo One, sans-serif',
                size: 18,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Race',
            tickfont: { color: '#b8b8b8', size: 10 },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Points Gap',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zeroline: true,
            zerolinecolor: '#ff1801',
            zerolinewidth: 2
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        },
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        },
        margin: {
            l: 60,
            r: 60,
            t: 80,
            b: 120
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('pointsGapChart', traces, layout, config);
}

/**
 * Create position chart
 */
function createPositionChart(battleData) {
    const traces = [];
    const contenders = battleData.contenders.slice(0, 5);
    
    contenders.forEach(contender => {
        const positions = battleData.progression.map(race => 
            race.standings[contender.driverId]?.position || 20
        );
        
        const raceNames = battleData.progression.map(race => 
            `R${race.round}: ${race.raceName.replace('Grand Prix', 'GP')}`
        );
        
        const teamColor = contender.team ? getTeamColor(contender.team.ref) : '#808080';
        
        traces.push({
            x: raceNames,
            y: positions,
            type: 'scatter',
            mode: 'lines+markers',
            name: contender.driver.surname,
            line: {
                width: contender.position === 1 ? 4 : 2,
                color: teamColor
            },
            marker: {
                size: 8,
                color: teamColor
            }
        });
    });
    
    const layout = {
        title: {
            text: 'Championship Position Changes',
            font: {
                family: 'Russo One, sans-serif',
                size: 18,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Race',
            tickfont: { color: '#b8b8b8', size: 10 },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Position',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            autorange: 'reversed',
            dtick: 1
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        },
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        },
        margin: {
            l: 60,
            r: 60,
            t: 80,
            b: 120
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('positionChart', traces, layout, config);
}

/**
 * Update head-to-head section
 */
function updateHeadToHeadSection(battleData) {
    const select1 = document.getElementById('h2hDriver1');
    const select2 = document.getElementById('h2hDriver2');
    
    // Clear and populate dropdowns
    select1.innerHTML = '<option value="">Select Driver 1</option>';
    select2.innerHTML = '<option value="">Select Driver 2</option>';
    
    battleData.contenders.slice(0, 10).forEach(contender => {
        const option1 = document.createElement('option');
        option1.value = contender.driverId;
        option1.textContent = contender.driver.fullName;
        select1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = contender.driverId;
        option2.textContent = contender.driver.fullName;
        select2.appendChild(option2);
    });
    
    // Auto-select top 2 if available
    if (battleData.contenders.length >= 2) {
        select1.value = battleData.contenders[0].driverId;
        select2.value = battleData.contenders[1].driverId;
        updateHeadToHead();
    }
}

/**
 * Update head-to-head comparison
 */
function updateHeadToHead() {
    const driver1Id = parseInt(document.getElementById('h2hDriver1').value);
    const driver2Id = parseInt(document.getElementById('h2hDriver2').value);
    
    if (!driver1Id || !driver2Id || driver1Id === driver2Id) {
        document.getElementById('h2hStats').style.display = 'none';
        return;
    }
    
    const yearRaces = seasonBattleData.races;
    const driver1 = driversMap[driver1Id];
    const driver2 = driversMap[driver2Id];
    
    // Get results for both drivers
    const driver1Results = resultsData.filter(r => 
        r.driverId === driver1Id && 
        yearRaces.some(race => race.raceId === r.raceId)
    );
    
    const driver2Results = resultsData.filter(r => 
        r.driverId === driver2Id && 
        yearRaces.some(race => race.raceId === r.raceId)
    );
    
    // Calculate statistics
    const stats1 = calculateDriverStats(driver1Id, driver1Results, yearRaces);
    const stats2 = calculateDriverStats(driver2Id, driver2Results, yearRaces);
    
    // Head-to-head specific stats
    let h2hWins1 = 0, h2hWins2 = 0;
    let h2hQuali1 = 0, h2hQuali2 = 0;
    let h2hFinishes1 = 0, h2hFinishes2 = 0;
    
    yearRaces.forEach(race => {
        const result1 = driver1Results.find(r => r.raceId === race.raceId);
        const result2 = driver2Results.find(r => r.raceId === race.raceId);
        
        if (result1 && result2) {
            // Race finishes
            if (result1.position && result2.position) {
                if (result1.position < result2.position) h2hFinishes1++;
                else if (result2.position < result1.position) h2hFinishes2++;
            } else if (result1.position && !result2.position) {
                h2hFinishes1++;
            } else if (!result1.position && result2.position) {
                h2hFinishes2++;
            }
            
            // Qualifying
            const quali1 = qualifyingData.find(q => q.raceId == race.raceId && q.driverId == driver1Id);
            const quali2 = qualifyingData.find(q => q.raceId == race.raceId && q.driverId == driver2Id);
            
            if (quali1 && quali2) {
                if (quali1.position < quali2.position) h2hQuali1++;
                else if (quali2.position < quali1.position) h2hQuali2++;
            } else if (result1 && result2) {
                // For older years, use grid positions
                if (result1.grid && result2.grid) {
                    if (result1.grid < result2.grid) h2hQuali1++;
                    else if (result2.grid < result1.grid) h2hQuali2++;
                }
            }
        }
        
        // Count race wins
        if (result1?.position === 1) h2hWins1++;
        if (result2?.position === 1) h2hWins2++;
    });
    
    // Update UI
    document.getElementById('h2hDriver1Name').textContent = driver1.fullName;
    document.getElementById('h2hDriver2Name').textContent = driver2.fullName;
    
    document.getElementById('h2h1Wins').textContent = stats1.wins;
    document.getElementById('h2h1Podiums').textContent = stats1.podiums;
    document.getElementById('h2h1Poles').textContent = stats1.poles;
    document.getElementById('h2h1Points').textContent = stats1.points;
    
    document.getElementById('h2h2Wins').textContent = stats2.wins;
    document.getElementById('h2h2Podiums').textContent = stats2.podiums;
    document.getElementById('h2h2Poles').textContent = stats2.poles;
    document.getElementById('h2h2Points').textContent = stats2.points;
    
    // Update comparison bars
    updateComparisonBar('Wins', h2hWins1, h2hWins2);
    updateComparisonBar('Quali', h2hQuali1, h2hQuali2);
    updateComparisonBar('Finishes', h2hFinishes1, h2hFinishes2);
    
    document.getElementById('h2hStats').style.display = 'grid';
}

/**
 * Calculate driver statistics
 */
function calculateDriverStats(driverId, driverResults, yearRaces) {
    const wins = driverResults.filter(r => r.position == 1).length;
    const podiums = driverResults.filter(r => r.position >= 1 && r.position <= 3).length;
    
    // Fix pole position calculation
    let poles = 0;
    
    // Try qualifying data first
    const qualifyingPoles = qualifyingData.filter(q => 
        q.driverId == driverId &&  // Using == for type coercion
        q.position == 1 &&
        yearRaces.some(race => race.raceId == q.raceId)
    ).length;
    
    if (qualifyingPoles > 0) {
        poles = qualifyingPoles;
    } else {
        // For older years, count grid position 1
        poles = driverResults.filter(r => r.grid == 1).length;
    }
    
    const lastRace = yearRaces[yearRaces.length - 1];
    const finalStanding = driverStandingsData.find(s => 
        s.raceId == lastRace.raceId && s.driverId == driverId
    );
    
    return {
        wins: wins,
        podiums: podiums,
        poles: poles,
        points: finalStanding?.points || 0
    };
}

/**
 * Update comparison bar
 */
function updateComparisonBar(type, value1, value2) {
    const total = value1 + value2;
    const percentage1 = total > 0 ? (value1 / total) * 100 : 50;
    const percentage2 = total > 0 ? (value2 / total) * 100 : 50;
    
    const bar1 = document.getElementById(`h2hBar1${type}`);
    const bar2 = document.getElementById(`h2hBar2${type}`);
    
    bar1.style.width = `${percentage1}%`;
    bar2.style.width = `${percentage2}%`;
    
    bar1.textContent = value1 > 0 ? value1 : '';
    bar2.textContent = value2 > 0 ? value2 : '';
}

/**
 * Update final standings tables
 */
function updateFinalStandings(battleData) {
    const yearRaces = battleData.races;
    const lastRace = yearRaces[yearRaces.length - 1];
    
    if (!lastRace) return;
    
    // Update drivers standings (Top 10)
    const finalDriverStandings = driverStandingsData
        .filter(s => s.raceId === lastRace.raceId)
        .sort((a, b) => (a.position || 999) - (b.position || 999))
        .slice(0, 10);
    
    const driversBody = document.getElementById('driversStandingsBody');
    driversBody.innerHTML = '';
    
    if (finalDriverStandings.length > 0) {
        finalDriverStandings.forEach((standing, index) => {
            const driver = driversMap[standing.driverId];
            if (!driver) return;
            
            // Get driver's team and stats
            const driverResults = resultsData.filter(r => 
                r.driverId === standing.driverId && 
                yearRaces.some(race => race.raceId === r.raceId)
            );
            
            // Get most common constructor
            const constructorCounts = {};
            driverResults.forEach(r => {
                if (r.constructorId) {
                    constructorCounts[r.constructorId] = (constructorCounts[r.constructorId] || 0) + 1;
                }
            });
            
            let teamName = 'N/A';
            let teamColor = '#808080';
            if (Object.keys(constructorCounts).length > 0) {
                const mainConstructorId = Object.entries(constructorCounts)
                    .sort((a, b) => b[1] - a[1])[0][0];
                const constructor = constructorsMap[mainConstructorId];
                teamName = constructor ? constructor.name : 'N/A';
                teamColor = constructor ? getTeamColor(constructor.ref) : '#808080';
            }
            
            // Count wins
            const wins = driverResults.filter(r => r.position === 1).length;
            
            const tr = document.createElement('tr');
            const positionClass = index === 0 ? 'position-1' : 
                                index === 1 ? 'position-2' : 
                                index === 2 ? 'position-3' : '';
            
            tr.innerHTML = `
                <td class="${positionClass}">${standing.position || index + 1}</td>
                <td>${driver.fullName}</td>
                <td style="color: ${teamColor}">${teamName}</td>
                <td>${standing.points || 0}</td>
                <td>${wins}</td>
            `;
            
            driversBody.appendChild(tr);
        });
    } else {
        driversBody.innerHTML = '<tr><td colspan="5" class="no-data">No data available</td></tr>';
    }
    
    // Update constructors standings
    const finalConstructorStandings = constructorStandingsData
        .filter(s => s.raceId == lastRace.raceId)
        .sort((a, b) => (a.position || 999) - (b.position || 999));
    
    const constructorsBody = document.getElementById('constructorsStandingsBody');
    constructorsBody.innerHTML = '';
    
    // Check if we have official standings data
    if (finalConstructorStandings.length > 0 && currentYear !== 2007) {
        // Use official standings
        finalConstructorStandings.slice(0, 5).forEach((standing, index) => {
            const constructor = constructorsMap[standing.constructorId];
            if (!constructor) return;
            
            // Count wins for this constructor
            const wins = resultsData.filter(r => 
                r.constructorId == standing.constructorId &&
                r.position == 1 &&
                yearRaces.some(race => race.raceId == r.raceId)
            ).length;
            
            const teamColor = getTeamColor(constructor.ref);
            const tr = document.createElement('tr');
            const positionClass = index === 0 ? 'position-1' : 
                                index === 1 ? 'position-2' : 
                                index === 2 ? 'position-3' : '';
            
            tr.innerHTML = `
                <td class="${positionClass}">${standing.position || index + 1}</td>
                <td style="color: ${teamColor}">${constructor.name}</td>
                <td>${standing.points || 0}</td>
                <td>${wins}</td>
            `;
            
            constructorsBody.appendChild(tr);
        });
    } else {
        // Manual calculation for years without official data or 2007
        const constructorPoints = {};
        const constructorWins = {};
        
        // Sum up points for each constructor
        yearRaces.forEach(race => {
            const raceResults = resultsData.filter(r => r.raceId == race.raceId);
            
            raceResults.forEach(result => {
                if (result.constructorId && result.points > 0) {
                    constructorPoints[result.constructorId] = 
                        (constructorPoints[result.constructorId] || 0) + result.points;
                }
                
                if (result.constructorId && result.position == 1) {
                    constructorWins[result.constructorId] = 
                        (constructorWins[result.constructorId] || 0) + 1;
                }
            });
        });
        
        // Special handling for 2007 - McLaren disqualification
        if (currentYear === 2007) {
            // Find McLaren's constructorId
            const mclaren = Object.values(constructorsMap).find(c => 
                c.name.toLowerCase().includes('mclaren')
            );
            
            if (mclaren) {
                // Remove McLaren's constructor points
                delete constructorPoints[mclaren.id];
            }
        }
        
        // Convert to array and sort
        const constructorStandings = Object.entries(constructorPoints)
            .map(([constructorId, points]) => ({
                constructorId: parseInt(constructorId),
                points: points,
                wins: constructorWins[constructorId] || 0
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
        
        constructorStandings.forEach((standing, index) => {
            const constructor = constructorsMap[standing.constructorId];
            if (!constructor) return;
            
            const teamColor = getTeamColor(constructor.ref);
            const tr = document.createElement('tr');
            const positionClass = index === 0 ? 'position-1' : 
                                index === 1 ? 'position-2' : 
                                index === 2 ? 'position-3' : '';
            
            tr.innerHTML = `
                <td class="${positionClass}">${index + 1}</td>
                <td style="color: ${teamColor}">${constructor.name}</td>
                <td>${standing.points}</td>
                <td>${standing.wins}</td>
            `;
            
            constructorsBody.appendChild(tr);
        });
    }
    
    // Add note for 2007
    if (currentYear === 2007) {
        const noteRow = document.createElement('tr');
        noteRow.innerHTML = `
            <td colspan="4" style="text-align: center; font-style: italic; color: var(--text-secondary); padding-top: 1rem;">
                McLaren was excluded from the Constructors' Championship
            </td>
        `;
        constructorsBody.appendChild(noteRow);
    }
}

/**
 * Get team color
 */
function getTeamColor(constructorRef) {
    if (!constructorRef) return '#808080';
    const ref = constructorRef.toLowerCase();
    return teamColors[ref] || '#808080';
}

/**
 * Show all sections
 */
function showAllSections() {
    document.getElementById('championSection').style.display = 'block';
    document.getElementById('contendersSection').style.display = 'block';
    document.getElementById('battleStatsSection').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';
    document.getElementById('headToHeadSection').style.display = 'block';
    document.getElementById('finalStandingsSection').style.display = 'block';
}

/**
 * Hide loader
 */
function hideLoader() {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 500);
}

/**
 * Show error message
 */
function showError(message) {
    console.error(message);
    alert(message);
}

/**
 * Handle window resize
 */
window.addEventListener('resize', () => {
    if (window.Plotly) {
        Plotly.Plots.resize('pointsEvolutionChart');
        Plotly.Plots.resize('pointsGapChart');
        Plotly.Plots.resize('positionChart');
    }
});