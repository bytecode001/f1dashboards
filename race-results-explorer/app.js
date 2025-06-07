/**
 * F1 Race Results Explorer - Year-Centric Approach
 * Main JavaScript Application
 * 
 * This application provides a year-based exploration of Formula 1 race results
 * with intuitive navigation and comprehensive data visualization
 */

// Global variables
let racesData = [];              // All races data
let resultsData = [];            // All results data
let driversMap = {};             // Map of driverId -> driver info
let constructorsMap = {};        // Map of constructorId -> constructor info
let circuitsMap = {};            // Map of circuitId -> circuit info
let statusMap = {};              // Map of statusId -> status info
let driverStandingsData = [];    // Driver standings data
let constructorStandingsData = [];// Constructor standings data
let qualifyingData = [];         // Qualifying data

// State management
let currentYear = null;
let currentRaceId = null;
let availableYears = [];
let seasonData = {};             // Organized data by year
let championshipProgress = {};   // Championship progression data

// File paths
const DATA_PATH = 'data/';
const CSV_FILES = {
    races: 'races.csv',
    results: 'results.csv',
    drivers: 'drivers.csv',
    constructors: 'constructors.csv',
    circuits: 'circuits.csv',
    status: 'status.csv',
    driverStandings: 'driver_standings.csv',
    constructorStandings: 'constructor_standings.csv',
    qualifying: 'qualifying.csv'
};

// Team colors (official hex codes)
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
    'lola': '#FF0000',
    'footwork': '#FA0537',
    'simtek': '#862992',
    'pacific': '#02AEC9',
    'forti': '#FBE801',
    'virgin': '#CC0000',
    'marussia': '#6E0000',
    'caterham': '#005030',
    'hrt': '#B2945F',
    'spyker': '#FF8800',
    'super_aguri': '#F40000',
    'midland': '#FF0000'
};

// Country flags mapping
const countryFlags = {
    'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿', 'Bahrain': '🇧🇭',
    'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'China': '🇨🇳',
    'France': '🇫🇷', 'Germany': '🇩🇪', 'Hungary': '🇭🇺', 'India': '🇮🇳',
    'Italy': '🇮🇹', 'Japan': '🇯🇵', 'Korea': '🇰🇷', 'Malaysia': '🇲🇾',
    'Mexico': '🇲🇽', 'Monaco': '🇲🇨', 'Netherlands': '🇳🇱', 'Portugal': '🇵🇹',
    'Russia': '🇷🇺', 'Saudi Arabia': '🇸🇦', 'Singapore': '🇸🇬', 'Spain': '🇪🇸',
    'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Turkey': '🇹🇷', 'UAE': '🇦🇪',
    'UK': '🇬🇧', 'USA': '🇺🇸', 'South Africa': '🇿🇦', 'Argentina': '🇦🇷',
    'Qatar': '🇶🇦', 'Vietnam': '🇻🇳', 'Las Vegas': '🇺🇸', 'Miami': '🇺🇸'
};

// Known driver champions (fallback data)
const driverChampions = {
    2024: { name: 'Max Verstappen', team: 'Red Bull' },
    2023: { name: 'Max Verstappen', team: 'Red Bull' },
    2022: { name: 'Max Verstappen', team: 'Red Bull' },
    2021: { name: 'Max Verstappen', team: 'Red Bull' },
    2020: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2019: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2018: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2017: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2016: { name: 'Nico Rosberg', team: 'Mercedes' },
    2015: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2014: { name: 'Lewis Hamilton', team: 'Mercedes' },
    2013: { name: 'Sebastian Vettel', team: 'Red Bull' },
    2012: { name: 'Sebastian Vettel', team: 'Red Bull' },
    2011: { name: 'Sebastian Vettel', team: 'Red Bull' },
    2010: { name: 'Sebastian Vettel', team: 'Red Bull' }
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing F1 Race Results Explorer...');
    
    try {
        await loadAllData();
        processSeasonData();
        analyzeDataCompleteness(); // Add data analysis
        initializeUI();
        hideLoader();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to load data. Please refresh the page.');
    }
});

/**
 * Analyze data completeness for debugging
 */
