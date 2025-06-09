/**
 * Update team performance chart
 */
function updateTeamPerformanceChart() {
    const season = seasonData[currentYear];
    // Always use full season data, regardless of selected race
    const qualifying = season.qualifying;
    
    // Calculate average grid position by team
    const teamPositions = {};
    
    qualifying.forEach(q => {
        if (!teamPositions[q.constructorId]) {
            teamPositions[q.constructorId] = {
                positions: [],
                q3Count: 0,
                poleCount: 0
            };
        }
        teamPositions[q.constructorId].positions.push(q.position);
        if (season.hasKnockoutFormat && q.q3 && q.q3 !== '\\N') {
            teamPositions[q.constructorId].q3Count++;
        }
        if (q.position === 1) teamPositions[q.constructorId].poleCount++;
    });
    
    // Calculate statistics
    const teamData = Object.entries(teamPositions)
        .map(([constructorId, data]) => {
            const constructor = constructorsMap[constructorId];
            return {
                team: constructor ? constructor.name : 'Unknown',
                constructorRef: constructor?.ref,
                avgPosition: data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
                q3Percentage: season.hasKnockoutFormat ? 
                    (data.q3Count / data.positions.length) * 100 : null,
                poleCount: data.poleCount,
                totalSessions: data.positions.length
            };
        })
        .sort((a, b) => a.avgPosition - b.avgPosition)
        .slice(0, 10);
    
    const traces = [];
    
    // Average position trace
    const trace1 = {
        x: teamData.map(t => t.team),
        y: teamData.map(t => t.avgPosition),
        type: 'bar',
        name: 'Avg Grid Position',
        marker: {
            color: teamData.map(t => getTeamColor(t.constructorRef)),
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        yaxis: 'y',
        hovertemplate: '<b>%{x}</b><br>' +
                      'Avg Position: %{y:.2f}<br>' +
                      '<extra></extra>'
    };
    traces.push(trace1);
    
    // Q3 participation trace (only for knockout format)
    if (season.hasKnockoutFormat) {
        const trace2 = {
            x: teamData.map(t => t.team),
            y: teamData.map(t => t.q3Percentage),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Q3 Participation %',
            line: {
                color: '#ff1801',
                width: 3
            },
            marker: {
                size: 10,
                color: '#ff1801'
            },
            yaxis: 'y2',
            hovertemplate: '<b>%{x}</b><br>' +
                          'Q3 Participation: %{y:.1f}%<br>' +
                          '<extra></extra>'
        };
        traces.push(trace2);
    }
    
    const layout = {
        title: {
            text: `${currentYear} Team Qualifying Performance`,
            font: { family: 'Russo One, sans-serif', size: 18, color: '#ffffff' }
        },
        xaxis: {
            tickfont: { color: '#b8b8b8', size: 10 },
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Average Grid Position',
            titlefont: { color: '#ffffff' },
            tickfont: { color: '#b8b8b8' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            autorange: 'reversed',
            side: 'left'
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: 'rgba(21, 21, 30, 0.9)',
            bordercolor: '#ff1801',
            font: { 
                family: 'IBM Plex Sans, sans-serif', 
                color: '#ffffff',
                size: 14
            }
        },
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1,
            x: 0,
            y: 1
        },
        margin: {
            b: 120
        }
    };
    
    // Add second y-axis only for knockout format
    if (season.hasKnockoutFormat) {
        layout.yaxis2 = {
            title: 'Q3 Participation %',
            titlefont: { color: '#ff1801' },
            tickfont: { color: '#ff1801' },
            overlaying: 'y',
            side: 'right',
            range: [0, 100]
        };
    }
    
    Plotly.newPlot('teamPerformanceChart', traces, layout, { responsive: true, displayModeBar: false });
}
    /**
 * F1 Qualifying Performance Dashboard
 * Main JavaScript Application
 * 
 * This application provides comprehensive analysis of Formula 1 qualifying sessions
 * with support for all qualifying formats from 1950 to present
 */

// Global variables
let qualifyingData = [];
let racesData = [];
let driversMap = {};
let constructorsMap = {};
let circuitsMap = {};

// State management
let currentYear = null;
let currentRaceId = null;
let currentSession = 'q3';
let availableYears = [];
let seasonData = {};

// File paths
const DATA_PATH = 'data/';
const CSV_FILES = {
    qualifying: 'qualifying.csv',
    races: 'races.csv',
    drivers: 'drivers.csv',
    constructors: 'constructors.csv',
    circuits: 'circuits.csv'
};

// Qualifying format information
const qualifyingFormats = {
    '1950-1995': {
        description: 'Best time across multiple sessions',
        details: 'Qualifying over two days (Friday and Saturday). Best time from any session counts.'
    },
    '1996-2002': {
        description: 'Single one-hour session',
        details: 'One hour session on Saturday. Each driver had 12 laps available.'
    },
    '2003': {
        description: 'Single-lap qualifying (two days)',
        details: 'Two single-lap sessions: Friday and Saturday. Best time counts.'
    },
    '2004': {
        description: 'Single-lap qualifying (Saturday only)',
        details: 'One single-lap session on Saturday. Each driver alone on track.'
    },
    '2005': {
        description: 'Aggregate qualifying',
        details: 'Two single-lap sessions. Grid position based on sum of both times. Mid-season: single session only.'
    },
    '2006-present': {
        description: 'Knockout qualifying (Q1, Q2, Q3)',
        details: 'Three knockout sessions. Slowest drivers eliminated after each session.'
    }
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
    'lola': '#FF0000'
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Qualifying Performance Dashboard...');
    
    try {
        await loadAllData();
        processSeasonData();
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
        const [qualifying, races, drivers, constructors, circuits] = 
            await Promise.all([
                loadCSV(CSV_FILES.qualifying),
                loadCSV(CSV_FILES.races),
                loadCSV(CSV_FILES.drivers),
                loadCSV(CSV_FILES.constructors),
                loadCSV(CSV_FILES.circuits)
            ]);
        
        // Process the loaded data
        processQualifyingData(qualifying);
        processRacesData(races);
        processDriversData(drivers);
        processConstructorsData(constructors);
        processCircuitsData(circuits);
        
        console.log(`Loaded data: ${qualifyingData.length} qualifying sessions, ${racesData.length} races`);
        
        // Analyze data availability
        analyzeDataAvailability();
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Analyze data availability by year
 */
function analyzeDataAvailability() {
    const qualifyingYears = new Set();
    qualifyingData.forEach(q => {
        const race = racesData.find(r => r.raceId === q.raceId);
        if (race) {
            qualifyingYears.add(race.year);
        }
    });
    
    console.log('Qualifying data available for years:', Array.from(qualifyingYears).sort());
    console.log('First year with qualifying data:', Math.min(...qualifyingYears));
    console.log('Last year with qualifying data:', Math.max(...qualifyingYears));
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
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';']
    });
    
    if (parsed.errors.length > 0) {
        console.warn(`${filename} parsing warnings:`, parsed.errors);
    }
    
    return parsed.data;
}

