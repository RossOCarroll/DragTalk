const BASE_PATH = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  ? './'                   // local server
  : '/DragTalk/';          // GitHub Pages project

function path(url) {
  return `${BASE_PATH}${url}`;
}

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
    this.loadHome();
  }

  navBarDelegation(navBar) {
    navBar.forEach(link => {
      link.addEventListener('click', event => {
        if (event.target.textContent !== 'STORE') {
          event.preventDefault();
  
          this.resetNav(link);
          link.classList.add('active');
  
          if (link.textContent === 'HOME') {
            this.loadHome();  // special case
          } else {
            const url = link.getAttribute('href');
            this.loadSection(url);
          }
        }
      });
    });
  }

  normalizeDate(dateStr) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  splitDatesByTime(liveDates) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    return {
      past: liveDates.filter(d => this.normalizeDate(d.date) < today),
      upcoming: liveDates.filter(d => this.normalizeDate(d.date) >= today)
    };
  }
  

  async loadSection(url) {
    try {
      const response = await fetch(path(url));
      if (!response.ok) throw new Error('Page not found');
  
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      let content

      if (url === 'sections/videos-section.html') {
        content = await this.loadVideos(doc.querySelector('section'));
      } else if (url === 'sections/music-section.html') {
        content = await this.loadMusic(doc.querySelector('section'));
      } else if (url === 'sections/live-section.html') {
        content = await this.loadLive(doc.querySelector('section'));
      } else if (url === 'sections/sign-up-section.html') {
        content = await this.loadSignUp(doc.querySelector('section'));
      } else if (url === 'sections/home-section.html') {
        this.loadHome();
        return;
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
      const response = await fetch(path('data/videos.json')); 
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
      const response = await fetch(path('data/music.json'));
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

  createPassedLinkDiv(onPastClick, onUpcomingClick) {
    const div = document.createElement('div');
    div.classList.add('live-links');
  
    const pastLink = document.createElement('a');
    pastLink.textContent = 'PAST';
  
    const upcomingLink = document.createElement('a');
    upcomingLink.textContent = 'UPCOMING';
  
    pastLink.addEventListener('click', e => {
      e.preventDefault();
      pastLink.classList.add('active');
      upcomingLink.classList.remove('active');
      onPastClick();
    });
    
    upcomingLink.addEventListener('click', e => {
      e.preventDefault();
      upcomingLink.classList.add('active');
      pastLink.classList.remove('active');
      onUpcomingClick();
    });
    
    div.append(pastLink, upcomingLink);
    return div;
  }
  
  async loadLive(section) {
    try {
      const response = await fetch(path('data/live.json'));
      if (!response.ok) throw new Error('Failed to fetch live dates');
  
      const liveDates = await response.json();
      const { past, upcoming } = this.splitDatesByTime(liveDates);
  
      const container = document.createElement('div');
      container.classList.add('live-list');
  
      const datesDiv = document.createElement('div');
      datesDiv.classList.add('live-dates');
  
      const renderDates = dates => {
        datesDiv.innerHTML = '';

        if (dates.length === 0) {
          datesDiv.innerHTML = `<p class="no-dates">No shows listed</p>`;
          return;
        }

        dates.forEach(liveDate => {
          const entry = document.createElement('div');
          entry.classList.add('tour-entry');
          entry.innerHTML = this.buildDate(
            liveDate.date,
            liveDate.time,
            liveDate.city,
            liveDate.country,
            liveDate.venue,
            liveDate.ticketUrl,
            liveDate.soldOut
          );
          datesDiv.appendChild(entry);
        });
      };
  
      renderDates(upcoming);
  
      const links = this.createPassedLinkDiv(
        () => renderDates(past),
        () => renderDates(upcoming)
      );
  
      container.append(links, datesDiv);
      section.appendChild(container);
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
        <a href="https://www.bandsintown.com/a/15530173-drag-talk" class="rsvp" target="_blank">RSVP</a>
        <a href="${ticketUrl}" target="_blank" ${soldOut ? 'class="sold-out"' : ''}>
          ${soldOut ? 'Sold Out' : 'Tickets'}
        </a>
      </div>
    `;
  }

  async loadSignUp(section) {
    try {
      const countrySelect = section.querySelector('#country');
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      if(!response.ok) throw new Error('Failed to load countries');

      const countries = await response.json();
      countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.cca2;
        option.textContent = country.name.common;
        countrySelect.appendChild(option)
      })

      const form = section.querySelector('.signup-form');
      form.addEventListener('submit', e => this.handleSubmitForm(e));

      return section
    }catch(error) {
      console.error(error)
    }
  }

  async fetchSectionNode(url) {
    const response = await fetch(path(url));
    if (!response.ok) throw new Error(`Failed to load ${url}`);
  
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector('section');
  }

  async loadHome() {
    try {
      const homeSection = await this.fetchSectionNode('sections/home-section.html');
  
      const liveSection = await this.fetchSectionNode('sections/live-section.html');
      const musicSection = await this.fetchSectionNode('sections/music-section.html');
      const videosSection = await this.fetchSectionNode('sections/videos-section.html');
      const signUpSection = await this.fetchSectionNode('sections/sign-up-section.html');
  
      await this.loadLive(liveSection);
      await this.loadMusic(musicSection);
      await this.loadVideos(videosSection);
      await this.loadSignUp(signUpSection);
  
      homeSection.append(
        liveSection,
        musicSection,
        videosSection,
        signUpSection
      );
  
      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(homeSection);
  
    } catch (error) {
      console.error('Error loading home', error);
    }
  }
  
  handleSubmitForm(event) {
    event.preventDefault();
  
    const form = event.currentTarget;
  
    const email = form.querySelector('#email').value.trim();
    const firstName = form.querySelector('#first_name').value.trim();
    const lastName = form.querySelector('#last_name').value.trim();
    const country = form.querySelector('#country').value;
    const marketingConsent = form.querySelector('#marketing_email').checked;
  
    if (!email || !marketingConsent) return;
  
    window._learnq = window._learnq || [];
  
    _learnq.push(['identify', {
      $email: email,
      $first_name: firstName,
      $last_name: lastName,
      Country: country,
      Marketing_Email: marketingConsent,
      Source: 'Website Signup'
    }]);
  
    _learnq.push(['subscribe', {
      list: 'LIST_ID',
      email: email
    }]);
  
    form.reset();
    this.showSignupSuccess(form);
  }
  
  showSignupSuccess(form) {
    let msg = form.querySelector('.signup-success');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'signup-success';
      msg.textContent = 'Thanks for signing up — see you at the show 🤘';
      form.appendChild(msg);
    }
  }
  
  resetNav(activeLink) {
    this.navBar.forEach(link => link.classList.remove('active'));
    if (activeLink) activeLink.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BandPage();
});
