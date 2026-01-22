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
    this.loadSection('sections/home-section.html');
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

      if (url === 'sections/videos-section.html') {
        content = await this.loadVideos(doc.querySelector('section'));
      } else if (url === 'sections/music-section.html') {
        content = await this.loadMusic(doc.querySelector('section'));
      } else if (url === 'sections/live-section.html') {
        content = await this.loadLive(doc.querySelector('section'))
      } else {
        content = doc.querySelector('section'); 
      }
      
      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(content);
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

  async loadMusic(section) {
    try {
      const response = await fetch('/data/music.json');
      if (!response.ok) throw new Error('Failed to fetch music');
      const albums = await response.json();

      const albumsDiv = document.createElement('div');
      albumsDiv.classList.add('albums');

      albums.forEach(album => {
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        const cover = document.createElement('img');
        cover.src = album.cover;

        const title = document.createElement('h2');
        title.textContent = album.title;

        const released = document.createElement('p');
        released.textContent = `Released: ${album.releaseYear}`;

        const streamingDiv = document.createElement('div');
        streamingDiv.classList.add('streaming'); 

        album.streaming.forEach(service => {
          const link = document.createElement('a');
          link.href = service.url;
          link.target = '_blank';
          link.setAttribute('aria-label', service.platform);


          const img = document.createElement('img');
          img.src = service.icon;


          link.appendChild(img);
          streamingDiv.appendChild(link);
        })

        albumDiv.appendChild(cover);
        albumDiv.appendChild(title);
        albumDiv.appendChild(released);
        albumDiv.appendChild(streamingDiv);
        albumsDiv.appendChild(albumDiv);
      })
      section.appendChild(albumsDiv);
      return section;

    } catch (err) {
      console.error('Error loading music', err);
    }
  }

  async loadLive(section) {
    try {
      const response = await fetch('/data/live.json');
      if (!response.ok) throw new Error('Failed to fetch live dates');
  
      const liveDates = await response.json();
      const datesDiv = document.createElement('div');
      datesDiv.classList.add('live-list');
  
      liveDates.forEach(liveDate => {
        const tourEntry = document.createElement('div');
        tourEntry.classList.add('tour-entry');
  
        tourEntry.innerHTML = this.buildDate(
          liveDate.date,
          liveDate.time,
          liveDate.city,
          liveDate.country,
          liveDate.venue,
          liveDate.ticketUrl,
          liveDate.soldOut
        );
  
        datesDiv.appendChild(tourEntry);
      });
  
      section.appendChild(datesDiv);
      return section;
    } catch (err) {
      console.error('Error loading live', err);
    }
  }
  

  buildDate(date, time, city, country, venue, ticketUrl, soldOut) {
    return `
      <div class="tour-info">
        <p class="tour-date">${date}</p>
        <p class="tour-time">${time}</p>
        <p class="tour-location">${city}, ${country}</p>
        <p class="tour-venue">${venue}</p>
      </div>
      <div class="tour-tickets">
        <a href="${ticketUrl}" target="_blank" ${soldOut ? 'class="sold-out"' : ''}>
          ${soldOut ? 'Sold Out' : 'Tickets'}
        </a>
      </div>
    `;
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