/**
 * Process qualifying data
 */
function processQualifyingData(data) {
    qualifyingData = data.map(session => ({
        qualifyId: session.qualifyId,
        raceId: session.raceId,
        driverId: session.driverId,
        constructorId: session.constructorId,
        number: session.number,
        position: session.position,
        q1: session.q1,
        q2: session.q2,
        q3: session.q3
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
    
    // Extract available years - filter only years with qualifying data
    const yearsWithQualifying = new Set();
    qualifyingData.forEach(q => {
        const race = racesData.find(r => r.raceId === q.raceId);
        if (race) {
            yearsWithQualifying.add(race.year);
        }
    });
    
    availableYears = Array.from(yearsWithQualifying).sort((a, b) => b - a);
    console.log('Available years with qualifying data:', availableYears);
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
 * Get qualifying format for a given year
 */
function getQualifyingFormat(year) {
    if (year <= 1995) return '1950-1995';
    if (year <= 2002) return '1996-2002';
    if (year === 2003) return '2003';
    if (year === 2004) return '2004';
    if (year === 2005) return '2005';
    return '2006-present';
}

/**
 * Check if year uses Q1/Q2/Q3 format
 */
function hasKnockoutFormat(year) {
    return year >= 2006;
}

/**
 * Process and organize data by season
 */
function processSeasonData() {
    availableYears.forEach(year => {
        const yearRaces = racesData.filter(race => race.year === year);
        const yearRaceIds = yearRaces.map(race => race.raceId);
        const yearQualifying = qualifyingData.filter(q => yearRaceIds.includes(q.raceId));
        
        // Calculate season statistics
        const polePositions = {};
        const q3Participants = [];
        
        yearRaces.forEach(race => {
            const raceQualifying = yearQualifying.filter(q => q.raceId === race.raceId);
            const pole = raceQualifying.find(q => q.position === 1);
            
            if (pole) {
                const driverId = pole.driverId;
                polePositions[driverId] = (polePositions[driverId] || 0) + 1;
            }
            
            // Count Q3 participants only for years with knockout format
            if (hasKnockoutFormat(year)) {
                const q3Count = raceQualifying.filter(q => q.q3 && q.q3 !== '\\N').length;
                if (q3Count > 0) {
                    q3Participants.push(q3Count);
                }
            }
        });
        
        // Find top pole sitter
        let topPoleSitter = null;
        let maxPoles = 0;
        Object.entries(polePositions).forEach(([driverId, poles]) => {
            if (poles > maxPoles) {
                maxPoles = poles;
                topPoleSitter = driverId;
            }
        });
        
        seasonData[year] = {
            races: yearRaces,
            qualifying: yearQualifying,
            totalRaces: yearRaces.length,
            racesWithQualifying: yearRaces.filter(race => 
                yearQualifying.some(q => q.raceId === race.raceId)
            ).length,
            polePositions: polePositions,
            topPoleSitter: topPoleSitter,
            topPoleSitterCount: maxPoles,
            differentPoleWinners: Object.keys(polePositions).length,
            avgQ3Participants: q3Participants.length > 0 ? 
                (q3Participants.reduce((a, b) => a + b, 0) / q3Participants.length).toFixed(1) : 0,
            qualifyingFormat: getQualifyingFormat(year),
            hasKnockoutFormat: hasKnockoutFormat(year)
        };
    });
}

/**
 * Initialize UI components
 */
function initializeUI() {
    setupEventListeners();
    populateYearSelector();
    
    // Set initial year to most recent with data
    currentYear = availableYears[0];
    updateYearDisplay();
    updateRaceSelector();
    updateSeasonStats();
    updateQualifyingInfo();
    updateCharts();
}

/**
 * Populate year selector dropdown
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
 * Setup event listeners
 */
function setupEventListeners() {
    // Year navigation
    document.getElementById('prevYearBtn').addEventListener('click', () => navigateYear(-1));
    document.getElementById('nextYearBtn').addEventListener('click', () => navigateYear(1));
    
    // Year dropdown
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            currentYear = parseInt(e.target.value);
            currentRaceId = null;
            updateYearDisplay();
            updateRaceSelector();
            updateSeasonStats();
            updateQualifyingInfo();
            updateQualifyingResults();
            updateCharts();
        }
    });
    
    // Race selector
    document.getElementById('raceSelect').addEventListener('change', (e) => {
        currentRaceId = e.target.value ? parseInt(e.target.value) : null;
        updateQualifyingResults();
        // Note: updateCharts removed here - Team Performance always shows full season
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
 * Navigate between years
 */
function navigateYear(direction) {
    const currentIndex = availableYears.indexOf(currentYear);
    const newIndex = currentIndex - direction;
    
    if (newIndex >= 0 && newIndex < availableYears.length) {
        currentYear = availableYears[newIndex];
        currentRaceId = null;
        updateYearDisplay();
        updateRaceSelector();
        updateSeasonStats();
        updateQualifyingInfo();
        updateQualifyingResults();
        updateCharts();
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
 * Update race selector
 */
function updateRaceSelector() {
    const select = document.getElementById('raceSelect');
    const season = seasonData[currentYear];
    
    select.innerHTML = '<option value="">All Races</option>';
    
    season.races.forEach(race => {
        const hasQualifying = season.qualifying.some(q => q.raceId === race.raceId);
        if (hasQualifying) {
            const option = document.createElement('option');
            option.value = race.raceId;
            option.textContent = `Round ${race.round} - ${race.name}`;
            select.appendChild(option);
        }
    });
}

/**
 * Update season statistics
 */
function updateSeasonStats() {
    const season = seasonData[currentYear];
    
    document.getElementById('totalRaces').textContent = season.racesWithQualifying;
    
    if (season.topPoleSitter) {
        const driver = driversMap[season.topPoleSitter];
        document.getElementById('topPoleSitter').textContent = 
            driver ? `${driver.fullName} (${season.topPoleSitterCount})` : 'N/A';
    } else {
        document.getElementById('topPoleSitter').textContent = 'N/A';
    }
    
    document.getElementById('differentPoleWinners').textContent = season.differentPoleWinners;
    
    // Hide Q3 stats for pre-2006 seasons
    const q3StatsCard = document.getElementById('q3StatsCard');
    if (season.hasKnockoutFormat) {
        q3StatsCard.style.display = 'block';
        document.getElementById('avgQ3Participants').textContent = season.avgQ3Participants;
    } else {
        q3StatsCard.style.display = 'none';
    }
}

/**
 * Update qualifying info
 */
function updateQualifyingInfo() {
    const season = seasonData[currentYear];
    const format = qualifyingFormats[season.qualifyingFormat];
    const infoElement = document.querySelector('.qualifying-info .info-text');
    
    infoElement.innerHTML = `<strong>${format.description}</strong> - ${format.details}`;
}

/**
 * Update qualifying results table
 */
function updateQualifyingResults() {
    const tbody = document.getElementById('resultsTableBody');
    const title = document.getElementById('resultsTitle');
    const table = document.getElementById('resultsTable');
    const season = seasonData[currentYear];
    
    if (!currentRaceId) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Select a race to view qualifying results</td></tr>';
        title.textContent = 'Qualifying Results';
        return;
    }
    
    const race = racesData.find(r => r.raceId === currentRaceId);
    const qualifying = qualifyingData
        .filter(q => q.raceId === currentRaceId)
        .sort((a, b) => (a.position || 999) - (b.position || 999));
    
    title.textContent = `${race.name} - Qualifying Results`;
    
    if (qualifying.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No qualifying data available for this race</td></tr>';
        return;
    }
    
    // Update table headers based on year
    const thead = table.querySelector('thead tr');
    if (season.hasKnockoutFormat) {
        table.classList.remove('old-format-table');
        thead.innerHTML = `
            <th>Pos</th>
            <th>Driver</th>
            <th>Constructor</th>
            <th>Q1</th>
            <th>Q2</th>
            <th>Q3</th>
            <th>Gap</th>
        `;
    } else {
        table.classList.add('old-format-table');
        thead.innerHTML = `
            <th>Pos</th>
            <th>Driver</th>
            <th>Constructor</th>
            <th>Time</th>
            <th>Gap</th>
        `;
    }
    
    tbody.innerHTML = '';
    
    if (season.hasKnockoutFormat) {
        // Modern format with Q1/Q2/Q3
        renderKnockoutQualifying(tbody, qualifying);
    } else {
        // Old format with single time
        renderClassicQualifying(tbody, qualifying);
    }
}

/**
 * Render knockout format qualifying (2006+)
 */
function renderKnockoutQualifying(tbody, qualifying) {
    // Find fastest times for each session
    const fastestQ1 = findFastestTime(qualifying, 'q1');
    const fastestQ2 = findFastestTime(qualifying, 'q2');
    const fastestQ3 = findFastestTime(qualifying, 'q3');
    const poleTime = parseTime(qualifying[0]?.q3 || qualifying[0]?.q2 || qualifying[0]?.q1);
    
    qualifying.forEach((session, index) => {
        const driver = driversMap[session.driverId];
        const constructor = constructorsMap[session.constructorId];
        
        const tr = document.createElement('tr');
        
        // Position class
        const positionClass = session.position === 1 ? 'position-1' : 
                            session.position === 2 ? 'position-2' : 
                            session.position === 3 ? 'position-3' : '';
        
        // Format times
        const q1Time = formatQualifyingTime(session.q1, session.q1 === fastestQ1);
        const q2Time = formatQualifyingTime(session.q2, session.q2 === fastestQ2);
        const q3Time = formatQualifyingTime(session.q3, session.q3 === fastestQ3);
        
        // Calculate gap to pole
        let gap = '';
        if (session.position > 1) {
            const sessionBestTime = parseTime(session.q3 || session.q2 || session.q1);
            if (sessionBestTime && poleTime) {
                const gapSeconds = sessionBestTime - poleTime;
                gap = `<span class="gap-to-pole">+${gapSeconds.toFixed(3)}</span>`;
            }
        }
        
        tr.innerHTML = `
            <td class="${positionClass}">${session.position || 'N/A'}</td>
            <td>${driver ? driver.fullName : 'N/A'}</td>
            <td>${constructor ? constructor.name : 'N/A'}</td>
            <td>${q1Time}</td>
            <td>${q2Time}</td>
            <td>${q3Time}</td>
            <td>${gap}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Render classic format qualifying (pre-2006)
 */
function renderClassicQualifying(tbody, qualifying) {
    // For old format, use the best available time
    const getBestTime = (session) => {
        return session.q3 || session.q2 || session.q1 || null;
    };
    
    // Find fastest overall time
    let fastestTime = null;
    let fastestValue = Infinity;
    qualifying.forEach(q => {
        const time = getBestTime(q);
        if (time && time !== '\\N') {
            const timeValue = parseTime(time);
            if (timeValue && timeValue < fastestValue) {
                fastestValue = timeValue;
                fastestTime = time;
            }
        }
    });
    
    const poleTime = parseTime(getBestTime(qualifying[0]));
    
    qualifying.forEach((session, index) => {
        const driver = driversMap[session.driverId];
        const constructor = constructorsMap[session.constructorId];
        const bestTime = getBestTime(session);
        
        const tr = document.createElement('tr');
        
        // Position class
        const positionClass = session.position === 1 ? 'position-1' : 
                            session.position === 2 ? 'position-2' : 
                            session.position === 3 ? 'position-3' : '';
        
        // Format time
        const timeFormatted = formatQualifyingTime(bestTime, bestTime === fastestTime);
        
        // Calculate gap to pole
        let gap = '';
        if (session.position > 1 && bestTime && bestTime !== '\\N') {
            const sessionTime = parseTime(bestTime);
            if (sessionTime && poleTime) {
                const gapSeconds = sessionTime - poleTime;
                gap = `<span class="gap-to-pole">+${gapSeconds.toFixed(3)}</span>`;
            }
        }
        
        tr.innerHTML = `
            <td class="${positionClass}">${session.position || 'N/A'}</td>
            <td>${driver ? driver.fullName : 'N/A'}</td>
            <td>${constructor ? constructor.name : 'N/A'}</td>
            <td>${timeFormatted}</td>
            <td>${gap}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

/**
 * Find fastest time in a session
 */
function findFastestTime(qualifying, session) {
    let fastest = null;
    let fastestValue = Infinity;
    
    qualifying.forEach(q => {
        const time = q[session];
        if (time && time !== '\\N') {
            const timeValue = parseTime(time);
            if (timeValue && timeValue < fastestValue) {
                fastestValue = timeValue;
                fastest = time;
            }
        }
    });
    
    return fastest;
}

/**
 * Parse time string to seconds
 */
function parseTime(timeStr) {
    if (!timeStr || timeStr === '\\N') return null;
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return minutes * 60 + seconds;
    }
    return null;
}

/**
 * Format qualifying time
 */
function formatQualifyingTime(time, isFastest) {
    if (!time || time === '\\N') {
        return '<span class="eliminated">—</span>';
    }
    
    const className = isFastest ? 'lap-time fastest-time' : 'lap-time';
    return `<span class="${className}">${time}</span>`;
}

/**
 * Update all charts
 */
function updateCharts() {
    updatePolePositionsChart();
    updateTeamPerformanceChart();
}

/**
 * Update pole positions chart
 */
function updatePolePositionsChart() {
    const season = seasonData[currentYear];
    
    // Sort drivers by pole count - already in descending order
    const poleData = Object.entries(season.polePositions)
        .map(([driverId, count]) => {
            const driver = driversMap[driverId];
            // Find the driver's main team for the season
            const driverQualifying = season.qualifying.filter(q => q.driverId == driverId);
            const teamCounts = {};
            driverQualifying.forEach(q => {
                if (q.constructorId) {
                    teamCounts[q.constructorId] = (teamCounts[q.constructorId] || 0) + 1;
                }
            });
            
            // Get the most common team
            let mainTeamId = null;
            let maxCount = 0;
            Object.entries(teamCounts).forEach(([constructorId, teamCount]) => {
                if (teamCount > maxCount) {
                    maxCount = teamCount;
                    mainTeamId = constructorId;
                }
            });
            
            const mainTeam = mainTeamId ? constructorsMap[mainTeamId] : null;
            
            return {
                driver: driver?.surname || 'Unknown',
                fullName: driver?.fullName || 'Unknown',
                team: mainTeam?.name || 'Unknown',
                count: count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    const trace = {
        x: poleData.map(d => d.count),
        y: poleData.map(d => d.driver),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: '#ff1801',
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        customdata: poleData.map(d => ({
            fullName: d.fullName,
            team: d.team
        })),
        hovertemplate: '<b>%{customdata.fullName}</b><br>' +
                      'Team: %{customdata.team}<br>' +
                      'Pole Positions: %{x}<br>' +
                      '<extra></extra>'
    };
    
    const layout = {
        title: {
            text: `${currentYear} Pole Positions`,
            font: { family: 'Russo One, sans-serif', size: 16, color: '#ffffff' }
        },
        xaxis: {
            title: 'Number of Poles',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            autorange: true
        },
        yaxis: {
            tickfont: { color: '#b8b8b8' },
            automargin: true,
            autorange: 'reversed' // This ensures descending order (highest at top)
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        margin: { l: 100, r: 40, t: 60, b: 60 },
        hovermode: 'y unified',
        hoverlabel: {
            bgcolor: 'rgba(21, 21, 30, 0.9)',
            bordercolor: '#ff1801',
            font: { 
                family: 'IBM Plex Sans, sans-serif', 
                color: '#ffffff',
                size: 14
            }
        }
    };
    
    Plotly.newPlot('polePositionsChart', [trace], layout, { responsive: true, displayModeBar: false });
}

/**
 * Update grid position progression chart
 */
function updateGridProgressionChart() {
    const season = seasonData[currentYear];
    const races = currentRaceId ? 
        season.races.filter(r => r.raceId === currentRaceId) : 
        season.races.sort((a, b) => a.round - b.round);
    
    // Get top drivers for the season or selected race
    const driverPositions = {};
    
    races.forEach(race => {
        const raceQualifying = season.qualifying.filter(q => q.raceId === race.raceId);
        raceQualifying.forEach(q => {
            if (!driverPositions[q.driverId]) {
                driverPositions[q.driverId] = [];
            }
            driverPositions[q.driverId].push({
                round: race.round,
                position: q.position,
                raceName: race.name
            });
        });
    });
    
    // Select top drivers by average position
    const driverAverages = Object.entries(driverPositions)
        .map(([driverId, positions]) => ({
            driverId,
            avgPosition: positions.reduce((sum, p) => sum + p.position, 0) / positions.length,
            positions
        }))
        .sort((a, b) => a.avgPosition - b.avgPosition)
        .slice(0, 8);
    
    const traces = driverAverages.map((data, index) => {
        const driver = driversMap[data.driverId];
        const color = getDriverColor(data.driverId);
        
        return {
            x: data.positions.map(p => `R${p.round}`),
            y: data.positions.map(p => p.position),
            type: 'scatter',
            mode: 'lines+markers',
            name: driver ? driver.surname : 'Unknown',
            line: {
                color: color,
                width: 2
            },
            marker: {
                color: color,
                size: 8
            },
            hovertemplate: '<b>%{fullData.name}</b><br>' +
                          'Round: %{x}<br>' +
                          'Grid Position: %{y}<br>' +
                          '<extra></extra>'
        };
    });
    
    const layout = {
        title: {
            text: currentRaceId ? 'Grid Position' : `${currentYear} Grid Position Progression`,
            font: { family: 'Russo One, sans-serif', size: 16, color: '#ffffff' }
        },
        xaxis: {
            title: 'Race Round',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
        },
        yaxis: {
            title: 'Grid Position',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            autorange: 'reversed',
            dtick: 1
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        }
    };
    
    Plotly.newPlot('gridProgressionChart', traces, layout, { responsive: true, displayModeBar: false });
}

/**
 * Update time distribution chart
 */
function updateTimeDistributionChart() {
    const season = seasonData[currentYear];
    const qualifying = currentRaceId ? 
        season.qualifying.filter(q => q.raceId === currentRaceId) :
        season.qualifying;
    
    const traces = [];
    
    if (season.hasKnockoutFormat) {
        // Modern format - show Q1/Q2/Q3 distributions
        const q1Times = [];
        const q2Times = [];
        const q3Times = [];
        
        qualifying.forEach(q => {
            if (q.q1 && q.q1 !== '\\N') q1Times.push(parseTime(q.q1));
            if (q.q2 && q.q2 !== '\\N') q2Times.push(parseTime(q.q2));
            if (q.q3 && q.q3 !== '\\N') q3Times.push(parseTime(q.q3));
        });
        
        if (q3Times.length > 0) {
            traces.push({
                y: q3Times,
                type: 'box',
                name: 'Q3',
                marker: { color: '#ff1801' },
                boxpoints: 'outliers',
                hovertemplate: 'Q3<br>Time: %{y:.3f}s<extra></extra>'
            });
        }
        
        if (q2Times.length > 0) {
            traces.push({
                y: q2Times,
                type: 'box',
                name: 'Q2',
                marker: { color: '#FFB800' },
                boxpoints: 'outliers',
                hovertemplate: 'Q2<br>Time: %{y:.3f}s<extra></extra>'
            });
        }
        
        if (q1Times.length > 0) {
            traces.push({
                y: q1Times,
                type: 'box',
                name: 'Q1',
                marker: { color: '#00D2BE' },
                boxpoints: 'outliers',
                hovertemplate: 'Q1<br>Time: %{y:.3f}s<extra></extra>'
            });
        }
    } else {
        // Classic format - show overall time distribution
        const times = [];
        qualifying.forEach(q => {
            const time = q.q3 || q.q2 || q.q1;
            if (time && time !== '\\N') {
                times.push(parseTime(time));
            }
        });
        
        if (times.length > 0) {
            traces.push({
                y: times,
                type: 'box',
                name: 'Qualifying Times',
                marker: { color: '#ff1801' },
                boxpoints: 'outliers',
                hovertemplate: 'Time: %{y:.3f}s<extra></extra>'
            });
        }
    }
    
    const layout = {
        title: {
            text: currentRaceId ? 'Session Time Distribution' : `${currentYear} Qualifying Time Distribution`,
            font: { family: 'Russo One, sans-serif', size: 18, color: '#ffffff' }
        },
        yaxis: {
            title: 'Lap Time (seconds)',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            tickformat: '.3f'
        },
        xaxis: {
            tickfont: { color: '#b8b8b8' }
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        showlegend: false,
        hovermode: 'closest',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { family: 'IBM Plex Sans, sans-serif', color: '#ffffff' }
        }
    };
    
    Plotly.newPlot('timeDistributionChart', traces, layout, { responsive: true, displayModeBar: false });
}

/**
 * Update team performance chart
 */
function updateTeamPerformanceChart() {
    const season = seasonData[currentYear];
    const qualifying = currentRaceId ? 
        season.qualifying.filter(q => q.raceId === currentRaceId) :
        season.qualifying;
    
    // Calculate average grid position by team
    const teamPositions = {};
    
    qualifying.forEach(q => {
        if (!teamPositions[q.constructorId]) {
            teamPositions[q.constructorId] = {
                positions: [],
                q3Count: 0,
                poleCount: 0
            };
        }
        teamPositions[q.constructorId].positions.push(q.position);
        if (season.hasKnockoutFormat && q.q3 && q.q3 !== '\\N') {
            teamPositions[q.constructorId].q3Count++;
        }
        if (q.position === 1) teamPositions[q.constructorId].poleCount++;
    });
    
    // Calculate statistics
    const teamData = Object.entries(teamPositions)
        .map(([constructorId, data]) => {
            const constructor = constructorsMap[constructorId];
            return {
                team: constructor ? constructor.name : 'Unknown',
                constructorRef: constructor?.ref,
                avgPosition: data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
                q3Percentage: season.hasKnockoutFormat ? 
                    (data.q3Count / data.positions.length) * 100 : null,
                poleCount: data.poleCount,
                totalSessions: data.positions.length
            };
        })
        .sort((a, b) => a.avgPosition - b.avgPosition)
        .slice(0, 10);
    
    const traces = [];
    
    // Average position trace
    const trace1 = {
        x: teamData.map(t => t.team),
        y: teamData.map(t => t.avgPosition),
        type: 'bar',
        name: 'Avg Grid Position',
        marker: {
            color: teamData.map(t => getTeamColor(t.constructorRef)),
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        yaxis: 'y',
        hovertemplate: '<b>%{x}</b><br>' +
                      'Avg Position: %{y:.2f}<br>' +
                      '<extra></extra>'
    };
    traces.push(trace1);
    
    // Q3 participation trace (only for knockout format)
    if (season.hasKnockoutFormat) {
        const trace2 = {
            x: teamData.map(t => t.team),
            y: teamData.map(t => t.q3Percentage),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Q3 Participation %',
            line: {
                color: '#ff1801',
                width: 3
            },
            marker: {
                size: 10,
                color: '#ff1801'
            },
            yaxis: 'y2',
            hovertemplate: '<b>%{x}</b><br>' +
                          'Q3 Participation: %{y:.1f}%<br>' +
                          '<extra></extra>'
        };
        traces.push(trace2);
    }
    
    const layout = {
        title: {
            text: currentRaceId ? 'Team Qualifying Performance' : `${currentYear} Team Qualifying Performance`,
            font: { family: 'Russo One, sans-serif', size: 18, color: '#ffffff' }
        },
        xaxis: {
            tickfont: { color: '#b8b8b8', size: 10 },
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Average Grid Position',
            titlefont: { color: '#ffffff' },
            tickfont: { color: '#b8b8b8' },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            autorange: 'reversed',
            side: 'left'
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
            borderwidth: 1,
            x: 0,
            y: 1
        },
        margin: {
            b: 120
        }
    };
    
    // Add second y-axis only for knockout format
    if (season.hasKnockoutFormat) {
        layout.yaxis2 = {
            title: 'Q3 Participation %',
            titlefont: { color: '#ff1801' },
            tickfont: { color: '#ff1801' },
            overlaying: 'y',
            side: 'right',
            range: [0, 100]
        };
    }
    
    Plotly.newPlot('teamPerformanceChart', traces, layout, { responsive: true, displayModeBar: false });
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
 * Get driver color based on their main team
 */
function getDriverColor(driverId) {
    const season = seasonData[currentYear];
    
    // Find most common constructor for driver
    const constructorCounts = {};
    season.qualifying.forEach(q => {
        if (q.driverId === driverId) {
            constructorCounts[q.constructorId] = (constructorCounts[q.constructorId] || 0) + 1;
        }
    });
    
    let mainConstructorId = null;
    let maxCount = 0;
    Object.entries(constructorCounts).forEach(([constructorId, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mainConstructorId = constructorId;
        }
    });
    
    if (mainConstructorId) {
        const constructor = constructorsMap[mainConstructorId];
        return getTeamColor(constructor?.ref);
    }
    
    return '#808080';
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
        Plotly.Plots.resize('polePositionsChart');
        Plotly.Plots.resize('teamPerformanceChart');
    }
});

console.log('F1 Qualifying Performance Dashboard loaded successfully');