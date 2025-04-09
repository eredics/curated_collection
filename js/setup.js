/**
 * Setup script to ensure all required resources exist
 */
(function() {
    // Check if placeholder image exists, create if not
    fetch('./images/placeholder.svg')
        .then(response => {
            if (!response.ok) {
                console.warn('Placeholder image not found, creating one...');
                createPlaceholderImage();
            }
        })
        .catch(() => {
            console.warn('Error checking for placeholder, creating one...');
            createPlaceholderImage();
        });
        
    // Create a simple placeholder SVG
    function createPlaceholderImage() {
        const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
              <rect width="300" height="300" fill="#f0f0f0"/>
              <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#999">Image Unavailable</text>
            </svg>
        `;
        
        // We can't create files from JavaScript in a browser
        console.error('Please create a placeholder image at ./images/placeholder.svg');
        console.log('You can use this SVG content:', svgContent);
    }
    
    // Create a directory for fallback sample data
    function checkCsvFileExists() {
        fetch('./data/filtered.csv')
            .then(response => {
                if (!response.ok) {
                    console.error('CSV file not found at ./data/filtered.csv');
                    console.log('Please ensure this file exists and is accessible');
                }
            })
            .catch(() => {
                console.error('Error accessing CSV file');
            });
    }
    
    // Run checks
    checkCsvFileExists();
})();