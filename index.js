import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('projects//projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');

const githubData = await fetchGitHubData('agrawalreva');
console.log(githubData);

document.getElementById('followers').textContent = githubData.followers;
document.getElementById('following').textContent = githubData.following;
document.getElementById('repos').textContent = githubData.public_repos;

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}

renderProjects(latestProjects, projectsContainer, 'h2');