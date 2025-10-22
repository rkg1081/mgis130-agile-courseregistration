// Global variables
let allCourses = [];
let currentFilter = 'all';
let mySchedule = [];

// Load courses when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadScheduleFromStorage();
    loadCourses();
    initializeSchedulePanel();
});

// Load course data from JSON file
async function loadCourses() {
    try {
        const response = await fetch('courses.json');
        const data = await response.json();
        allCourses = data.courses;
        
        initializeDepartmentFilter();
        displayCourses(allCourses);
        updateCourseCount(allCourses.length);
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('courseList').innerHTML = 
            '<div class="loading">Error loading courses. Please refresh the page.</div>';
    }
}

// Initialize department dropdown with unique departments
function initializeDepartmentFilter() {
    const departmentSet = new Set();
    allCourses.forEach(course => {
        departmentSet.add(course.department);
    });
    
    const departments = Array.from(departmentSet).sort();
    const selectElement = document.getElementById('departmentFilter');
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        selectElement.appendChild(option);
    });
    
    // Add event listener for filtering
    selectElement.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterCourses();
    });
}

// Filter courses based on selected department
function filterCourses() {
    let filteredCourses;
    
    if (currentFilter === 'all') {
        filteredCourses = allCourses;
    } else {
        filteredCourses = allCourses.filter(course => 
            course.department === currentFilter
        );
    }
    
    displayCourses(filteredCourses);
    updateCourseCount(filteredCourses.length);
}

// Display courses in the grid
function displayCourses(courses) {
    const courseListElement = document.getElementById('courseList');
    
    if (courses.length === 0) {
        courseListElement.innerHTML = `
            <div class="no-results">
                <h2>No Courses Found</h2>
                <p>Try selecting a different department.</p>
            </div>
        `;
        return;
    }
    
    courseListElement.innerHTML = courses.map(course => createCourseCard(course)).join('');
}

// Create HTML for a single course card
function createCourseCard(course) {
    const prerequisitesHTML = course.prerequisites.length > 0 
        ? course.prerequisites.join(', ')
        : '<span class="no-prereq">None</span>';
    
    const termsHTML = course.terms.map(term => 
        `<span class="term-badge">${term}</span>`
    ).join('');
    
    const isInSchedule = mySchedule.some(c => c.id === course.id);
    const buttonText = isInSchedule ? 'Added to Schedule' : 'Add to Schedule';
    const buttonClass = isInSchedule ? 'add-to-schedule-btn added' : 'add-to-schedule-btn';
    
    return `
        <div class="course-card">
            <div class="course-header">
                <div class="course-code">${course.courseCode}</div>
                <h2 class="course-title">${course.title}</h2>
            </div>
            
            <div class="course-meta">
                <span class="department-tag">${course.department}</span>
                <span class="meta-item">
                    <strong>Credits:</strong> ${course.credits}
                </span>
                <span class="meta-item">
                    <strong>Level:</strong> ${course.level}
                </span>
            </div>
            
            <p class="course-description">${course.description}</p>
            
            <div class="course-details">
                <div class="detail-row">
                    <span class="detail-label">Terms Offered:</span>
                    <div class="terms">${termsHTML}</div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Prerequisites:</span>
                    <span class="prerequisites">${prerequisitesHTML}</span>
                </div>
            </div>
            
            <button class="${buttonClass}" data-course-id="${course.id}" onclick="toggleCourseInSchedule('${course.id}')">
                ${buttonText}
            </button>
        </div>
    `;
}

// Update course count display
function updateCourseCount(count) {
    const countElement = document.getElementById('courseCount');
    const courseText = count === 1 ? 'course' : 'courses';
    countElement.textContent = `Showing ${count} ${courseText}`;
}

// ===== SCHEDULE MANAGEMENT FUNCTIONS =====

// Initialize schedule panel event listeners
function initializeSchedulePanel() {
    const toggleBtn = document.getElementById('toggleSchedule');
    const closeBtn = document.getElementById('closeSchedule');
    const clearBtn = document.getElementById('clearSchedule');
    const schedulePanel = document.getElementById('schedulePanel');
    
    toggleBtn.addEventListener('click', () => {
        schedulePanel.classList.toggle('hidden');
    });
    
    closeBtn.addEventListener('click', () => {
        schedulePanel.classList.add('hidden');
    });
    
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your entire schedule?')) {
            clearSchedule();
        }
    });
    
    updateScheduleDisplay();
}

// Toggle course in schedule
function toggleCourseInSchedule(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    const index = mySchedule.findIndex(c => c.id === courseId);
    
    if (index > -1) {
        // Remove from schedule
        mySchedule.splice(index, 1);
    } else {
        // Add to schedule
        mySchedule.push(course);
    }
    
    saveScheduleToStorage();
    updateScheduleDisplay();
    
    // Refresh course cards to update button states
    filterCourses();
}

// Remove course from schedule
function removeCourseFromSchedule(courseId) {
    mySchedule = mySchedule.filter(c => c.id !== courseId);
    saveScheduleToStorage();
    updateScheduleDisplay();
    filterCourses();
}

// Clear entire schedule
function clearSchedule() {
    mySchedule = [];
    saveScheduleToStorage();
    updateScheduleDisplay();
    filterCourses();
}

// Update schedule panel display
function updateScheduleDisplay() {
    const scheduleContent = document.getElementById('scheduleContent');
    const scheduleCountElement = document.getElementById('scheduleCount');
    const totalCreditsElement = document.getElementById('totalCredits');
    const totalCoursesElement = document.getElementById('totalCourses');
    const clearBtn = document.getElementById('clearSchedule');
    
    // Update count badge
    scheduleCountElement.textContent = mySchedule.length;
    
    // Calculate total credits
    const totalCredits = mySchedule.reduce((sum, course) => sum + course.credits, 0);
    totalCreditsElement.textContent = totalCredits;
    totalCoursesElement.textContent = mySchedule.length;
    
    // Enable/disable clear button
    clearBtn.disabled = mySchedule.length === 0;
    
    // Display schedule items
    if (mySchedule.length === 0) {
        scheduleContent.innerHTML = `
            <div class="empty-schedule">
                <p>Your schedule is empty. Add courses to get started!</p>
            </div>
        `;
        return;
    }
    
    const scheduleHTML = mySchedule.map(course => createScheduleItem(course)).join('');
    scheduleContent.innerHTML = scheduleHTML;
}

// Create HTML for schedule item
function createScheduleItem(course) {
    const termsHTML = course.terms.join(', ');
    
    return `
        <div class="schedule-item">
            <div class="schedule-item-header">
                <div>
                    <div class="schedule-item-code">${course.courseCode}</div>
                    <div class="schedule-item-title">${course.title}</div>
                </div>
                <button class="remove-btn" onclick="removeCourseFromSchedule('${course.id}')">
                    Remove
                </button>
            </div>
            <div class="schedule-item-info">
                ${course.credits} credits • ${termsHTML}
            </div>
        </div>
    `;
}

// Save schedule to localStorage
function saveScheduleToStorage() {
    localStorage.setItem('mySchedule', JSON.stringify(mySchedule));
}

// Load schedule from localStorage
function loadScheduleFromStorage() {
    const savedSchedule = localStorage.getItem('mySchedule');
    if (savedSchedule) {
        mySchedule = JSON.parse(savedSchedule);
    }
}