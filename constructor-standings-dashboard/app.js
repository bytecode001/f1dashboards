/**
 * F1 Constructor Standings Dashboard
 * Main JavaScript Application
 * 
 * This application loads and visualizes Formula 1 constructor standings data
 * from 1950 to 2024 using CSV files and Plotly.js for interactive charts
 */

// Global variables to store data
let constructorsMap = {};        // Map of constructorId -> constructor info
let driversMap = {};            // Map of driverId -> driver info
let raceYearMap = {};           // Map of raceId -> year
let raceDetailsMap = {};        // Map of raceId -> race details
let standingsByRace = {};       // Raw standings data by raceId
let driverStandingsByRace = {}; // Raw driver standings data by raceId
let processedData = {};         // Processed data by year
let processedDriverData = {};   // Processed driver data by year
let selectedTeams = new Set();  // Currently selected teams for chart
let allYears = [];              // All available years
let resultsData = [];           // Raw results data for driver-team relationships

// File paths for CSV data
const DATA_PATH = 'data/';
const CSV_FILES = {
    constructors: 'constructors.csv',
    drivers: 'drivers.csv',
    races: 'races.csv',
    constructorStandings: 'constructor_standings.csv',
    driverStandings: 'driver_standings.csv',
    results: 'results.csv'  // Added results.csv to get driver-team relationships
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing F1 Dashboard...');
    
    try {
        await loadAllData();
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
        // Load constructors data
        const constructorsResponse = await fetch(`${DATA_PATH}${CSV_FILES.constructors}`);
        const constructorsCSV = await constructorsResponse.text();
        const constructorsData = Papa.parse(constructorsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Load drivers data
        const driversResponse = await fetch(`${DATA_PATH}${CSV_FILES.drivers}`);
        const driversCSV = await driversResponse.text();
        const driversData = Papa.parse(driversCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Load races data
        const racesResponse = await fetch(`${DATA_PATH}${CSV_FILES.races}`);
        const racesCSV = await racesResponse.text();
        const racesData = Papa.parse(racesCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Load constructor standings data
        const standingsResponse = await fetch(`${DATA_PATH}${CSV_FILES.constructorStandings}`);
        const standingsCSV = await standingsResponse.text();
        const standingsData = Papa.parse(standingsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Load driver standings data
        const driverStandingsResponse = await fetch(`${DATA_PATH}${CSV_FILES.driverStandings}`);
        const driverStandingsCSV = await driverStandingsResponse.text();
        const driverStandingsData = Papa.parse(driverStandingsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Load results data for driver-team relationships
        const resultsResponse = await fetch(`${DATA_PATH}${CSV_FILES.results}`);
        const resultsCSV = await resultsResponse.text();
        resultsData = Papa.parse(resultsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        
        // Check for parsing errors
        if (constructorsData.errors.length > 0) {
            console.warn('Constructors CSV parsing warnings:', constructorsData.errors);
        }
        if (driversData.errors.length > 0) {
            console.warn('Drivers CSV parsing warnings:', driversData.errors);
        }
        if (racesData.errors.length > 0) {
            console.warn('Races CSV parsing warnings:', racesData.errors);
        }
        if (standingsData.errors.length > 0) {
            console.warn('Standings CSV parsing warnings:', standingsData.errors);
        }
        if (driverStandingsData.errors.length > 0) {
            console.warn('Driver Standings CSV parsing warnings:', driverStandingsData.errors);
        }
        
        // Process the loaded data
        processConstructorsData(constructorsData.data);
        processDriversData(driversData.data);
        processRacesData(racesData.data);
        processStandingsData(standingsData.data);
        processDriverStandingsData(driverStandingsData.data);
        
        console.log(`Loaded data for ${allYears.length} years (${allYears[0]} - ${allYears[allYears.length - 1]})`);
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Process constructors data into a map
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
    console.log(`Processed ${Object.keys(constructorsMap).length} constructors`);
}

/**
 * Process drivers data into a map
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
    console.log(`Processed ${Object.keys(driversMap).length} drivers`);
}

/**
 * Process driver standings data
 */
function processDriverStandingsData(data) {
    // Store all driver standings by race
    data.forEach(standing => {
        if (!driverStandingsByRace[standing.raceId]) {
            driverStandingsByRace[standing.raceId] = [];
        }
        driverStandingsByRace[standing.raceId].push(standing);
    });
    
    // Aggregate by year for final standings
    const racesByYear = {};
    
    // Group races by year
    Object.keys(raceYearMap).forEach(raceId => {
        const year = raceYearMap[raceId];
        if (!racesByYear[year]) {
            racesByYear[year] = [];
        }
        racesByYear[year].push(parseInt(raceId));
    });
    
    // For each year, find the last race and get driver standings
    Object.keys(racesByYear).forEach(year => {
        const yearRaces = racesByYear[year].sort((a, b) => b - a);
        const lastRaceId = yearRaces[0];
        
        if (driverStandingsByRace[lastRaceId]) {
            processedDriverData[year] = {};
            
            driverStandingsByRace[lastRaceId].forEach(standing => {
                processedDriverData[year][standing.driverId] = {
                    driverId: standing.driverId,
                    points: standing.points || 0,
                    wins: standing.wins || 0,
                    position: standing.position || 999
                };
            });
        }
    });
    
    console.log(`Processed driver standings for ${Object.keys(processedDriverData).length} years`);
}

/**
 * Process races data to create year mapping
 */
function processRacesData(data) {
    const yearSet = new Set();
    
    data.forEach(race => {
        raceYearMap[race.raceId] = race.year;
        raceDetailsMap[race.raceId] = {
            name: race.name,
            date: race.date,
            round: race.round
        };
        // Only include years from 1958 onwards (first Constructors' Championship)
        if (race.year >= 1958) {
            yearSet.add(race.year);
        }
    });
    
    allYears = Array.from(yearSet).sort((a, b) => b - a);
}

/**
 * Process standings data and aggregate by year
 */
function processStandingsData(data) {
    // Store all standings data for race-by-race analysis
    standingsByRace = {};
    
    data.forEach(standing => {
        if (!standingsByRace[standing.raceId]) {
            standingsByRace[standing.raceId] = [];
        }
        standingsByRace[standing.raceId].push(standing);
    });
    
    // Aggregate by year for the standings table (final standings)
    const racesByYear = {};
    
    // Group races by year
    Object.keys(raceYearMap).forEach(raceId => {
        const year = raceYearMap[raceId];
        if (!racesByYear[year]) {
            racesByYear[year] = [];
        }
        racesByYear[year].push(parseInt(raceId));
    });
    
    // For each year, find the last race and get standings
    Object.keys(racesByYear).forEach(year => {
        const yearRaces = racesByYear[year].sort((a, b) => b - a);
        const lastRaceId = yearRaces[0]; // Highest raceId is typically the last race
        
        if (standingsByRace[lastRaceId]) {
            processedData[year] = {};
            
            standingsByRace[lastRaceId].forEach(standing => {
                processedData[year][standing.constructorId] = {
                    constructorId: standing.constructorId,
                    points: standing.points || 0,
                    wins: standing.wins || 0,
                    position: standing.position || 999
                };
            });
        }
    });
    
    console.log(`Processed standings for ${Object.keys(processedData).length} years`);
}

/**
 * Initialize UI components
 */
function initializeUI() {
    populateSeasonSelector();
    setupEventListeners();
    
    // Select the most recent year by default
    if (allYears.length > 0) {
        document.getElementById('seasonSelect').value = allYears[0];
        updateDashboard();
    }
}

/**
 * Populate the season selector dropdown
 */
function populateSeasonSelector() {
    const select = document.getElementById('seasonSelect');
    select.innerHTML = '';
    
    allYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year} Season`;
        select.appendChild(option);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Season selector change
    document.getElementById('seasonSelect').addEventListener('change', updateDashboard);
    
    // Chart type selector
    document.getElementById('chartType').addEventListener('change', updateChart);
    
    // Select/Clear all buttons
    document.getElementById('selectAllBtn').addEventListener('click', selectAllTeams);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllTeams);
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Show corresponding content
            const tabName = e.target.dataset.tab;
            if (tabName === 'constructors') {
                document.getElementById('constructorsTab').classList.add('active');
            } else if (tabName === 'drivers') {
                document.getElementById('driversTab').classList.add('active');
            }
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu')) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

/**
 * Update the entire dashboard when season changes
 */
function updateDashboard() {
    const selectedYear = document.getElementById('seasonSelect').value;
    if (!selectedYear) return;
    
    updateStandingsTable(selectedYear);
    updateDriversTable(selectedYear);
    updateTeamCheckboxes(selectedYear);
    updateStatistics(selectedYear);
    updateChart();
}

/**
 * Update the standings table for selected year
 */
function updateStandingsTable(year) {
    const yearData = processedData[year];
    if (!yearData) {
        console.warn(`No data available for year ${year}`);
        return;
    }
    
    // Update year display
    document.getElementById('selectedYear').textContent = year;
    
    // Sort constructors by position/points
    const sortedConstructors = Object.entries(yearData)
        .map(([constructorId, data]) => ({
            ...data,
            constructor: constructorsMap[constructorId]
        }))
        .filter(item => item.constructor) // Filter out any missing constructors
        .sort((a, b) => {
            // First sort by position if available
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            // Then by points (descending)
            return b.points - a.points;
        });
    
    // Update table body
    const tbody = document.getElementById('standingsTableBody');
    tbody.innerHTML = '';
    
    sortedConstructors.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="position">${index + 1}</td>
            <td class="constructor-name">${item.constructor.name}</td>
            <td class="points">${item.points}</td>
            <td class="wins">${item.wins}</td>
        `;
        
        // Add fade-in animation
        tr.style.opacity = '0';
        tr.classList.add('fade-in');
        setTimeout(() => {
            tr.style.opacity = '1';
        }, index * 50);
        
        tbody.appendChild(tr);
    });
}

/**
 * Update team checkboxes for the selected year
 */
function updateTeamCheckboxes(year) {
    const yearData = processedData[year];
    if (!yearData) return;
    
    const container = document.getElementById('teamCheckboxes');
    container.innerHTML = '';
    
    // Get constructors for this year and sort by points
    const yearConstructors = Object.entries(yearData)
        .map(([constructorId, data]) => ({
            ...data,
            constructor: constructorsMap[constructorId]
        }))
        .filter(item => item.constructor)
        .sort((a, b) => b.points - a.points);
    
    yearConstructors.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'team-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `team-${item.constructorId}`;
        checkbox.value = item.constructorId;
        
        // Select top 3 teams by default
        if (index < 3) {
            checkbox.checked = true;
            selectedTeams.add(item.constructorId.toString());
        }
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedTeams.add(e.target.value);
            } else {
                selectedTeams.delete(e.target.value);
            }
            updateChart();
        });
        
        const label = document.createElement('label');
        label.htmlFor = `team-${item.constructorId}`;
        label.textContent = `${item.constructor.name} (${item.points} pts)`;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * Update statistics for the selected year
 */
function updateStatistics(year) {
    const yearData = processedData[year];
    const driverYearData = processedDriverData[year];
    
    if (!yearData) return;
    
    // Calculate statistics
    const teams = Object.entries(yearData);
    const totalTeams = teams.length;
    
    // Find constructor champion
    const constructorChampion = teams
        .map(([constructorId, data]) => ({
            ...data,
            constructor: constructorsMap[constructorId]
        }))
        .filter(item => item.constructor)
        .sort((a, b) => b.points - a.points)[0];
    
    // Count total races
    const totalRaces = Object.keys(raceYearMap)
        .filter(raceId => raceYearMap[raceId] == year)
        .length;
    
    // Update UI
    document.getElementById('totalRaces').textContent = totalRaces || 'N/A';
    document.getElementById('totalTeams').textContent = totalTeams;
    document.getElementById('constructorChampion').textContent = constructorChampion?.constructor.name || 'N/A';
    
    // Find driver champion from actual data
    if (driverYearData) {
        const driverChampion = Object.entries(driverYearData)
            .map(([driverId, data]) => ({
                ...data,
                driver: driversMap[driverId]
            }))
            .filter(item => item.driver)
            .sort((a, b) => b.points - a.points)[0];
        
        if (driverChampion) {
            // Find the team for the driver champion by checking results data
            const championDriverId = driverChampion.driver.id;
            
            // Get all races for this year
            const yearRaceIds = Object.entries(raceYearMap)
                .filter(([raceId, raceYear]) => raceYear == year)
                .map(([raceId]) => parseInt(raceId));
            
            // Find the constructor for this driver in this year's races
            const driverResults = resultsData.filter(result => 
                result.driverId == championDriverId && 
                yearRaceIds.includes(result.raceId)
            );
            
            // Get the most common constructor (in case of mid-season switch)
            const constructorCounts = {};
            driverResults.forEach(result => {
                if (result.constructorId) {
                    constructorCounts[result.constructorId] = (constructorCounts[result.constructorId] || 0) + 1;
                }
            });
            
            // Find the constructor with most races
            let championConstructorId = null;
            let maxCount = 0;
            Object.entries(constructorCounts).forEach(([constructorId, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    championConstructorId = constructorId;
                }
            });
            
            const championName = driverChampion.driver.fullName;
            const team = championConstructorId && constructorsMap[championConstructorId] 
                ? constructorsMap[championConstructorId].name 
                : '';
            const championText = team ? `${championName} (${team})` : championName;
            document.getElementById('driverChampion').textContent = championText;
        } else {
            document.getElementById('driverChampion').textContent = 'N/A';
        }
    } else {
        // Fallback to hardcoded data for years without driver standings
        const driverChampions = {
            2024: 'Max Verstappen (Red Bull)',
            2023: 'Max Verstappen (Red Bull)',
            2022: 'Max Verstappen (Red Bull)',
            2021: 'Max Verstappen (Red Bull)',
            2020: 'Lewis Hamilton (Mercedes)',
            2019: 'Lewis Hamilton (Mercedes)',
            2018: 'Lewis Hamilton (Mercedes)',
            2017: 'Lewis Hamilton (Mercedes)',
            2016: 'Nico Rosberg (Mercedes)',
            2015: 'Lewis Hamilton (Mercedes)',
            2014: 'Lewis Hamilton (Mercedes)',
            2013: 'Sebastian Vettel (Red Bull)',
            2012: 'Sebastian Vettel (Red Bull)',
            2011: 'Sebastian Vettel (Red Bull)',
            2010: 'Sebastian Vettel (Red Bull)',
            2009: 'Jenson Button (Brawn)',
            2008: 'Lewis Hamilton (McLaren)',
            2007: 'Kimi Räikkönen (Ferrari)',
            2006: 'Fernando Alonso (Renault)',
            2005: 'Fernando Alonso (Renault)',
            2004: 'Michael Schumacher (Ferrari)',
            2003: 'Michael Schumacher (Ferrari)',
            2002: 'Michael Schumacher (Ferrari)',
            2001: 'Michael Schumacher (Ferrari)',
            2000: 'Michael Schumacher (Ferrari)',
            1999: 'Mika Häkkinen (McLaren)',
            1998: 'Mika Häkkinen (McLaren)',
            1997: 'Jacques Villeneuve (Williams)',
            1996: 'Damon Hill (Williams)',
            1995: 'Michael Schumacher (Benetton)',
            1994: 'Michael Schumacher (Benetton)',
            1993: 'Alain Prost (Williams)',
            1992: 'Nigel Mansell (Williams)',
            1991: 'Ayrton Senna (McLaren)',
            1990: 'Ayrton Senna (McLaren)',
            1989: 'Alain Prost (McLaren)',
            1988: 'Ayrton Senna (McLaren)',
            1987: 'Nelson Piquet (Williams)',
            1986: 'Alain Prost (McLaren)',
            1985: 'Alain Prost (McLaren)',
            1984: 'Niki Lauda (McLaren)',
            1983: 'Nelson Piquet (Brabham)',
            1982: 'Keke Rosberg (Williams)',
            1981: 'Nelson Piquet (Brabham)',
            1980: 'Alan Jones (Williams)',
            1979: 'Jody Scheckter (Ferrari)',
            1978: 'Mario Andretti (Lotus)',
            1977: 'Niki Lauda (Ferrari)',
            1976: 'James Hunt (McLaren)',
            1975: 'Niki Lauda (Ferrari)',
            1974: 'Emerson Fittipaldi (McLaren)',
            1973: 'Jackie Stewart (Tyrrell)',
            1972: 'Emerson Fittipaldi (Lotus)',
            1971: 'Jackie Stewart (Tyrrell)',
            1970: 'Jochen Rindt (Lotus)',
            1969: 'Jackie Stewart (Matra)',
            1968: 'Graham Hill (Lotus)',
            1967: 'Denny Hulme (Brabham)',
            1966: 'Jack Brabham (Brabham)',
            1965: 'Jim Clark (Lotus)',
            1964: 'John Surtees (Ferrari)',
            1963: 'Jim Clark (Lotus)',
            1962: 'Graham Hill (BRM)',
            1961: 'Phil Hill (Ferrari)',
            1960: 'Jack Brabham (Cooper)',
            1959: 'Jack Brabham (Cooper)',
            1958: 'Mike Hawthorn (Ferrari)'
        };
        
        document.getElementById('driverChampion').textContent = driverChampions[year] || 'N/A';
    }
}

/**
 * Update the Plotly chart
 */
function updateChart() {
    if (selectedTeams.size === 0) {
        Plotly.purge('plotly-chart');
        return;
    }
    
    const selectedYear = document.getElementById('seasonSelect').value;
    if (!selectedYear) return;
    
    const chartType = document.getElementById('chartType').value;
    const traces = [];
    
    // Define team colors
    const teamColors = {
        'ferrari': '#DC0000',
        'mercedes': '#00D2BE',
        'red_bull': '#0600EF',
        'mclaren': '#FF8700',
        'alpine': '#0090FF',
        'alphatauri': '#2B4562',
        'aston_martin': '#006F62',
        'williams': '#005AFF',
        'alfa': '#900000',
        'haas': '#787878',
        'renault': '#FFF500',
        'force_india': '#F596C8',
        'racing_point': '#F596C8',
        'toro_rosso': '#469BFF',
        'sauber': '#9B0000',
        'lotus_f1': '#FFB800',
        'manor': '#FF0000',
        'jordan': '#FFA100',
        'toyota': '#CC0000',
        'bmw_sauber': '#293276',
        'brawn': '#80FF00',
        'honda': '#FFFFFF',
        'bar': '#FFFFFF',
        'jaguar': '#0A5C2F',
        'stewart': '#FFFFFF',
        'minardi': '#000000',
        'arrows': '#FA9E04',
        'prost': '#0385C6',
        'benetton': '#00BF00',
        'tyrrell': '#0000FF',
        'ligier': '#1E6EB8',
        'brabham': '#00963A',
        'march': '#5A258C',
        'shadow': '#000000',
        'wolf': '#FFD700',
        'hesketh': '#DC143C',
        'ensign': '#FF6347',
        'penske': '#FFD700',
        'copersucar': '#90EE90',
        'fittipaldi': '#FFCC00'
    };
    
    // Get all races for the selected year
    const yearRaces = Object.entries(raceYearMap)
        .filter(([raceId, year]) => year == selectedYear)
        .map(([raceId, year]) => parseInt(raceId))
        .sort((a, b) => {
            // Sort by round number if available
            const roundA = raceDetailsMap[a]?.round || 0;
            const roundB = raceDetailsMap[b]?.round || 0;
            return roundA - roundB;
        });
    
    if (yearRaces.length === 0) {
        console.warn(`No races found for year ${selectedYear}`);
        return;
    }
    
    // For each selected team, create a trace
    selectedTeams.forEach(constructorId => {
        const constructor = constructorsMap[constructorId];
        if (!constructor) return;
        
        const points = [];
        const wins = [];
        const hoverText = [];
        const raceNames = [];
        
        yearRaces.forEach((raceId, index) => {
            const raceStandings = standingsByRace[raceId];
            if (!raceStandings) {
                points.push(null);
                wins.push(null);
                hoverText.push('No data');
                raceNames.push(`Race ${index + 1}`);
                return;
            }
            
            const teamStanding = raceStandings.find(s => s.constructorId == constructorId);
            const raceDetails = raceDetailsMap[raceId];
            const raceName = raceDetails?.name || `Race ${index + 1}`;
            
            if (teamStanding) {
                points.push(teamStanding.points || 0);
                wins.push(teamStanding.wins || 0);
                hoverText.push(
                    `<b>${constructor.name}</b><br>` +
                    `${raceName}<br>` +
                    `Round: ${raceDetails?.round || index + 1}<br>` +
                    `Points: ${teamStanding.points || 0}<br>` +
                    `Wins: ${teamStanding.wins || 0}<br>` +
                    `Position: ${teamStanding.position || 'N/A'}`
                );
            } else {
                // Team didn't participate in this race
                points.push(null);
                wins.push(null);
                hoverText.push(`<b>${constructor.name}</b><br>${raceName}<br>Did not participate`);
            }
            
            raceNames.push(raceName);
        });
        
        // Only add trace if team has data for this year
        if (points.some(p => p !== null)) {
            // Determine color
            const teamRef = constructor.ref.toLowerCase();
            const color = teamColors[teamRef] || `hsl(${Math.random() * 360}, 70%, 50%)`;
            
            const trace = {
                x: raceNames,
                y: points,
                type: 'scatter',
                mode: chartType === 'area' ? 'lines' : 'lines+markers',
                name: constructor.name,
                line: {
                    color: color,
                    width: 3
                },
                marker: {
                    size: 8,
                    color: color
                },
                text: hoverText,
                hovertemplate: '%{text}<extra></extra>',
                connectgaps: false
            };
            
            if (chartType === 'area') {
                trace.fill = 'tozeroy';
                trace.fillcolor = color + '30'; // Add transparency
            }
            
            traces.push(trace);
        }
    });
    
    const layout = {
        title: {
            text: `Constructor Points Progress - ${selectedYear} Season`,
            font: {
                family: 'Russo One, sans-serif',
                size: 24,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Grand Prix',
            tickfont: { color: '#b8b8b8', size: 10 },
            titlefont: { color: '#ffffff', size: 14 },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zerolinecolor: 'rgba(255, 255, 255, 0.2)',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Points',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff', size: 14 },
            gridcolor: 'rgba(255, 255, 255, 0.1)',
            zerolinecolor: 'rgba(255, 255, 255, 0.2)'
        },
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: {
                family: 'IBM Plex Sans, sans-serif',
                color: '#ffffff'
            }
        },
        legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1,
            x: 1,
            y: 1,
            xanchor: 'right',
            yanchor: 'top'
        },
        margin: {
            l: 60,
            r: 30,
            t: 80,
            b: 100 // More space for rotated labels
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: `f1_standings_${selectedYear}`,
            height: 800,
            width: 1400,
            scale: 2
        }
    };
    
    Plotly.newPlot('plotly-chart', traces, layout, config);
}