function analyzeDataCompleteness() {
    console.log('=== DATA COMPLETENESS ANALYSIS ===');
    
    // Analyze fastest lap data
    let racesWithRank1 = 0;
    let racesWithAnyRank = 0;
    let racesWithFastestLapTime = 0;
    let racesWithValidFastestLap = 0;
    
    racesData.forEach(race => {
        const raceResults = resultsData.filter(r => r.raceId === race.raceId);
        const hasRank1 = raceResults.some(r => r.rank === 1);
        const hasAnyRank = raceResults.some(r => r.rank && r.rank > 0);
        const hasFastestLapTime = raceResults.some(r => r.fastestLapTime && r.fastestLapTime !== '' && r.fastestLapTime !== '\\N');
        const hasValidFastestLap = raceResults.some(r => 
            (r.rank === 1 || r.fastestLap === 1) && 
            r.fastestLapTime && 
            r.fastestLapTime !== '' && 
            r.fastestLapTime !== '\\N'
        );
        
        if (hasRank1) racesWithRank1++;
        if (hasAnyRank) racesWithAnyRank++;
        if (hasFastestLapTime) racesWithFastestLapTime++;
        if (hasValidFastestLap) racesWithValidFastestLap++;
    });
    
    console.log(`Fastest Lap Data Analysis:`);
    console.log(`- Races with rank=1: ${racesWithRank1} / ${racesData.length} (${(racesWithRank1/racesData.length*100).toFixed(1)}%)`);
    console.log(`- Races with any rank: ${racesWithAnyRank} / ${racesData.length} (${(racesWithAnyRank/racesData.length*100).toFixed(1)}%)`);
    console.log(`- Races with fastestLapTime field: ${racesWithFastestLapTime} / ${racesData.length} (${(racesWithFastestLapTime/racesData.length*100).toFixed(1)}%)`);
    console.log(`- Races with valid fastest lap data: ${racesWithValidFastestLap} / ${racesData.length} (${(racesWithValidFastestLap/racesData.length*100).toFixed(1)}%)`);
    
    // Sample some races to see the data structure
    console.log('\nSample of fastestLap data structure:');
    const sampleRaces = racesData.slice(0, 5);
    sampleRaces.forEach(race => {
        const raceResults = resultsData.filter(r => r.raceId === race.raceId);
        const fastestLapData = raceResults
            .filter(r => r.fastestLapTime && r.fastestLapTime !== '' && r.fastestLapTime !== '\\N')
            .map(r => ({
                driver: driversMap[r.driverId]?.surname || 'Unknown',
                time: r.fastestLapTime,
                rank: r.rank,
                fastestLap: r.fastestLap
            }));
        if (fastestLapData.length > 0) {
            console.log(`Race ${race.raceId} (${race.year}): ${JSON.stringify(fastestLapData[0])}`);
        }
    });
    
    // Analyze qualifying data
    const raceIdsWithQualifying = new Set(qualifyingData.map(q => q.raceId));
    console.log(`\nQualifying Data:`);
    console.log(`- Races with qualifying data: ${raceIdsWithQualifying.size} / ${racesData.length} (${(raceIdsWithQualifying.size/racesData.length*100).toFixed(1)}%)`);
    
    // Find the earliest year with qualifying data
    let earliestQualifyingYear = 9999;
    qualifyingData.forEach(q => {
        const race = racesData.find(r => r.raceId === q.raceId);
        if (race && race.year < earliestQualifyingYear) {
            earliestQualifyingYear = race.year;
        }
    });
    console.log(`- Earliest year with qualifying data: ${earliestQualifyingYear}`);
    
    // Analyze by year ranges
    console.log('\nData availability by decade:');
    const decades = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950];
    decades.forEach(decade => {
        const decadeRaces = racesData.filter(r => r.year >= decade && r.year < decade + 10);
        if (decadeRaces.length === 0) return;
        
        const withValidFastestLap = decadeRaces.filter(race => {
            const raceResults = resultsData.filter(r => r.raceId === race.raceId);
            return raceResults.some(r => 
                (r.rank === 1 || r.fastestLap === 1) && 
                r.fastestLapTime && 
                r.fastestLapTime !== '' && 
                r.fastestLapTime !== '\\N'
            );
        }).length;
        
        const withQualifying = decadeRaces.filter(race => 
            qualifyingData.some(q => q.raceId === race.raceId)
        ).length;
        
        console.log(`${decade}s: ${decadeRaces.length} races - ${withValidFastestLap} with valid fastest lap (${(withValidFastestLap/decadeRaces.length*100).toFixed(0)}%), ${withQualifying} with qualifying (${(withQualifying/decadeRaces.length*100).toFixed(0)}%)`);
    });
    
    console.log('=== END OF ANALYSIS ===');
}

/**
 * Load all CSV data files
 */
