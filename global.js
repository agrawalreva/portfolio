console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'cv/', title: 'CV' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/agrawalreva', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  const ARE_WE_HOME = document.documentElement.classList.contains('home');
  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = '_blank';
  }
  nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);

const select = document.querySelector('.color-scheme select');

function setColorScheme(value) {
  document.documentElement.style.setProperty('color-scheme', value);
  localStorage.colorScheme = value;
}

if ('colorScheme' in localStorage) {
  const savedScheme = localStorage.colorScheme;
  setColorScheme(savedScheme);
  select.value = savedScheme;
}

select.addEventListener('input', (event) => {
  const colorScheme = event.target.value;
  console.log('Color scheme changed to', colorScheme);
  setColorScheme(colorScheme);
});

export async function fetchJSON(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return data;

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
      return [];
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
      console.error("Invalid container element provided.");
      return;
  }

  containerElement.innerHTML = '';

  if (projects.length === 0) {
      containerElement.innerHTML = '<p>No projects available.</p>';
      return;
  }

  projects.forEach(project => {
      const article = document.createElement('article');

      article.innerHTML = `
          <${headingLevel}>${project.title}</${headingLevel}>
          <img src="${project.image}" alt="${project.title}">
          <p>${project.description}</p>
          ${project.year ? `<div class="project-year">c. ${project.year}</div>` : ''}
      `;

      containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}