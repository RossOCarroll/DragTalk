const originalConsoleError = console.error;
console.error = function(message, ...optionalParams) {
  if (typeof message === 'string' && message.includes(location.hostname)) {
    originalConsoleError(message, ...optionalParams);
  }
};


class BandPage {
  constructor() {
    this.navBar = document.querySelectorAll('nav a');
    this.mainContent = document.getElementById('main-content');
    this.navBarDelegation(this.navBar);
  }

  navBarDelegation(navBar) {
    navBar.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        link.classList.add('active');
        const url = link.getAttribute('href');
        this.loadSection(url);
        this.resetNav(link);          
      })
    })
  }

  async loadSection(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Page not found');
  
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      let content

      if (url === 'videos-section.html') {
        content = await this.loadVideos(doc.querySelector('section'))
      } else {
        content = doc.querySelector('section'); 
      }
      
  
      this.mainContent.innerHTML = content.innerHTML;
    } catch (err) {
      console.error('Error loading page', err);
    }
  }

  async loadVideos(section) {
    try {
      const response = await fetch('/data/videos.json');
      if (!response.ok) throw new Error('Failed to fetch videos');

      const videos = await response.json();
      const grid = document.createElement('div');
      grid.classList.add('video-grid');

      videos.forEach(video => {
        const videoEl = document.createElement('div');
        videoEl.classList.add('video');
  
        const frame = document.createElement('div');
        frame.classList.add('video-frame');
  
        const iframe = document.createElement('iframe');
        iframe.src = video.src;
        iframe.allowFullscreen = true;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

        const h1 = document.createElement('h1');
        h1.classList.add('video-title');
        h1.textContent = video.title;
  
        frame.appendChild(iframe);
        videoEl.appendChild(frame);
        videoEl.appendChild(h1);
        grid.appendChild(videoEl);
      })

      section.appendChild(grid);

      return section;
    } catch (err) {
      console.error('Error loading videos', err);
    }
  }

  resetNav(activeLink) {
    this.navBar.forEach(link => {
      link.classList.remove('active');
    });
    if (activeLink) activeLink.classList.add('active');
  }
  
  
};

document.addEventListener('DOMContentLoaded', () => {
  new BandPage()
})