async function loadAllData() {
    console.log('Loading CSV data files...');
    
    try {
        const [races, results, drivers, constructors, circuits, status, driverStandings, constructorStandings, qualifying] = 
            await Promise.all([
                loadCSV(CSV_FILES.races),
                loadCSV(CSV_FILES.results),
                loadCSV(CSV_FILES.drivers),
                loadCSV(CSV_FILES.constructors),
                loadCSV(CSV_FILES.circuits),
                loadCSV(CSV_FILES.status),
                loadCSV(CSV_FILES.driverStandings),
                loadCSV(CSV_FILES.constructorStandings),
                loadCSV(CSV_FILES.qualifying)
            ]);
        
        // Process the loaded data
        processRacesData(races);
        processResultsData(results);
        processDriversData(drivers);
        processConstructorsData(constructors);
        processCircuitsData(circuits);
        processStatusData(status);
        driverStandingsData = driverStandings;
        constructorStandingsData = constructorStandings;
        qualifyingData = qualifying;
        
        console.log(`Loaded data: ${racesData.length} races, ${resultsData.length} results`);
        
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
        date: race.date,
        time: race.time,
        url: race.url
    }));
    
    // Extract available years
    availableYears = [...new Set(racesData.map(race => race.year))].sort((a, b) => b - a);
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
        number: result.number,
        grid: result.grid,
        position: result.position,
        positionText: result.positionText,
        positionOrder: result.positionOrder,
        points: result.points,
        laps: result.laps,
        time: result.time,
        milliseconds: result.milliseconds,
        fastestLap: result.fastestLap,
        rank: result.rank,
        fastestLapTime: result.fastestLapTime,
        fastestLapSpeed: result.fastestLapSpeed,
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
            nationality: driver.nationality,
            url: driver.url
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
            nationality: constructor.nationality,
            url: constructor.url
        };
    });
}

/**
 * Process circuits data
 */
function processCircuitsData(data) {
    data.forEach(circuit => {
        circuitsMap[circuit.circuitId] = {
            id: circuit.circuitId,
            ref: circuit.circuitRef,
            name: circuit.name,
            location: circuit.location,
            country: circuit.country,
            lat: circuit.lat,
            lng: circuit.lng,
            alt: circuit.alt,
            url: circuit.url
        };
    });
}

/**
 * Process status data
 */
function processStatusData(data) {
    data.forEach(status => {
        statusMap[status.statusId] = status.status;
    });
}

/**
 * Process and organize data by season
 */
