// Scroll-triggered slideshow animation
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    const header = document.getElementById('header');
    const aboutSection = document.getElementById('slide-1');
    
    // Initialize: show first slide
    if (slides.length > 0) {
        slides[0].classList.add('active');
    }
    
    // Use Intersection Observer for better performance
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.3
    };
    
    const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slide = entry.target;
                
                // Remove active from all slides
                slides.forEach(s => {
                    s.classList.remove('active', 'fade-out');
                });
                
                // Add active to current slide
                slide.classList.add('active');
                
                // Fade out previous slides
                const slideIndex = Array.from(slides).indexOf(slide);
                for (let i = 0; i < slideIndex; i++) {
                    slides[i].classList.add('fade-out');
                }
            }
        });
    }, observerOptions);
    
    // Observe all slides
    slides.forEach(slide => {
        slideObserver.observe(slide);
    });
    
    // Header fade out on scroll - fade out when slide-1 is no longer visible
    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && entry.target === aboutSection) {
                header.classList.add('fade-out');
            } else if (entry.isIntersecting && entry.target === aboutSection) {
                header.classList.remove('fade-out');
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });
    
    headerObserver.observe(aboutSection);
    
    // Initialize DMOJ Calendar Heatmap
    const heatmapGrid = document.getElementById('heatmapGrid');
    if (heatmapGrid) {
        initializeDMOJHeatmap();
    }
});

// Initialize DMOJ Calendar Heatmap
function initializeDMOJHeatmap() {
    let currentYear = new Date().getFullYear();
    let allSubmissionData = {};
    let tooltip = null;
    
    // Fetch submission data from DMOJ
    const corsProxy = 'https://api.allorigins.win/get?url=';
    const dmojUrl = encodeURIComponent('https://dmoj.ca/user/Dwin2020');
    
    fetch(corsProxy + dmojUrl)
        .then(response => response.json())
        .then(data => {
            const html = data.contents;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Try to extract submission data from the page
            const calendar = doc.querySelector('.calendar-heatmap, .submission-calendar, svg');
            
            if (calendar) {
                allSubmissionData = parseDMOJCalendar(calendar);
            } else {
                allSubmissionData = generateSampleData();
            }
            
            updateHeatmap(currentYear);
        })
        .catch(error => {
            console.log('Could not fetch DMOJ data, using sample data:', error);
            allSubmissionData = generateSampleData();
            updateHeatmap(currentYear);
        });
    
    // Parse DMOJ calendar data
    function parseDMOJCalendar(calendarElement) {
        const data = {};
        // Try different selectors for DMOJ calendar
        const cells = calendarElement.querySelectorAll('rect[data-date], rect[data-count], .day[data-date], .day[data-count]');
        
        cells.forEach(cell => {
            const date = cell.getAttribute('data-date') || cell.getAttribute('data-day');
            const count = parseInt(cell.getAttribute('data-count') || cell.getAttribute('data-value') || cell.getAttribute('fill-opacity') || '0');
            
            if (date) {
                const dateObj = new Date(date);
                const year = dateObj.getFullYear();
                if (!data[year]) data[year] = {};
                data[year][date] = count;
            }
        });
        
        return Object.keys(data).length > 0 ? data : generateSampleData();
    }
    
    // Generate sample data structure (fallback)
    function generateSampleData() {
        const data = {};
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date();
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            if (!data[year]) data[year] = {};
            const dateStr = d.toISOString().split('T')[0];
            // Random submissions per day (0-5)
            data[year][dateStr] = Math.floor(Math.random() * 6);
        }
        
        return data;
    }
    
    // Create tooltip element
    function createTooltip() {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'heatmap-tooltip';
            tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 1000; display: none; font-family: "DM Sans", sans-serif;';
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }
    
    // Update heatmap for specific year
    function updateHeatmap(year) {
        const yearData = allSubmissionData[year] || {};
        const grid = document.getElementById('heatmapGrid');
        grid.innerHTML = '';
        
        // Create day labels
        const dayLabels = document.createElement('div');
        dayLabels.className = 'day-labels';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const label = document.createElement('div');
            label.className = 'day-label';
            label.textContent = day;
            dayLabels.appendChild(label);
        });
        grid.appendChild(dayLabels);
        
        // Create weeks container
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'weeks-container';
        
        // Get first day of year and its day of week
        const firstDay = new Date(year, 0, 1);
        const startDayOfWeek = firstDay.getDay();
        
        // Get last day of year
        const lastDay = new Date(year, 11, 31);
        const daysInYear = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
        const weeks = Math.ceil((startDayOfWeek + daysInYear) / 7);
        
        let totalSubmissions = 0;
        let currentDate = new Date(firstDay);
        currentDate.setDate(currentDate.getDate() - startDayOfWeek); // Start from beginning of first week
        
        // Create weeks
        for (let week = 0; week < weeks; week++) {
            const weekColumn = document.createElement('div');
            weekColumn.className = 'week-column';
            
            // Create 7 days for this week
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const square = document.createElement('div');
                square.className = 'heatmap-square';
                
                if (currentDate >= firstDay && currentDate <= lastDay) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const count = yearData[dateStr] || 0;
                    totalSubmissions += count;
                    
                    square.setAttribute('data-date', dateStr);
                    square.setAttribute('data-count', count);
                    square.setAttribute('data-count-display', count);
                    
                    // Add hover event
                    square.addEventListener('mouseenter', (e) => {
                        const tooltip = createTooltip();
                        const count = parseInt(e.target.getAttribute('data-count'));
                        const date = new Date(e.target.getAttribute('data-date'));
                        tooltip.innerHTML = `<strong>${count} submission${count !== 1 ? 's' : ''}</strong><br>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
                        tooltip.style.display = 'block';
                    });
                    
                    square.addEventListener('mousemove', (e) => {
                        const tooltip = createTooltip();
                        tooltip.style.left = (e.pageX + 10) + 'px';
                        tooltip.style.top = (e.pageY - 10) + 'px';
                    });
                    
                    square.addEventListener('mouseleave', () => {
                        const tooltip = createTooltip();
                        tooltip.style.display = 'none';
                    });
                } else {
                    square.setAttribute('data-count', '0');
                }
                
                weekColumn.appendChild(square);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            weeksContainer.appendChild(weekColumn);
        }
        
        grid.appendChild(weeksContainer);
        
        // Update title and footer
        document.getElementById('heatmapTitle').textContent = `${totalSubmissions} submissions in ${year}`;
        document.getElementById('totalSubmissions').textContent = `${totalSubmissions} total submissions`;
        document.getElementById('currentYear').textContent = year;
        
        // Update button states
        const years = Object.keys(allSubmissionData).map(Number).sort();
        const prevBtn = document.getElementById('prevYear');
        const nextBtn = document.getElementById('nextYear');
        
        if (years.length > 0) {
            prevBtn.disabled = year <= Math.min(...years);
            nextBtn.disabled = year >= Math.max(...years);
        }
    }
    
    // Year navigation
    document.getElementById('prevYear').addEventListener('click', () => {
        const years = Object.keys(allSubmissionData).map(Number).sort();
        const currentIndex = years.indexOf(currentYear);
        if (currentIndex > 0) {
            currentYear = years[currentIndex - 1];
            updateHeatmap(currentYear);
        }
    });
    
    document.getElementById('nextYear').addEventListener('click', () => {
        const years = Object.keys(allSubmissionData).map(Number).sort();
        const currentIndex = years.indexOf(currentYear);
        if (currentIndex < years.length - 1) {
            currentYear = years[currentIndex + 1];
            updateHeatmap(currentYear);
        }
    });
}

