import { fetchJSON, renderProjects, fetchGitHubData, updateGitHubStats } from './global.js';

async function loadFeaturedProjects() {
    const allProjects = await fetchJSON('projects/projects.json');
    const featuredProjects = allProjects.slice(0, 3);
    const container = document.getElementById('featured-projects');
    
    if (container) {
        renderProjects(featuredProjects, container, 'h3');
    }
}

async function loadGitHubStats() {
    try {
        const githubData = await fetchGitHubData('agrawalreva');
        updateGitHubStats(githubData);
    } catch (error) {
        console.error('Failed to load GitHub stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProjects();
    loadGitHubStats();
}); 