function processSeasonData() {
    availableYears.forEach(year => {
        const yearRaces = racesData.filter(race => race.year === year);
        const yearRaceIds = yearRaces.map(race => race.raceId);
        const yearResults = resultsData.filter(result => yearRaceIds.includes(result.raceId));
        
        // Calculate season statistics
        const winners = new Set();
        const constructorWinners = new Set();
        let totalDNFs = 0;
        
        yearResults.forEach(result => {
            if (result.position === 1) {
                winners.add(result.driverId);
                constructorWinners.add(result.constructorId);
            }
            if (!result.position || result.position === null) {
                totalDNFs++;
            }
        });
        
        // Get champions from standings data
        const lastRace = yearRaces[yearRaces.length - 1];
        let driverChampion = null;
        let constructorChampion = null;
        
        if (lastRace) {
            // Get driver champion
            const finalDriverStandings = driverStandingsData
                .filter(standing => standing.raceId === lastRace.raceId)
                .sort((a, b) => a.position - b.position);
            
            if (finalDriverStandings.length > 0) {
                const championDriverId = finalDriverStandings[0].driverId;
                const driver = driversMap[championDriverId];
                if (driver) {
                    // Find the constructor for the champion
                    const championResults = yearResults.filter(r => r.driverId === championDriverId);
                    const constructorCounts = {};
                    championResults.forEach(r => {
                        constructorCounts[r.constructorId] = (constructorCounts[r.constructorId] || 0) + 1;
                    });
                    const mainConstructorId = Object.entries(constructorCounts)
                        .sort((a, b) => b[1] - a[1])[0]?.[0];
                    const constructor = constructorsMap[mainConstructorId];
                    
                    driverChampion = {
                        name: driver.fullName,
                        team: constructor ? constructor.name : 'Unknown'
                    };
                }
            }
            
            // Get constructor champion
            const finalConstructorStandings = constructorStandingsData
                .filter(standing => standing.raceId === lastRace.raceId)
                .sort((a, b) => a.position - b.position);
            
            if (finalConstructorStandings.length > 0) {
                const championConstructorId = finalConstructorStandings[0].constructorId;
                const constructor = constructorsMap[championConstructorId];
                if (constructor) {
                    constructorChampion = constructor.name;
                }
            }
        }
        
        // Use fallback data if needed
        if (!driverChampion && driverChampions[year]) {
            driverChampion = driverChampions[year];
        }
        
        seasonData[year] = {
            races: yearRaces,
            results: yearResults,
            totalRaces: yearRaces.length,
            differentWinners: winners.size,
            differentConstructorWinners: constructorWinners.size,
            totalDNFs: totalDNFs,
            driverChampion: driverChampion,
            constructorChampion: constructorChampion
        };
    });
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
    loadSeasonView();
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
            loadSeasonView();
        }
    });
    
    // View toggle
    document.getElementById('gridViewBtn').addEventListener('click', () => setViewMode('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => setViewMode('list'));
    
    // Back button
    document.getElementById('backToRacesBtn').addEventListener('click', () => {
        showRacesList();
        hideRaceDetails();
    });
    
    // Race navigation
    document.getElementById('prevRaceBtn').addEventListener('click', () => navigateRace(-1));
    document.getElementById('nextRaceBtn').addEventListener('click', () => navigateRace(1));
    
    // Chart tabs
    document.getElementById('driversChartTab').addEventListener('click', () => showChampionshipChart('drivers'));
    document.getElementById('constructorsChartTab').addEventListener('click', () => showChampionshipChart('constructors'));
    
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
    const newIndex = currentIndex - direction; // Inverted: subtract direction instead of add
    
    if (newIndex >= 0 && newIndex < availableYears.length) {
        currentYear = availableYears[newIndex];
        updateYearDisplay();
        loadSeasonView();
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
    // Left button disabled when at oldest year (end of array)
    document.getElementById('prevYearBtn').disabled = currentIndex === availableYears.length - 1;
    // Right button disabled when at newest year (start of array)
    document.getElementById('nextYearBtn').disabled = currentIndex === 0;
}

/**
 * Load season view
 */
function loadSeasonView() {
    const season = seasonData[currentYear];
    if (!season) return;
    
    // Update season statistics
    updateSeasonStatistics(season);
    
    // Display races
    displayRaces(season.races);
    
    // Show/hide sections
    showRacesList();
    hideRaceDetails();
    
    // Update championship progress
    updateChampionshipProgress();
    
    // Update season summary
    updateSeasonSummary();
}

/**
 * Update season statistics
 */
function updateSeasonStatistics(season) {
    document.getElementById('seasonTotalRaces').textContent = season.totalRaces;
    
    if (season.driverChampion) {
        document.getElementById('seasonDriverChampion').textContent = 
            `${season.driverChampion.name} (${season.driverChampion.team})`;
    } else {
        document.getElementById('seasonDriverChampion').textContent = 'N/A';
    }
    
    document.getElementById('seasonConstructorChampion').textContent = 
        season.constructorChampion || 'N/A';
}

/**
 * Display races in grid or list view
 */
function displayRaces(races) {
    const grid = document.getElementById('racesGrid');
    grid.innerHTML = '';
    
    races.forEach((race, index) => {
        const raceCard = createRaceCard(race, index);
        grid.appendChild(raceCard);
    });
}

/**
 * Create race card element
 */
function createRaceCard(race, index) {
    const card = document.createElement('div');
    card.className = 'race-card';
    card.dataset.raceId = race.raceId;
    
    const circuit = circuitsMap[race.circuitId];
    const country = circuit ? circuit.country : '';
    const flag = countryFlags[country] || '🏁';
    
    // Get race results for podium
    const raceResults = resultsData
        .filter(result => result.raceId === race.raceId)
        .sort((a, b) => (a.positionOrder || 999) - (b.positionOrder || 999));
    
    const podium = raceResults.slice(0, 3).map((result, pos) => {
        const driver = driversMap[result.driverId];
        return driver ? driver.surname : 'Unknown';
    });
    
    card.innerHTML = `
        <div class="race-flag">${flag}</div>
        <div class="race-round">R${race.round}</div>
        <h3 class="race-name">${race.name}</h3>
        <p class="race-date">${formatDate(race.date)}</p>
        <p class="race-circuit">${circuit ? `${circuit.name}` : 'Unknown Circuit'}</p>
        ${podium.length > 0 ? `
            <div class="race-podium">
                <p class="podium-title">Podium</p>
                ${podium.map((driver, i) => `
                    <div class="podium-position">
                        <span class="position-${i + 1}">${i + 1}.</span>
                        <span>${driver}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    card.addEventListener('click', () => showRaceDetails(race.raceId));
    
    // Add animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, index * 50);
    
    return card;
}

/**
 * Set view mode (grid or list)
 */
function setViewMode(mode) {
    const grid = document.getElementById('racesGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    
    if (mode === 'list') {
        grid.classList.add('list-view');
        document.querySelectorAll('.race-card').forEach(card => {
            card.classList.add('list-view');
        });
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        grid.classList.remove('list-view');
        document.querySelectorAll('.race-card').forEach(card => {
            card.classList.remove('list-view');
        });
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    }
}

/**
 * Show race details
 */
function showRaceDetails(raceId) {
    currentRaceId = raceId;
    const race = racesData.find(r => r.raceId === raceId);
    if (!race) return;
    
    // Update race header
    document.getElementById('raceDetailsTitle').textContent = race.name;
    
    // Update race info
    const circuit = circuitsMap[race.circuitId];
    document.getElementById('raceDate').textContent = formatDate(race.date);
    document.getElementById('raceCircuit').textContent = circuit ? 
        `${circuit.name}, ${circuit.country}` : 'Unknown';
    document.getElementById('raceRound').textContent = 
        `${race.round} of ${seasonData[currentYear].totalRaces}`;
    
    // Remove weather field as it's not available in the data
    const weatherElement = document.getElementById('raceWeather');
    if (weatherElement && weatherElement.parentElement) {
        weatherElement.parentElement.style.display = 'none';
    }
    
    // Get race results
    const raceResults = resultsData
        .filter(result => result.raceId === raceId)
        .sort((a, b) => (a.positionOrder || 999) - (b.positionOrder || 999));
    
    // Update highlights
    updateRaceHighlights(raceResults, raceId);
    
    // Update results table
    updateResultsTable(raceResults);
    
    // Update navigation
    updateRaceNavigation(race);
    
    // Show/hide sections
    hideRacesList();
    showRaceDetailsSection();
}

/**
 * Update race highlights
 */
function updateRaceHighlights(results, raceId) {
    // Winner
    const winner = results.find(r => r.position === 1);
    if (winner) {
        const driver = driversMap[winner.driverId];
        const constructor = constructorsMap[winner.constructorId];
        document.querySelector('#winnerInfo .driver-name').textContent = 
            driver ? driver.fullName : 'N/A';
        document.querySelector('#winnerInfo .team-name').textContent = 
            constructor ? constructor.name : 'N/A';
    } else {
        document.querySelector('#winnerInfo .driver-name').textContent = 'N/A';
        document.querySelector('#winnerInfo .team-name').textContent = 'N/A';
    }
    
    // Podium
    const podium = results.filter(r => r.position >= 1 && r.position <= 3);
    const podiumList = document.getElementById('podiumList');
    if (podium.length > 0) {
        podiumList.innerHTML = podium.map(result => {
            const driver = driversMap[result.driverId];
            const constructor = constructorsMap[result.constructorId];
            return `
                <div class="podium-item">
                    ${result.position}. ${driver ? driver.fullName : 'N/A'} 
                    (${constructor ? constructor.name : 'N/A'})
                </div>
            `;
        }).join('');
    } else {
        podiumList.innerHTML = '<div class="podium-item">N/A</div>';
    }
    
    // Fastest lap - More conservative approach
    let fastestLapFound = false;
    
    // Method 1: Look for rank = 1 with valid time
    const fastestByRank = results.find(r => 
        r.rank === 1 && 
        r.fastestLapTime && 
        r.fastestLapTime !== '' && 
        r.fastestLapTime !== '\\N'
    );
    
    if (fastestByRank) {
        const driver = driversMap[fastestByRank.driverId];
        document.querySelector('#fastestLapInfo .driver-name').textContent = 
            driver ? driver.fullName : 'N/A';
        document.querySelector('#fastestLapInfo .lap-time').textContent = 
            fastestByRank.fastestLapTime;
        fastestLapFound = true;
    }
    
    // Method 2: Look for fastestLap = 1 field
    if (!fastestLapFound) {
        const fastestByField = results.find(r => 
            r.fastestLap === 1 && 
            r.fastestLapTime && 
            r.fastestLapTime !== '' && 
            r.fastestLapTime !== '\\N'
        );
        
        if (fastestByField) {
            const driver = driversMap[fastestByField.driverId];
            document.querySelector('#fastestLapInfo .driver-name').textContent = 
                driver ? driver.fullName : 'N/A';
            document.querySelector('#fastestLapInfo .lap-time').textContent = 
                fastestByField.fastestLapTime;
            fastestLapFound = true;
        }
    }
    
    // If no reliable fastest lap data found, show N/A
    if (!fastestLapFound) {
        document.querySelector('#fastestLapInfo .driver-name').textContent = 'N/A';
        document.querySelector('#fastestLapInfo .lap-time').textContent = 'N/A';
    }
    
    // Pole position
    const qualifying = qualifyingData.filter(q => q.raceId === raceId);
    
    // Update the title and content for pole position
    const poleCard = document.querySelector('.highlight-card:nth-child(4)');
    
    if (poleCard) {
        poleCard.querySelector('h4').textContent = 'Pole Position';
        
        if (qualifying.length > 0) {
            // We have qualifying data
            const pole = qualifying.find(q => q.position === 1);
            if (pole) {
                const poleDriver = driversMap[pole.driverId];
                const poleConstructor = constructorsMap[pole.constructorId];
                poleCard.innerHTML = `
                    <h4>Pole Position</h4>
                    <div class="fastest-lap-info" id="poleInfo">
                        <p class="driver-name">${poleDriver ? poleDriver.fullName : 'N/A'}</p>
                        <p class="lap-time">${poleConstructor ? poleConstructor.name : 'N/A'}</p>
                    </div>
                `;
            } else {
                // Try to find the best qualifying position
                const bestQualifying = qualifying.sort((a, b) => (a.position || 999) - (b.position || 999))[0];
                if (bestQualifying && bestQualifying.position) {
                    const poleDriver = driversMap[bestQualifying.driverId];
                    const poleConstructor = constructorsMap[bestQualifying.constructorId];
                    poleCard.innerHTML = `
                        <h4>Pole Position</h4>
                        <div class="fastest-lap-info" id="poleInfo">
                            <p class="driver-name">${poleDriver ? poleDriver.fullName : 'N/A'}</p>
                            <p class="lap-time">${poleConstructor ? poleConstructor.name : 'N/A'}</p>
                        </div>
                    `;
                } else {
                    poleCard.innerHTML = `
                        <h4>Pole Position</h4>
                        <div class="fastest-lap-info" id="poleInfo">
                            <p class="driver-name">N/A</p>
                            <p class="lap-time">N/A</p>
                        </div>
                    `;
                }
            }
        } else {
            // No qualifying data - try to infer from grid position
            const gridOne = results.find(r => r.grid === 1);
            if (gridOne) {
                const poleDriver = driversMap[gridOne.driverId];
                const poleConstructor = constructorsMap[gridOne.constructorId];
                poleCard.innerHTML = `
                    <h4>Pole Position</h4>
                    <div class="fastest-lap-info" id="poleInfo">
                        <p class="driver-name">${poleDriver ? poleDriver.fullName : 'N/A'}</p>
                        <p class="lap-time">${poleConstructor ? poleConstructor.name : 'N/A'}</p>
                    </div>
                `;
            } else {
                poleCard.innerHTML = `
                    <h4>Pole Position</h4>
                    <div class="fastest-lap-info" id="poleInfo">
                        <p class="driver-name">N/A</p>
                        <p class="lap-time">N/A</p>
                    </div>
                `;
            }
        }
    }
}

/**
 * Update results table
 */
function updateResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    results.forEach((result, index) => {
        const driver = driversMap[result.driverId];
        const constructor = constructorsMap[result.constructorId];
        const status = statusMap[result.statusId] || 'Unknown';
        
        const tr = document.createElement('tr');
        
        // Position class
        const positionClass = result.position === 1 ? 'position-1' : 
                            result.position === 2 ? 'position-2' : 
                            result.position === 3 ? 'position-3' : '';
        
        // Status badge
        const statusClass = getStatusClass(status);
        const statusBadge = `<span class="status-badge ${statusClass}">${status}</span>`;
        
        // Time/Gap - show N/A if not available
        let timeGap = 'N/A';
        if (result.time) {
            timeGap = result.time;
        } else if (result.position && result.position > 1 && result.milliseconds) {
            const winner = results.find(r => r.position === 1);
            if (winner && winner.milliseconds) {
                const gap = (result.milliseconds - winner.milliseconds) / 1000;
                timeGap = `+${gap.toFixed(3)}s`;
            }
        }
        
        tr.innerHTML = `
            <td class="${positionClass}">${result.positionText || 'N/A'}</td>
            <td>${driver ? driver.fullName : 'N/A'}</td>
            <td>${constructor ? constructor.name : 'N/A'}</td>
            <td>${result.grid || 'N/A'}</td>
            <td>${statusBadge}</td>
            <td>${result.points || 0}</td>
            <td>${timeGap}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Get status class for styling
 */
function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'finished' || statusLower.includes('lap')) {
        return 'status-finished';
    } else if (statusLower.includes('accident') || statusLower.includes('collision')) {
        return 'status-accident';
    } else if (statusLower.includes('disqualified')) {
        return 'status-disqualified';
    } else if (statusLower.includes('retired') || statusLower.includes('mechanical')) {
        return 'status-retired';
    } else {
        return 'status-dnf';
    }
}

/**
 * Update race navigation
 */
function updateRaceNavigation(currentRace) {
    const yearRaces = seasonData[currentYear].races;
    const currentIndex = yearRaces.findIndex(r => r.raceId === currentRace.raceId);
    
    document.getElementById('prevRaceBtn').disabled = currentIndex === 0;
    document.getElementById('nextRaceBtn').disabled = currentIndex === yearRaces.length - 1;
}

/**
 * Navigate between races
 */
function navigateRace(direction) {
    const yearRaces = seasonData[currentYear].races;
    const currentIndex = yearRaces.findIndex(r => r.raceId === currentRaceId);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < yearRaces.length) {
        showRaceDetails(yearRaces[newIndex].raceId);
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
 * Update championship progress chart
 */
function updateChampionshipProgress() {
    const yearRaces = seasonData[currentYear].races.sort((a, b) => a.round - b.round);
    const driverPoints = {};
    const constructorPoints = {};
    
    // Calculate cumulative points
    yearRaces.forEach(race => {
        const raceStandings = driverStandingsData.filter(s => s.raceId === race.raceId);
        const constructorStandings = constructorStandingsData.filter(s => s.raceId === race.raceId);
        
        // Store driver standings
        raceStandings.forEach(standing => {
            if (!driverPoints[standing.driverId]) {
                driverPoints[standing.driverId] = [];
            }
            driverPoints[standing.driverId].push({
                round: race.round,
                raceName: race.name,
                points: standing.points || 0
            });
        });
        
        // Store constructor standings
        constructorStandings.forEach(standing => {
            if (!constructorPoints[standing.constructorId]) {
                constructorPoints[standing.constructorId] = [];
            }
            constructorPoints[standing.constructorId].push({
                round: race.round,
                raceName: race.name,
                points: standing.points || 0
            });
        });
    });
    
    championshipProgress = {
        drivers: driverPoints,
        constructors: constructorPoints,
        races: yearRaces
    };
    
    // Show initial chart
    showChampionshipChart('drivers');
}

/**
 * Show championship progress chart - shows all drivers/constructors
 */
function showChampionshipChart(type) {
    const data = type === 'drivers' ? championshipProgress.drivers : championshipProgress.constructors;
    const nameMap = type === 'drivers' ? driversMap : constructorsMap;
    
    // Get all entities sorted by final points
    const finalPoints = Object.entries(data)
        .map(([id, points]) => ({
            id,
            finalPoints: points[points.length - 1]?.points || 0
        }))
        .sort((a, b) => b.finalPoints - a.finalPoints);
    
    // Create traces for all entities
    const traces = finalPoints.map((item, index) => {
        const entity = nameMap[item.id];
        const name = type === 'drivers' ? entity?.fullName : entity?.name;
        const points = data[item.id];
        
        // Get team color
        let color = '#808080';
        if (type === 'constructors') {
            color = getTeamColor(entity?.ref);
        } else {
            // For drivers, find their most common team
            const driverResults = resultsData.filter(r => r.driverId == item.id);
            const teamCounts = {};
            driverResults.forEach(r => {
                teamCounts[r.constructorId] = (teamCounts[r.constructorId] || 0) + 1;
            });
            const mainTeamId = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
            if (mainTeamId && constructorsMap[mainTeamId]) {
                color = getTeamColor(constructorsMap[mainTeamId].ref);
            }
        }
        
        // Create race name labels (abbreviated)
        const raceLabels = points.map(p => {
            const raceName = p.raceName
                .replace('Grand Prix', 'GP')
                .replace('Formula 1', '')
                .replace('Grosser Preis', 'GP')
                .replace('Gran Premio', 'GP')
                .trim();
            return raceName;
        });
        
        return {
            x: raceLabels,
            y: points.map(p => p.points),
            type: 'scatter',
            mode: index < 10 ? 'lines+markers' : 'lines', // Only show markers for top 10
            name: name || 'Unknown',
            line: {
                width: index < 5 ? 3 : 1, // Thicker lines for top 5
                color: color
            },
            marker: {
                size: 6,
                color: color
            },
            visible: index < 10 ? true : 'legendonly' // Show only top 10 by default
        };
    });
    
    const layout = {
        title: {
            text: `${currentYear} ${type === 'drivers' ? 'Drivers' : 'Constructors'} Championship Progress`,
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
            font: { color: '#ffffff', size: 10 },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1,
            x: 1,
            y: 1,
            xanchor: 'left',
            yanchor: 'top'
        },
        margin: {
            l: 60,
            r: 200, // More space for legend
            t: 80,
            b: 120 // More space for rotated labels
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('championshipChart', traces, layout, config);
    
    // Update tabs
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.chart === type);
    });
    
    // Show section
    document.getElementById('championshipSection').style.display = 'block';
}

/**
 * Update season summary charts
 */
function updateSeasonSummary() {
    const season = seasonData[currentYear];
    
    // Winners distribution with team info
    const winnerData = {};
    season.results.forEach(result => {
        if (result.position === 1) {
            const driver = driversMap[result.driverId];
            const constructor = constructorsMap[result.constructorId];
            const driverName = driver ? driver.surname : 'Unknown';
            const teamName = constructor ? constructor.name : 'Unknown';
            const key = `${driverName}|${teamName}|${result.driverId}|${result.constructorId}`;
            
            if (!winnerData[key]) {
                winnerData[key] = {
                    driver: driverName,
                    team: teamName,
                    constructorId: result.constructorId,
                    constructorRef: constructor?.ref,
                    wins: 0
                };
            }
            winnerData[key].wins++;
        }
    });
    
    const allWinners = Object.values(winnerData).sort((a, b) => b.wins - a.wins);
    const totalWinners = allWinners.length;
    
    // Take only top 10 winners
    const winners = allWinners.slice(0, 10);
    
    const winnersTrace = {
        labels: winners.map(w => w.driver),
        values: winners.map(w => w.wins),
        type: 'pie',
        textinfo: 'label+value',
        textposition: 'outside',
        marker: {
            colors: winners.map(w => getTeamColor(w.constructorRef))
        },
        hovertemplate: winners.map(w => 
            `<b>%{label}</b><br>` +
            `Team: ${w.team}<br>` +
            `Wins: %{value}<br>` +
            `Percentage: %{percent}<br>` +
            '<extra></extra>'
        )
    };
    
    const winnersLayout = {
        title: {
            text: 'Race Winners - Top 10',
            font: { family: 'Russo One, sans-serif', size: 18, color: '#ffffff' }
        },
        showlegend: false,
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        },
        height: 400,
        annotations: [{
            text: totalWinners > 10 ? `Showing top 10 of ${totalWinners} different winners` : `Total: ${totalWinners} different winners`,
            showarrow: false,
            xref: 'paper',
            yref: 'paper',
            x: 0.5,
            y: -0.15,
            xanchor: 'center',
            yanchor: 'top',
            font: {
                size: 12,
                color: '#b8b8b8'
            }
        }],
        margin: {
            b: 80 // More space for annotation
        }
    };
    
    Plotly.newPlot('winnersChart', [winnersTrace], winnersLayout, { responsive: true, displayModeBar: false });
    
    // Show section
    document.getElementById('seasonSummary').style.display = 'block';
}

/**
 * Show/hide sections
 */
function showRacesList() {
    document.getElementById('racesSection').style.display = 'block';
    document.getElementById('championshipSection').style.display = 'block';
    document.getElementById('seasonSummary').style.display = 'block';
}

function hideRacesList() {
    document.getElementById('racesSection').style.display = 'none';
    document.getElementById('championshipSection').style.display = 'none';
    document.getElementById('seasonSummary').style.display = 'none';
}

function showRaceDetailsSection() {
    document.getElementById('raceDetailsSection').style.display = 'block';
}

function hideRaceDetails() {
    document.getElementById('raceDetailsSection').style.display = 'none';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Hide the loading screen
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
        Plotly.Plots.resize('championshipChart');
        Plotly.Plots.resize('winnersChart');
    }
});

console.log('F1 Race Results Explorer loaded successfully');