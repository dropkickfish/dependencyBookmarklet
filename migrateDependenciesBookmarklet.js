// Frontify Dependencies Migration Bookmarklet
(function() {
    // Create the UI panel
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    `;

    // Create the title
    const title = document.createElement('h2');
    title.textContent = 'Frontify Dependencies Migration';
    title.style.cssText = `
        margin-top: 0;
        margin-bottom: 15px;
        color: #2c3e50;
        font-size: 18px;
    `;
    panel.appendChild(title);

    // Create the destination library ID input
    const destLibraryLabel = document.createElement('label');
    destLibraryLabel.textContent = 'Destination Library ID:';
    destLibraryLabel.style.display = 'block';
    destLibraryLabel.style.marginBottom = '5px';
    destLibraryLabel.style.fontWeight = 'bold';
    panel.appendChild(destLibraryLabel);

    const destLibraryInput = document.createElement('input');
    destLibraryInput.type = 'text';
    destLibraryInput.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    `;
    panel.appendChild(destLibraryInput);

    // Create the CSRF token input
    const csrfLabel = document.createElement('label');
    csrfLabel.textContent = 'CSRF Token (optional):';
    csrfLabel.style.display = 'block';
    csrfLabel.style.marginBottom = '5px';
    csrfLabel.style.fontWeight = 'bold';
    panel.appendChild(csrfLabel);

    const csrfInput = document.createElement('input');
    csrfInput.type = 'text';
    csrfInput.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    `;
    panel.appendChild(csrfInput);

    // Create the migrate button
    const migrateButton = document.createElement('button');
    migrateButton.textContent = 'Migrate Dependencies';
    migrateButton.style.cssText = `
        background-color: #3498db;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        width: 100%;
        margin-bottom: 15px;
    `;
    panel.appendChild(migrateButton);

    // Create the log area
    const logArea = document.createElement('div');
    logArea.style.cssText = `
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        white-space: pre-wrap;
    `;
    panel.appendChild(logArea);

    // Add the panel to the page
    document.body.appendChild(panel);

    // Function to log messages
    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        logArea.innerHTML += `[${timestamp}] ${message}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }

    // Function to get the current library ID from the URL
    function getCurrentLibraryId() {
        const match = window.location.pathname.match(/\/libraries\/(\d+)/);
        return match ? match[1] : null;
    }

    // Function to get the CSRF token from cookies
    function getCsrfTokenFromCookies() {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf_token') {
                return value;
            }
        }
        return null;
    }

    // Function to fetch properties from a library
    async function fetchProperties(libraryId, csrfToken) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            
            const response = await fetch(`/api/libraries/${libraryId}/properties`, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            log(`Error fetching properties: ${error.message}`);
            throw error;
        }
    }

    // Function to update a property's dependencies
    async function updatePropertyDependencies(libraryId, propertyId, dependencies, csrfToken) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            
            const response = await fetch(`/api/libraries/${libraryId}/properties/${propertyId}`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ dependencies: dependencies })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update property: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            log(`Error updating property dependencies: ${error.message}`);
            throw error;
        }
    }

    // Function to migrate dependencies
    async function migrateDependencies() {
        const sourceLibraryId = getCurrentLibraryId();
        if (!sourceLibraryId) {
            log('Error: Could not determine source library ID from URL');
            return;
        }
        
        const destLibraryId = destLibraryInput.value.trim();
        if (!destLibraryId) {
            log('Error: Destination library ID is required');
            return;
        }
        
        const csrfToken = csrfInput.value.trim() || getCsrfTokenFromCookies();
        if (!csrfToken) {
            log('Warning: No CSRF token provided. Some operations may fail.');
        }
        
        try {
            log(`Fetching properties from source library (ID: ${sourceLibraryId})...`);
            const sourceProperties = await fetchProperties(sourceLibraryId, csrfToken);
            log(`Found ${sourceProperties.length} properties in source library.`);
            
            log(`Fetching properties from destination library (ID: ${destLibraryId})...`);
            const destProperties = await fetchProperties(destLibraryId, csrfToken);
            log(`Found ${destProperties.length} properties in destination library.`);
            
            // Create a map of property names to IDs in the destination library
            const destPropertyMap = {};
            for (const property of destProperties) {
                destPropertyMap[property.name] = property.id;
            }
            
            // Create a map of property IDs to names in the source library
            const sourcePropertyMap = {};
            for (const property of sourceProperties) {
                sourcePropertyMap[property.id] = property.name;
            }
            
            let migratedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            // Process each property in the source library
            for (const sourceProperty of sourceProperties) {
                if (!sourceProperty.dependencies || sourceProperty.dependencies.length === 0) {
                    skippedCount++;
                    continue;
                }
                
                // Check if the property exists in the destination library
                if (!destPropertyMap[sourceProperty.name]) {
                    log(`Skipping "${sourceProperty.name}" - not found in destination library`);
                    skippedCount++;
                    continue;
                }
                
                const destPropertyId = destPropertyMap[sourceProperty.name];
                
                // Map the dependency IDs from source to destination
                const mappedDependencies = [];
                for (const depId of sourceProperty.dependencies) {
                    const depName = sourcePropertyMap[depId];
                    if (depName && destPropertyMap[depName]) {
                        mappedDependencies.push(destPropertyMap[depName]);
                    } else {
                        log(`Warning: Dependency "${depName}" for "${sourceProperty.name}" not found in destination library`);
                    }
                }
                
                if (mappedDependencies.length === 0) {
                    log(`Skipping "${sourceProperty.name}" - no valid dependencies to migrate`);
                    skippedCount++;
                    continue;
                }
                
                try {
                    log(`Migrating dependencies for "${sourceProperty.name}"...`);
                    await updatePropertyDependencies(destLibraryId, destPropertyId, mappedDependencies, csrfToken);
                    log(`Successfully migrated dependencies for "${sourceProperty.name}"`);
                    migratedCount++;
                } catch (error) {
                    log(`Error migrating dependencies for "${sourceProperty.name}": ${error.message}`);
                    errorCount++;
                }
            }
            
            log(`Migration complete!`);
            log(`- Successfully migrated: ${migratedCount}`);
            log(`- Skipped: ${skippedCount}`);
            log(`- Errors: ${errorCount}`);
            
        } catch (error) {
            log(`Migration failed: ${error.message}`);
        }
    }

    // Add event listener to the migrate button
    migrateButton.addEventListener('click', migrateDependencies);

    // Try to auto-detect the CSRF token
    const autoDetectedCsrfToken = getCsrfTokenFromCookies();
    if (autoDetectedCsrfToken) {
        csrfInput.value = autoDetectedCsrfToken;
        log('CSRF token automatically detected from cookies.');
    } else {
        log('CSRF token not found in cookies. You may need to enter it manually.');
    }

    // Log initial message
    log('Frontify Dependencies Migration tool loaded.');
    log('Enter the destination library ID and click "Migrate Dependencies" to begin.');
})(); 