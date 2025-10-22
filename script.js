// Global variables
let allCourses = [];
let currentFilter = 'all';

// Load courses when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
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
        </div>
    `;
}

// Update course count display
function updateCourseCount(count) {
    const countElement = document.getElementById('courseCount');
    const courseText = count === 1 ? 'course' : 'courses';
    countElement.textContent = `Showing ${count} ${courseText}`;
}