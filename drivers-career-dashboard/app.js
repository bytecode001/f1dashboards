/**
 * F1 Drivers Career Dashboard
 * Main JavaScript Application
 * 
 * This application loads and visualizes Formula 1 driver career data
 * using CSV files and Plotly.js for interactive charts
 */

// Global variables to store data
let driversMap = {};            // Map of driverId -> driver info
let constructorsMap = {};       // Map of constructorId -> constructor info
let resultsData = [];           // Raw results data
let driverStandingsData = [];   // Raw driver standings data
let qualifyingData = [];        // Raw qualifying data
let racesMap = {};              // Map of raceId -> race info
let currentDriver = null;       // Currently selected driver

// File paths for CSV data
const DATA_PATH = 'data/';
const CSV_FILES = {
    drivers: 'drivers.csv',
    constructors: 'constructors.csv',
    results: 'results.csv',
    driverStandings: 'driver_standings.csv',
    qualifying: 'qualifying.csv',
    races: 'races.csv'
};

// Team colors mapping
const TEAM_COLORS = {
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
    'minardi': '#191919',
    'arrows': '#FA9E04',
    'prost': '#0385C6',
    'benetton': '#00BF00',
    'tyrrell': '#0000FF',
    'ligier': '#1E6EB8',
    'brabham': '#00963A',
    'lotus': '#FFB800',
    'march': '#5A258C',
    'shadow': '#000000',
    'wolf': '#FFD700',
    'hesketh': '#DC143C',
    'ensign': '#FF6347',
    'penske': '#FFD700',
    'copersucar': '#90EE90',
    'fittipaldi': '#FFCC00'
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing F1 Drivers Dashboard...');
    
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
        // Load all CSV files in parallel
        const [
            driversResponse,
            constructorsResponse,
            resultsResponse,
            standingsResponse,
            qualifyingResponse,
            racesResponse
        ] = await Promise.all([
            fetch(`${DATA_PATH}${CSV_FILES.drivers}`),
            fetch(`${DATA_PATH}${CSV_FILES.constructors}`),
            fetch(`${DATA_PATH}${CSV_FILES.results}`),
            fetch(`${DATA_PATH}${CSV_FILES.driverStandings}`),
            fetch(`${DATA_PATH}${CSV_FILES.qualifying}`),
            fetch(`${DATA_PATH}${CSV_FILES.races}`)
        ]);
        
        // Parse CSV data
        const driversCSV = await driversResponse.text();
        const driversData = Papa.parse(driversCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        const constructorsCSV = await constructorsResponse.text();
        const constructorsData = Papa.parse(constructorsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        const resultsCSV = await resultsResponse.text();
        resultsData = Papa.parse(resultsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        
        const standingsCSV = await standingsResponse.text();
        driverStandingsData = Papa.parse(standingsCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        
        const qualifyingCSV = await qualifyingResponse.text();
        qualifyingData = Papa.parse(qualifyingCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        
        const racesCSV = await racesResponse.text();
        const racesData = Papa.parse(racesCSV, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        // Process the loaded data
        processDriversData(driversData.data);
        processConstructorsData(constructorsData.data);
        processRacesData(racesData.data);
        
        console.log('Data loading complete');
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Process drivers data into a map
 */
function processDriversData(data) {
    data.forEach(driver => {
        driversMap[driver.driverId] = {
            id: driver.driverId,
            ref: driver.driverRef,
            number: driver.number || '',
            code: driver.code || '',
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
 * Process races data into a map
 */
function processRacesData(data) {
    data.forEach(race => {
        racesMap[race.raceId] = {
            id: race.raceId,
            year: race.year,
            round: race.round,
            name: race.name,
            date: race.date,
            circuitId: race.circuitId
        };
    });
    console.log(`Processed ${Object.keys(racesMap).length} races`);
}

/**
 * Initialize UI components
 */
function initializeUI() {
    setupDriverSearch();
    setupEventListeners();
}

/**
 * Setup driver search functionality
 */
function setupDriverSearch() {
    const searchInput = document.getElementById('driverSearch');
    const searchResults = document.getElementById('searchResults');
    const toggleBtn = document.getElementById('toggleListBtn');
    const quickFilters = document.getElementById('quickFilters');
    
    // Create searchable list of drivers with additional data
    const driversList = Object.values(driversMap).map(driver => {
        // Get active years for the driver
        const driverResults = resultsData.filter(r => r.driverId == driver.id);
        const years = [...new Set(driverResults.map(r => racesMap[r.raceId]?.year))].filter(Boolean);
        const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : '';
        
        // Check if champion
        const driverStands = driverStandingsData.filter(s => s.driverId == driver.id);
        const championYears = [];
        
        // Group standings by year and find championships
        const standingsByYear = {};
        driverStands.forEach(standing => {
            const race = racesMap[standing.raceId];
            if (!race) return;
            
            if (!standingsByYear[race.year] || race.round > standingsByYear[race.year].round) {
                standingsByYear[race.year] = {
                    round: race.round,
                    position: standing.position
                };
            }
        });
        
        Object.entries(standingsByYear).forEach(([year, data]) => {
            if (data.position === 1) championYears.push(year);
        });
        
        const isActive = years.some(y => y >= 2020);
        
        return {
            ...driver,
            yearRange,
            years,
            championYears,
            isChampion: championYears.length > 0,
            isActive,
            searchText: `${driver.fullName} ${driver.nationality} ${yearRange}`.toLowerCase()
        };
    });
    
    // Sort by surname
    driversList.sort((a, b) => a.surname.localeCompare(b.surname));
    
    let currentFilter = 'all';
    let isListOpen = false;
    
    // Function to show drivers based on filter
    function showDriversList(filter = 'all', searchQuery = '') {
        let filteredDrivers = driversList;
        
        // Apply filter
        if (filter === 'champions') {
            filteredDrivers = driversList.filter(d => d.isChampion);
        } else if (filter === 'active') {
            filteredDrivers = driversList.filter(d => d.isActive);
        }
        
        // Apply search query
        if (searchQuery) {
            filteredDrivers = filteredDrivers.filter(driver => 
                driver.searchText.includes(searchQuery.toLowerCase())
            );
        }
        
        // Limit results if searching
        if (searchQuery) {
            filteredDrivers = filteredDrivers.slice(0, 10);
        }
        
        // Generate HTML
        if (filteredDrivers.length > 0) {
            const headerHtml = !searchQuery && filter === 'all' 
                ? '<div class="results-header">All Drivers (A-Z by surname)</div>'
                : searchQuery 
                ? ''
                : `<div class="results-header">${filter.charAt(0).toUpperCase() + filter.slice(1)} Drivers</div>`;
            
            const driversHtml = filteredDrivers.map(driver => {
                const initials = driver.forename.charAt(0) + driver.surname.charAt(0);
                const championBadge = driver.championYears.length > 0 
                    ? `<span class="champion-badge">🏆 ${driver.championYears.length}x</span>`
                    : '';
                
                return `
                    <div class="search-result-item" data-driver-id="${driver.id}">
                        <div class="driver-avatar-small">
                            <span>${initials}</span>
                        </div>
                        <div class="driver-info-small">
                            <div class="driver-name">${driver.fullName}</div>
                            <div class="driver-meta">
                                <span>${driver.nationality}</span>
                                <span>•</span>
                                <span>${driver.yearRange}</span>
                                ${championBadge}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            searchResults.innerHTML = headerHtml + driversHtml;
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No drivers found</div>';
            searchResults.classList.add('active');
        }
    }
    
    // Toggle button handler
    toggleBtn.addEventListener('click', () => {
        isListOpen = !isListOpen;
        const icon = toggleBtn.querySelector('.toggle-icon');
        
        if (isListOpen) {
            icon.classList.add('rotated');
            showDriversList(currentFilter);
            searchInput.focus();
        } else {
            icon.classList.remove('rotated');
            searchResults.classList.remove('active');
        }
    });
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length >= 2) {
            showDriversList(currentFilter, query);
        } else if (isListOpen) {
            showDriversList(currentFilter);
        } else {
            searchResults.classList.remove('active');
        }
    });
    
    // Focus handler - show suggestions based on current filter
    searchInput.addEventListener('focus', (e) => {
        if (!e.target.value && !isListOpen) {
            // Show suggestions based on current filter
            showDriversList(currentFilter);
        }
    });
    
    // Quick filter handlers
    quickFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Remove active class from all buttons
            quickFilters.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Update current filter
            currentFilter = e.target.dataset.filter;
            
            // Show filtered list if open or if searching
            if (isListOpen || searchInput.value) {
                showDriversList(currentFilter, searchInput.value);
            }
        }
    });
    
    // Click handler for search results
    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item && item.dataset.driverId) {
            selectDriver(parseInt(item.dataset.driverId));
            searchInput.value = '';
            searchResults.classList.remove('active');
            isListOpen = false;
            document.querySelector('.toggle-icon').classList.remove('rotated');
        }
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.driver-selector')) {
            searchResults.classList.remove('active');
            if (isListOpen) {
                isListOpen = false;
                document.querySelector('.toggle-icon').classList.remove('rotated');
            }
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
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
 * Select and display driver data
 */
async function selectDriver(driverId) {
    currentDriver = driversMap[driverId];
    if (!currentDriver) return;
    
    console.log(`Selected driver: ${currentDriver.fullName}`);
    
    // Show loading state
    showDriverSections();
    
    // Process driver data
    const driverData = await processDriverData(driverId);
    
    // Update UI
    updateDriverProfile(driverData);
    updateCareerStats(driverData);
    updateTeamsTimeline(driverData);
    updateCharts(driverData);
    updateSeasonsTable(driverData);
}

/**
 * Process all data for selected driver
 */
async function processDriverData(driverId) {
    // Get all results for this driver
    const driverResults = resultsData.filter(r => r.driverId == driverId);
    
    // Get all standings for this driver
    const driverStandings = driverStandingsData.filter(s => s.driverId == driverId);
    
    // Get all qualifying for this driver
    const driverQualifying = qualifyingData.filter(q => q.driverId == driverId);
    
    // Process data by season
    const seasonData = {};
    const teamsData = {};
    
    driverResults.forEach(result => {
        const race = racesMap[result.raceId];
        if (!race) return;
        
        const year = race.year;
        const constructor = constructorsMap[result.constructorId];
        
        if (!seasonData[year]) {
            seasonData[year] = {
                year,
                races: [],
                wins: 0,
                podiums: 0,
                points: 0,
                dnfs: 0,
                poles: 0,
                teams: new Set(),
                position: null
            };
        }
        
        // Add race result
        seasonData[year].races.push(result);
        
        // Count wins and podiums
        if (result.position === 1) seasonData[year].wins++;
        if (result.position <= 3 && result.position >= 1) seasonData[year].podiums++;
        
        // Count DNFs - only REAL retirements during the race
        // Based on the debug output:
        // - statusId 3 (Accident) with position \N = DNF ✓
        // - statusId 11-19 with valid position = Lapped but finished, NOT DNF ✗
        // - statusId 31 (Retired) with position 19 = Classified, NOT DNF ✗
        // - statusId 54 (Withdrew) with position \N = DNF ✓
        // - statusId 130 with position \N = Probably DNS/DNQ, NOT DNF ✗
        
        // A true DNF must have:
        // 1. No valid finishing position (null, 0, or \N)
        // 2. A statusId indicating retirement (not lapped, not DNS)
        
        const position = result.position;
        const statusId = parseInt(result.statusId);
        
        // Check if driver has no valid finishing position
        const noValidPosition = !position || position == 0 || position === '\\N' || position === null;
        
        // List of statusIds that are true DNFs (when combined with no position)
        const dnfStatusIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129];
        
        // Count as DNF only if no valid position AND statusId indicates retirement
        if (noValidPosition && dnfStatusIds.includes(statusId)) {
            seasonData[year].dnfs++;
        }
        
        // Add team
        if (constructor) {
            seasonData[year].teams.add(constructor.name);
            
            // Track teams data
            if (!teamsData[constructor.id]) {
                teamsData[constructor.id] = {
                    constructor,
                    races: 0,
                    wins: 0,
                    podiums: 0,
                    years: new Set()
                };
            }
            teamsData[constructor.id].races++;
            if (result.position === 1) teamsData[constructor.id].wins++;
            if (result.position <= 3 && result.position >= 1) teamsData[constructor.id].podiums++;
            teamsData[constructor.id].years.add(year);
        }
    });
    
    // Add qualifying data with better pole position detection
    driverQualifying.forEach(qual => {
        const race = racesMap[qual.raceId];
        if (!race) return;
        
        const year = race.year;
        if (seasonData[year]) {
            // Check multiple conditions for pole position
            // Using == to catch both 1 and "1"
            if (qual.position == 1) {
                seasonData[year].poles++;
            }
        }
    });
    
    // Alternative method: count poles from race results where grid position = 1
    driverResults.forEach(result => {
        const race = racesMap[result.raceId];
        if (!race) return;
        
        const year = race.year;
        if (seasonData[year] && result.grid == 1) {
            // Check if we haven't already counted this pole from qualifying
            const qualCount = driverQualifying.filter(q => 
                q.raceId === result.raceId && q.driverId === driverId && q.position == 1
            ).length;
            
            if (qualCount === 0) {
                // This is a pole not counted from qualifying data
                seasonData[year].poles++;
            }
        }
    });
    
    // Add final standings data
    const standingsByYear = {};
    driverStandings.forEach(standing => {
        const race = racesMap[standing.raceId];
        if (!race) return;
        
        if (!standingsByYear[race.year] || race.round > standingsByYear[race.year].round) {
            standingsByYear[race.year] = {
                round: race.round,
                position: standing.position,
                points: standing.points,
                wins: standing.wins
            };
        }
    });
    
    // Merge standings data
    Object.keys(standingsByYear).forEach(year => {
        if (seasonData[year]) {
            seasonData[year].position = standingsByYear[year].position;
            seasonData[year].points = standingsByYear[year].points;
        }
    });
    
    // Calculate career totals
    const careerStats = {
        championships: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        points: 0,
        races: driverResults.length,
        seasons: Object.keys(seasonData).length,
        teams: Object.keys(teamsData).length
    };
    
    Object.values(seasonData).forEach(season => {
        if (season.position === 1) careerStats.championships++;
        careerStats.wins += season.wins;
        careerStats.podiums += season.podiums;
        careerStats.poles += season.poles;
        careerStats.points += season.points;
    });
    
    return {
        driver: currentDriver,
        seasonData,
        teamsData,
        careerStats
    };
}

/**
 * Show driver sections
 */
function showDriverSections() {
    document.getElementById('noDriverMessage').style.display = 'none';
    document.getElementById('driverProfile').style.display = 'block';
    document.getElementById('careerStats').style.display = 'block';
    document.getElementById('teamsSection').style.display = 'block';
    document.getElementById('chartsContainer').style.display = 'block';
    document.getElementById('seasonsTableContainer').style.display = 'block';
}

/**
 * Update driver profile section
 */
function updateDriverProfile(data) {
    const { driver, seasonData } = data;
    
    // Get initials
    const initials = driver.forename.charAt(0) + driver.surname.charAt(0);
    document.getElementById('driverInitials').textContent = initials;
    
    // Update driver info
    document.getElementById('driverName').textContent = driver.fullName;
    document.getElementById('driverNationality').textContent = driver.nationality;
    document.getElementById('driverNumber').textContent = driver.number ? `#${driver.number}` : '';
    document.getElementById('driverCode').textContent = driver.code || '';
    
    // Update career span
    const years = Object.keys(seasonData).map(Number);
    const careerSpan = years.length > 0 
        ? `Active: ${Math.min(...years)} - ${Math.max(...years)}`
        : 'No race data';
    document.getElementById('careerSpan').textContent = careerSpan;
}

/**
 * Update career statistics
 */
function updateCareerStats(data) {
    const { careerStats } = data;
    
    document.getElementById('totalChampionships').textContent = careerStats.championships;
    document.getElementById('totalWins').textContent = careerStats.wins;
    document.getElementById('totalPodiums').textContent = careerStats.podiums;
    document.getElementById('totalPoles').textContent = careerStats.poles;
    document.getElementById('totalPoints').textContent = careerStats.points.toFixed(1);
    document.getElementById('totalRaces').textContent = careerStats.races;
}

/**
 * Update teams timeline
 */
function updateTeamsTimeline(data) {
    const { teamsData } = data;
    const timeline = document.getElementById('teamsTimeline');
    
    // Sort teams by first year
    const sortedTeams = Object.values(teamsData).sort((a, b) => {
        const aMin = Math.min(...Array.from(a.years));
        const bMin = Math.min(...Array.from(b.years));
        return aMin - bMin;
    });
    
    timeline.innerHTML = sortedTeams.map(team => {
        const years = Array.from(team.years).sort((a, b) => a - b);
        const yearRanges = getYearRanges(years);
        
        return `
            <div class="team-badge" style="border-color: ${getTeamColor(team.constructor.ref)}">
                <div class="team-name">${team.constructor.name}</div>
                <div class="team-years">${yearRanges}</div>
                <div class="team-stats">${team.races} races • ${team.wins} wins</div>
            </div>
        `;
    }).join('');
}

/**
 * Get year ranges from array of years
 */
function getYearRanges(years) {
    if (years.length === 0) return '';
    if (years.length === 1) return years[0].toString();
    
    const ranges = [];
    let start = years[0];
    let end = years[0];
    
    for (let i = 1; i < years.length; i++) {
        if (years[i] === end + 1) {
            end = years[i];
        } else {
            ranges.push(start === end ? start.toString() : `${start}-${end}`);
            start = end = years[i];
        }
    }
    
    ranges.push(start === end ? start.toString() : `${start}-${end}`);
    return ranges.join(', ');
}

/**
 * Get team color
 */
function getTeamColor(teamRef) {
    return TEAM_COLORS[teamRef.toLowerCase()] || '#666666';
}

/**
 * Update all charts
 */
function updateCharts(data) {
    updatePointsChart(data);
    updateWinsPodumsChart(data);
    updateTeamsChart(data);
    updatePositionChart(data);
}

/**
 * Update points progress chart
 */
function updatePointsChart(data) {
    const { seasonData } = data;
    const years = Object.keys(seasonData).sort((a, b) => a - b);
    
    // Get team for each year
    const teamsByYear = {};
    years.forEach(year => {
        const teams = Array.from(seasonData[year].teams);
        teamsByYear[year] = teams.join(', ');
    });
    
    const trace = {
        x: years,
        y: years.map(year => seasonData[year].points),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Points',
        line: {
            color: '#ff1801',
            width: 3
        },
        marker: {
            size: 10,
            color: '#ff1801'
        },
        customdata: years.map(year => ({
            team: teamsByYear[year],
            position: seasonData[year].position || 'N/A'
        })),
        hovertemplate: '<b>%{x}</b><br>' +
                      'Points: %{y}<br>' +
                      'Team: %{customdata.team}<br>' +
                      'Position: %{customdata.position}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Career Points Progression',
            font: {
                family: 'Russo One, sans-serif',
                size: 20,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Season',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
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
            font: { color: '#ffffff' }
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('pointsChart', [trace], layout, config);
}

/**
 * Update wins and podiums chart
 */
function updateWinsPodumsChart(data) {
    const { seasonData } = data;
    const years = Object.keys(seasonData).sort((a, b) => a - b);
    
    // Get team for each year
    const teamsByYear = {};
    years.forEach(year => {
        const teams = Array.from(seasonData[year].teams);
        teamsByYear[year] = teams.join(', ');
    });
    
    const winsTrace = {
        x: years,
        y: years.map(year => seasonData[year].wins),
        type: 'bar',
        name: 'Wins',
        marker: {
            color: '#ff1801'
        },
        customdata: years.map(year => teamsByYear[year]),
        hovertemplate: '<b>%{x}</b><br>Wins: %{y}<br>Team: %{customdata}<extra></extra>'
    };
    
    const podiumsTrace = {
        x: years,
        y: years.map(year => seasonData[year].podiums),
        type: 'bar',
        name: 'Podiums',
        marker: {
            color: '#ff6b6b'
        },
        customdata: years.map(year => teamsByYear[year]),
        hovertemplate: '<b>%{x}</b><br>Podiums: %{y}<br>Team: %{customdata}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Wins and Podiums by Season',
            font: {
                family: 'Russo One, sans-serif',
                size: 20,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Season',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
        },
        yaxis: {
            title: 'Count',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
        },
        barmode: 'group',
        plot_bgcolor: 'rgba(21, 21, 30, 0.5)',
        paper_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: '#15151e',
            bordercolor: '#ff1801',
            font: { color: '#ffffff' }
        },
        legend: {
            font: { color: '#ffffff' },
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('winsPodumsChart', [winsTrace, podiumsTrace], layout, config);
}

/**
 * Update teams distribution chart
 */
function updateTeamsChart(data) {
    const { teamsData } = data;
    
    const teams = Object.values(teamsData);
    const labels = teams.map(t => t.constructor.name);
    const values = teams.map(t => t.races);
    const colors = teams.map(t => getTeamColor(t.constructor.ref));
    
    const trace = {
        labels: labels,
        values: values,
        type: 'pie',
        textinfo: 'label+percent',
        textposition: 'outside',
        marker: {
            colors: colors,
            line: {
                color: '#15151e',
                width: 2
            }
        },
        hovertemplate: '<b>%{label}</b><br>Races: %{value}<br>%{percent}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Career Races by Team',
            font: {
                family: 'Russo One, sans-serif',
                size: 20,
                color: '#ffffff'
            }
        },
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: {
            color: '#ffffff'
        },
        showlegend: true,
        legend: {
            font: { color: '#ffffff', size: 10 },
            bgcolor: 'rgba(21, 21, 30, 0.8)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('teamsChart', [trace], layout, config);
}

/**
 * Update championship position chart
 */
function updatePositionChart(data) {
    const { seasonData } = data;
    const years = Object.keys(seasonData).sort((a, b) => a - b);
    
    // Get team for each year
    const teamsByYear = {};
    years.forEach(year => {
        const teams = Array.from(seasonData[year].teams);
        teamsByYear[year] = teams.join(', ');
    });
    
    const positions = years.map(year => seasonData[year].position || null);
    
    const trace = {
        x: years,
        y: positions,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Championship Position',
        line: {
            color: '#00D2BE',
            width: 3
        },
        marker: {
            size: 10,
            color: positions.map(p => p === 1 ? '#ff1801' : '#00D2BE')
        },
        customdata: years.map(year => ({
            team: teamsByYear[year],
            points: seasonData[year].points
        })),
        hovertemplate: '<b>%{x}</b><br>' +
                      'Position: %{y}<br>' +
                      'Team: %{customdata.team}<br>' +
                      'Points: %{customdata.points}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Championship Position by Season',
            font: {
                family: 'Russo One, sans-serif',
                size: 20,
                color: '#ffffff'
            }
        },
        xaxis: {
            title: 'Season',
            tickfont: { color: '#b8b8b8' },
            titlefont: { color: '#ffffff' },
            gridcolor: 'rgba(255, 255, 255, 0.1)'
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
            font: { color: '#ffffff' }
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('positionChart', [trace], layout, config);
}

/**
 * Update seasons table
 */
function updateSeasonsTable(data) {
    const { seasonData } = data;
    const tbody = document.getElementById('seasonsTableBody');
    
    const years = Object.keys(seasonData).sort((a, b) => b - a);
    
    tbody.innerHTML = years.map(year => {
        const season = seasonData[year];
        const teams = Array.from(season.teams).join(', ');
        const isChampion = season.position === 1;
        
        return `
            <tr class="${isChampion ? 'champion-row' : ''}">
                <td>${year}</td>
                <td class="team-cell">${teams}</td>
                <td class="position">${season.position || 'N/A'}</td>
                <td>${season.points}</td>
                <td>${season.wins}</td>
                <td>${season.podiums}</td>
                <td>${season.poles}</td>
                <td>${season.dnfs}</td>
            </tr>
        `;
    }).join('');
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
 * Handle window resize for responsive charts
 */
window.addEventListener('resize', () => {
    if (currentDriver) {
        Plotly.Plots.resize('pointsChart');
        Plotly.Plots.resize('winsPodumsChart');
        Plotly.Plots.resize('teamsChart');
        Plotly.Plots.resize('positionChart');
    }
});

console.log('F1 Drivers Dashboard JavaScript loaded successfully');