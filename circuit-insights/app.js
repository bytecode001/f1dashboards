/**
 * F1 Circuit Insights Dashboard
 * Main JavaScript Application
 * 
 * This application provides comprehensive statistics and insights
 * for all Formula 1 circuits with interactive visualizations
 */

// Global variables
let circuitsData = [];
let racesData = [];
let resultsData = [];
let driversMap = {};
let constructorsMap = {};
let qualifyingData = [];

// State management
let filteredCircuits = [];
let currentCircuitId = null;

// Circuit statistics cache
let circuitStats = {};

// File paths
const DATA_PATH = 'data/';
const CSV_FILES = {
    circuits: 'circuits.csv',
    races: 'races.csv',
    results: 'results.csv',
    drivers: 'drivers.csv',
    constructors: 'constructors.csv',
    qualifying: 'qualifying.csv'
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

// Continent mapping
const continentMapping = {
    'Australia': 'Oceania',
    'Austria': 'Europe',
    'Azerbaijan': 'Asia',
    'Bahrain': 'Asia',
    'Belgium': 'Europe',
    'Brazil': 'Americas',
    'Canada': 'Americas',
    'China': 'Asia',
    'France': 'Europe',
    'Germany': 'Europe',
    'Hungary': 'Europe',
    'India': 'Asia',
    'Italy': 'Europe',
    'Japan': 'Asia',
    'Korea': 'Asia',
    'Malaysia': 'Asia',
    'Mexico': 'Americas',
    'Monaco': 'Europe',
    'Morocco': 'Africa',
    'Netherlands': 'Europe',
    'Portugal': 'Europe',
    'Russia': 'Europe',
    'Saudi Arabia': 'Asia',
    'Singapore': 'Asia',
    'South Africa': 'Africa',
    'Spain': 'Europe',
    'Sweden': 'Europe',
    'Switzerland': 'Europe',
    'Turkey': 'Asia',
    'UAE': 'Asia',
    'UK': 'Europe',
    'USA': 'Americas',
    'Argentina': 'Americas',
    'Qatar': 'Asia',
    'Vietnam': 'Asia'
};

// Team colors
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
    'brawn': '#80FF00'
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing F1 Circuit Insights Dashboard...');
    
    try {
        await loadAllData();
        calculateCircuitStatistics();
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
    console.log('Loading CSV data files...');
    
    try {
        const [circuits, races, results, drivers, constructors, qualifying] = 
            await Promise.all([
                loadCSV(CSV_FILES.circuits),
                loadCSV(CSV_FILES.races),
                loadCSV(CSV_FILES.results),
                loadCSV(CSV_FILES.drivers),
                loadCSV(CSV_FILES.constructors),
                loadCSV(CSV_FILES.qualifying)
            ]);
        
        // Process the loaded data
        processCircuitsData(circuits);
        processRacesData(races);
        processResultsData(results);
        processDriversData(drivers);
        processConstructorsData(constructors);
        qualifyingData = qualifying;
        
        console.log(`Loaded data: ${circuitsData.length} circuits, ${racesData.length} races`);
        
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
 * Process circuits data
 */
function processCircuitsData(data) {
    circuitsData = data.map(circuit => ({
        circuitId: circuit.circuitId,
        ref: circuit.circuitRef,
        name: circuit.name,
        location: circuit.location,
        country: circuit.country,
        lat: circuit.lat,
        lng: circuit.lng,
        alt: circuit.alt,
        url: circuit.url,
        continent: continentMapping[circuit.country] || 'Other'
    }));
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
 * Calculate statistics for each circuit
 */
function calculateCircuitStatistics() {
    circuitsData.forEach(circuit => {
        const circuitRaces = racesData.filter(race => race.circuitId === circuit.circuitId);
        const raceIds = circuitRaces.map(race => race.raceId);
        const circuitResults = resultsData.filter(result => raceIds.includes(result.raceId));
        
        // Calculate statistics
        const firstRace = circuitRaces.length > 0 ? 
            circuitRaces.reduce((min, race) => race.year < min.year ? race : min) : null;
        const lastRace = circuitRaces.length > 0 ? 
            circuitRaces.reduce((max, race) => race.year > max.year ? race : max) : null;
        
        // Calculate winners
        const winners = {};
        const constructorWins = {};
        const poles = {};
        
        circuitResults.forEach(result => {
            if (result.position === 1) {
                winners[result.driverId] = (winners[result.driverId] || 0) + 1;
                constructorWins[result.constructorId] = (constructorWins[result.constructorId] || 0) + 1;
            }
        });
        
        // Calculate pole positions from qualifying or grid
        circuitRaces.forEach(race => {
            const raceQualifying = qualifyingData.filter(q => q.raceId === race.raceId);
            let poleDriverId = null;
            
            if (raceQualifying.length > 0) {
                const pole = raceQualifying.find(q => q.position === 1);
                if (pole) poleDriverId = pole.driverId;
            } else {
                // Fallback to grid position
                const gridOne = circuitResults.find(r => r.raceId === race.raceId && r.grid === 1);
                if (gridOne) poleDriverId = gridOne.driverId;
            }
            
            if (poleDriverId) {
                poles[poleDriverId] = (poles[poleDriverId] || 0) + 1;
            }
        });
        
        // Find fastest lap
        let fastestLapData = null;
        circuitResults.forEach(result => {
            if (result.fastestLapTime && result.fastestLapTime !== '' && result.fastestLapTime !== '\\N' && result.rank === 1) {
                if (!fastestLapData || comparelapTimes(result.fastestLapTime, fastestLapData.time) < 0) {
                    const race = circuitRaces.find(r => r.raceId === result.raceId);
                    fastestLapData = {
                        time: result.fastestLapTime,
                        driverId: result.driverId,
                        year: race ? race.year : null
                    };
                }
            }
        });
        
        circuitStats[circuit.circuitId] = {
            totalRaces: circuitRaces.length,
            firstRace: firstRace,
            lastRace: lastRace,
            winners: winners,
            constructorWins: constructorWins,
            poles: poles,
            fastestLap: fastestLapData,
            races: circuitRaces
        };
    });
}

/**
 * Compare lap times (format: M:SS.mmm)
 */
function comparelapTimes(time1, time2) {
    const parseTime = (time) => {
        const parts = time.split(':');
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return minutes * 60 + seconds;
    };
    
    return parseTime(time1) - parseTime(time2);
}

/**
 * Initialize UI components
 */
function initializeUI() {
    setupEventListeners();
    displayCircuits();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', filterCircuits);
    
    // Filters
    document.getElementById('continentFilter').addEventListener('change', filterCircuits);
    document.getElementById('sortBy').addEventListener('change', sortCircuits);
    
    // Back button
    document.getElementById('backToCircuitsBtn').addEventListener('click', () => {
        showCircuitsList();
        hideCircuitDetails();
    });
    
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
 * Display all circuits
 */
function displayCircuits() {
    filteredCircuits = [...circuitsData];
    renderCircuitCards();
}

/**
 * Filter circuits based on search and continent
 */
function filterCircuits() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const continentFilter = document.getElementById('continentFilter').value;
    
    filteredCircuits = circuitsData.filter(circuit => {
        const matchesSearch = !searchTerm || 
            circuit.name.toLowerCase().includes(searchTerm) ||
            circuit.location.toLowerCase().includes(searchTerm) ||
            circuit.country.toLowerCase().includes(searchTerm);
        
        const matchesContinent = !continentFilter || circuit.continent === continentFilter;
        
        return matchesSearch && matchesContinent;
    });
    
    sortCircuits();
}

/**
 * Sort circuits based on selected criteria
 */
function sortCircuits() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'name':
            filteredCircuits.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'races':
            filteredCircuits.sort((a, b) => 
                (circuitStats[b.circuitId]?.totalRaces || 0) - (circuitStats[a.circuitId]?.totalRaces || 0)
            );
            break;
        case 'recent':
            filteredCircuits.sort((a, b) => {
                const aLastYear = circuitStats[a.circuitId]?.lastRace?.year || 0;
                const bLastYear = circuitStats[b.circuitId]?.lastRace?.year || 0;
                return bLastYear - aLastYear;
            });
            break;
        case 'oldest':
            filteredCircuits.sort((a, b) => {
                const aFirstYear = circuitStats[a.circuitId]?.firstRace?.year || 9999;
                const bFirstYear = circuitStats[b.circuitId]?.firstRace?.year || 9999;
                return aFirstYear - bFirstYear;
            });
            break;
    }
    
    renderCircuitCards();
}

/**
 * Render circuit cards
 */
function renderCircuitCards() {
    const grid = document.getElementById('circuitsGrid');
    grid.innerHTML = '';
    
    filteredCircuits.forEach((circuit, index) => {
        const card = createCircuitCard(circuit);
        grid.appendChild(card);
        
        // Add animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
    // Update count
    document.getElementById('circuitCount').textContent = 
        `${filteredCircuits.length} circuit${filteredCircuits.length !== 1 ? 's' : ''}`;
}

/**
 * Create circuit card element
 */
function createCircuitCard(circuit) {
    const card = document.createElement('div');
    card.className = 'circuit-card';
    card.dataset.circuitId = circuit.circuitId;
    
    const stats = circuitStats[circuit.circuitId] || {};
    const flag = countryFlags[circuit.country] || '🏁';
    const lastRaceYear = stats.lastRace ? stats.lastRace.year : 'N/A';
    const yearRange = stats.firstRace && stats.lastRace ? 
        `${stats.firstRace.year}-${stats.lastRace.year}` : 'N/A';
    
    card.innerHTML = `
        <div class="circuit-flag">${flag}</div>
        <h3 class="circuit-name">${circuit.name}</h3>
        <p class="circuit-location">${circuit.location}, ${circuit.country}</p>
        <div class="circuit-stats">
            <div class="circuit-stat">
                <span class="stat-label">Races</span>
                <span class="stat-value">${stats.totalRaces || 0}</span>
            </div>
            <div class="circuit-stat">
                <span class="stat-label">Years</span>
                <span class="stat-value">${yearRange}</span>
            </div>
            <div class="circuit-stat">
                <span class="stat-label">Last Race</span>
                <span class="stat-value">${lastRaceYear}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showCircuitDetails(circuit.circuitId));
    
    return card;
}

/**
 * Show circuit details
 */
function showCircuitDetails(circuitId) {
    currentCircuitId = circuitId;
    const circuit = circuitsData.find(c => c.circuitId === circuitId);
    const stats = circuitStats[circuitId] || {};
    
    if (!circuit) return;
    
    // Update header
    document.getElementById('circuitName').textContent = circuit.name;
    document.getElementById('circuitLocation').textContent = circuit.location;
    document.getElementById('circuitCountry').textContent = circuit.country;
    
    // Update info cards
    document.getElementById('firstGP').textContent = stats.firstRace ? stats.firstRace.year : 'N/A';
    document.getElementById('totalRaces').textContent = stats.totalRaces || 0;
    document.getElementById('lastRace').textContent = stats.lastRace ? stats.lastRace.year : 'N/A';
    document.getElementById('trackLength').textContent = 'N/A'; // Would need additional data
    
    // Update records
    updateCircuitRecords(stats);
    
    // Update charts
    updateWinnersChart(stats);
    
    // Update recent results
    updateRecentResults(circuit, stats);
    
    // Show/hide sections
    hideCircuitsList();
    showCircuitDetailsSection();
    
    // Remove lap time chart section if exists
    const lapTimeSection = document.querySelector('.chart-section:nth-child(6)');
    if (lapTimeSection) {
        lapTimeSection.style.display = 'none';
    }
}

/**
 * Update circuit records
 */
function updateCircuitRecords(stats) {
    // Fastest lap
    if (stats.fastestLap) {
        const driver = driversMap[stats.fastestLap.driverId];
        document.getElementById('fastestLapTime').textContent = stats.fastestLap.time;
        document.getElementById('fastestLapHolder').textContent = driver ? driver.fullName : 'N/A';
        document.getElementById('fastestLapYear').textContent = stats.fastestLap.year || 'N/A';
    } else {
        document.getElementById('fastestLapTime').textContent = 'N/A';
        document.getElementById('fastestLapHolder').textContent = 'N/A';
        document.getElementById('fastestLapYear').textContent = 'N/A';
    }
    
    // Most wins
    const topWinner = Object.entries(stats.winners || {})
        .sort((a, b) => b[1] - a[1])[0];
    if (topWinner) {
        const driver = driversMap[topWinner[0]];
        document.getElementById('mostWinsCount').textContent = topWinner[1];
        document.getElementById('mostWinsDriver').textContent = driver ? driver.fullName : 'N/A';
    } else {
        document.getElementById('mostWinsCount').textContent = 'N/A';
        document.getElementById('mostWinsDriver').textContent = 'N/A';
    }
    
    // Most poles
    const topPoler = Object.entries(stats.poles || {})
        .sort((a, b) => b[1] - a[1])[0];
    if (topPoler) {
        const driver = driversMap[topPoler[0]];
        document.getElementById('mostPolesCount').textContent = topPoler[1];
        document.getElementById('mostPolesDriver').textContent = driver ? driver.fullName : 'N/A';
    } else {
        document.getElementById('mostPolesCount').textContent = 'N/A';
        document.getElementById('mostPolesDriver').textContent = 'N/A';
    }
    
    // Constructor wins
    const topConstructor = Object.entries(stats.constructorWins || {})
        .sort((a, b) => b[1] - a[1])[0];
    if (topConstructor) {
        const constructor = constructorsMap[topConstructor[0]];
        document.getElementById('constructorWinsCount').textContent = topConstructor[1];
        document.getElementById('constructorWinsTeam').textContent = constructor ? constructor.name : 'N/A';
    } else {
        document.getElementById('constructorWinsCount').textContent = 'N/A';
        document.getElementById('constructorWinsTeam').textContent = 'N/A';
    }
}

/**
 * Update winners chart - Fixed to show in descending order
 */
function updateWinnersChart(stats) {
    const winnersData = Object.entries(stats.winners || {})
        .map(([driverId, wins]) => ({
            driver: driversMap[driverId]?.fullName || 'Unknown',
            wins: wins
        }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10); // Top 10 winners
    
    if (winnersData.length === 0) {
        document.getElementById('winnersChart').innerHTML = '<p class="no-data">No data available</p>';
        return;
    }
    
    // Reverse arrays for proper descending display
    const reversedData = winnersData.reverse();
    
    const trace = {
        x: reversedData.map(d => d.wins),
        y: reversedData.map(d => d.driver),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: '#ff1801',
            line: {
                color: '#ff3520',
                width: 1
            }
        },
        hovertemplate: '<b>%{y}</b><br>Wins: %{x}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Most Successful Drivers',
            font: {
                family: 'Russo One, sans-serif',
                size: 18,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Number of Wins',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zeroline: false
        },
        yaxis: {
            tickfont: { color: '#b8b8b8' },
            automargin: true
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'closest',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        },
        margin: {
            l: 150,
            r: 40,
            t: 60,
            b: 60
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('winnersChart', [trace], layout, config);
}

/**
 * Update recent results table
 */
function updateRecentResults(circuit, stats) {
    const tbody = document.getElementById('recentResultsBody');
    tbody.innerHTML = '';
    
    // Get last 10 races
    const recentRaces = stats.races
        .sort((a, b) => b.year - a.year)
        .slice(0, 10);
    
    if (recentRaces.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No race data available</td></tr>';
        return;
    }
    
    recentRaces.forEach(race => {
        const raceResults = resultsData.filter(r => r.raceId === race.raceId);
        
        // Find winner
        const winner = raceResults.find(r => r.position === 1);
        const winnerDriver = winner ? driversMap[winner.driverId] : null;
        const winnerConstructor = winner ? constructorsMap[winner.constructorId] : null;
        
        // Find pole (from qualifying or grid)
        let poleDriver = null;
        const raceQualifying = qualifyingData.filter(q => q.raceId === race.raceId);
        if (raceQualifying.length > 0) {
            const pole = raceQualifying.find(q => q.position === 1);
            if (pole) poleDriver = driversMap[pole.driverId];
        } else {
            const gridOne = raceResults.find(r => r.grid === 1);
            if (gridOne) poleDriver = driversMap[gridOne.driverId];
        }
        
        // Find fastest lap
        let fastestLapDriver = null;
        const fastestLapResult = raceResults.find(r => r.rank === 1 && 
            r.fastestLapTime && r.fastestLapTime !== '' && r.fastestLapTime !== '\\N');
        if (fastestLapResult) {
            fastestLapDriver = driversMap[fastestLapResult.driverId];
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${race.year}</td>
            <td>${winnerDriver ? winnerDriver.fullName : 'N/A'}</td>
            <td>${winnerConstructor ? winnerConstructor.name : 'N/A'}</td>
            <td>${poleDriver ? poleDriver.fullName : 'N/A'}</td>
            <td>${fastestLapDriver ? fastestLapDriver.fullName : 'N/A'}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Show/hide sections
 */
function showCircuitsList() {
    document.getElementById('circuitsListView').style.display = 'block';
}

function hideCircuitsList() {
    document.getElementById('circuitsListView').style.display = 'none';
}

function showCircuitDetailsSection() {
    document.getElementById('circuitDetailView').style.display = 'block';
    window.scrollTo(0, 0);
}

function hideCircuitDetails() {
    document.getElementById('circuitDetailView').style.display = 'none';
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
 * Get team color
 */
function getTeamColor(constructorRef) {
    if (!constructorRef) return '#808080';
    const ref = constructorRef.toLowerCase();
    return teamColors[ref] || '#808080';
}

/**
 * Handle window resize
 */
window.addEventListener('resize', () => {
    if (window.Plotly) {
        Plotly.Plots.resize('winnersChart');
    }
});

console.log('F1 Circuit Insights Dashboard loaded successfully');