/**
 * Update drivers standings table
 */
function updateDriversTable(year) {
    const driverYearData = processedDriverData[year];
    if (!driverYearData) {
        console.warn(`No driver data available for year ${year}`);
        return;
    }
    
    // Get all races for this year to find driver-team relationships
    const yearRaceIds = Object.entries(raceYearMap)
        .filter(([raceId, raceYear]) => raceYear == year)
        .map(([raceId]) => parseInt(raceId));
    
    // Sort drivers by position/points
    const sortedDrivers = Object.entries(driverYearData)
        .map(([driverId, data]) => ({
            ...data,
            driver: driversMap[driverId]
        }))
        .filter(item => item.driver)
        .sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return b.points - a.points;
        });
    
    // Update table body
    const tbody = document.getElementById('driversTableBody');
    tbody.innerHTML = '';
    
    sortedDrivers.forEach((item, index) => {
        // Find the team for this driver
        const driverResults = resultsData.filter(result => 
            result.driverId == item.driver.id && 
            yearRaceIds.includes(result.raceId)
        );
        
        // Get the most common constructor
        const constructorCounts = {};
        driverResults.forEach(result => {
            if (result.constructorId) {
                constructorCounts[result.constructorId] = (constructorCounts[result.constructorId] || 0) + 1;
            }
        });
        
        let teamName = 'N/A';
        let maxCount = 0;
        Object.entries(constructorCounts).forEach(([constructorId, count]) => {
            if (count > maxCount) {
                maxCount = count;
                if (constructorsMap[constructorId]) {
                    teamName = constructorsMap[constructorId].name;
                }
            }
        });
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="position">${index + 1}</td>
            <td class="driver-name">${item.driver.fullName}</td>
            <td class="team-name">${teamName}</td>
            <td class="points">${item.points}</td>
            <td class="wins">${item.wins}</td>
        `;
        
        // Add fade-in animation
        tr.style.opacity = '0';
        tr.classList.add('fade-in');
        setTimeout(() => {
            tr.style.opacity = '1';
        }, index * 30);
        
        tbody.appendChild(tr);
    });
}

/**
 * Select all teams
 */
function selectAllTeams() {
    const checkboxes = document.querySelectorAll('.team-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedTeams.add(checkbox.value);
    });
    updateChart();
}

/**
 * Clear all team selections
 */
function clearAllTeams() {
    const checkboxes = document.querySelectorAll('.team-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    selectedTeams.clear();
    updateChart();
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
    // You could implement a more sophisticated error display here
    alert(message);
}

/**
 * Handle window resize for responsive charts
 */
window.addEventListener('resize', () => {
    if (selectedTeams.size > 0) {
        Plotly.Plots.resize('plotly-chart');
    }
});

/**
 * Export functionality for data
 */
function exportData(format = 'csv') {
    const selectedYear = document.getElementById('seasonSelect').value;
    if (!selectedYear || !processedData[selectedYear]) return;
    
    const yearData = processedData[selectedYear];
    const rows = [['Position', 'Constructor', 'Points', 'Wins']];
    
    Object.entries(yearData)
        .map(([constructorId, data]) => ({
            ...data,
            constructor: constructorsMap[constructorId]
        }))
        .filter(item => item.constructor)
        .sort((a, b) => b.points - a.points)
        .forEach((item, index) => {
            rows.push([
                index + 1,
                item.constructor.name,
                item.points,
                item.wins
            ]);
        });
    
    if (format === 'csv') {
        const csv = rows.map(row => row.join(',')).join('\n');
        downloadFile(`f1_standings_${selectedYear}.csv`, csv, 'text/csv');
    }
}

/**
 * Download file utility
 */
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + A to select all teams
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        selectAllTeams();
    }
    // Ctrl/Cmd + D to deselect all teams
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        clearAllTeams();
    }
});

console.log('F1 Dashboard JavaScript loaded successfully');