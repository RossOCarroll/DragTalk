const BASE_PATH = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  ? './'        // local server
  : '/DragTalk/'; // GitHub Pages project

class BandPage {
  constructor() {
    this.navBar = document.querySelectorAll('nav a');
    this.mainContent = document.getElementById('main-content');
    this.navBarDelegation();
    this.loadHome();
  }

  // Handle navbar clicks
  navBarDelegation() {
    this.navBar.forEach(link => {
      const section = link.dataset.section;
      if (!section) return; // external STORE link

      link.addEventListener('click', e => {
        e.preventDefault();
        this.resetNav(link);
        link.classList.add('active');

        if (section === 'home') {
          this.loadHome();
        } else {
          this.loadSection(`${BASE_PATH}sections/${section}-section.html`);
        }
      });
    });
  }

  resetNav(activeLink) {
    this.navBar.forEach(link => link.classList.remove('active'));
    if (activeLink) activeLink.classList.add('active');
  }

  async fetchSectionNode(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector('section');
  }

  async loadSection(url) {
    try {
      const section = await this.fetchSectionNode(url);

      // Special section loaders
      if (url.includes('videos-section.html')) await this.loadVideos(section);
      if (url.includes('music-section.html')) await this.loadMusic(section);
      if (url.includes('live-section.html')) await this.loadLive(section);
      if (url.includes('sign-up-section.html')) await this.loadSignUp(section);

      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(section);
    } catch (err) {
      console.error('Error loading section', err);
    }
  }

  async loadHome() {
    try {
      const homeSection = await this.fetchSectionNode(`${BASE_PATH}sections/home-section.html`);
      const sections = ['live', 'music', 'videos', 'sign-up'];

      for (const sec of sections) {
        const node = await this.fetchSectionNode(`${BASE_PATH}sections/${sec}-section.html`);

        // load any dynamic content
        if (sec === 'live') await this.loadLive(node);
        if (sec === 'music') await this.loadMusic(node);
        if (sec === 'videos') await this.loadVideos(node);
        if (sec === 'sign-up') await this.loadSignUp(node);

        homeSection.appendChild(node);
      }

      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(homeSection);
    } catch (err) {
      console.error('Error loading home', err);
    }
  }

  // ---------------- Dynamic Content Loaders ----------------
  async loadVideos(section) {
    try {
      const res = await fetch(`${BASE_PATH}data/videos.json`);
      const videos = await res.json();
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

        const title = document.createElement('h1');
        title.classList.add('video-title');
        title.textContent = video.title;

        frame.appendChild(iframe);
        videoEl.appendChild(frame);
        videoEl.appendChild(title);
        grid.appendChild(videoEl);
      });

      section.appendChild(grid);
    } catch (err) {
      console.error('Error loading videos', err);
    }
  }

  async loadMusic(section) {
    try {
      const res = await fetch(`${BASE_PATH}data/music.json`);
      const albums = await res.json();
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

        album.streaming.forEach(s => {
          const link = document.createElement('a');
          link.href = s.url;
          link.target = '_blank';
          link.setAttribute('aria-label', s.platform);

          const img = document.createElement('img');
          img.src = s.icon;

          link.appendChild(img);
          streamingDiv.appendChild(link);
        });

        albumDiv.append(cover, title, released, streamingDiv);
        albumsDiv.appendChild(albumDiv);
      });

      section.appendChild(albumsDiv);
    } catch (err) {
      console.error('Error loading music', err);
    }
  }

  async loadLive(section) {
    try {
      const res = await fetch(`${BASE_PATH}data/live.json`);
      const liveDates = await res.json();

      const today = new Date();
      today.setHours(0,0,0,0);

      const past = liveDates.filter(d => new Date(d.date) < today);
      const upcoming = liveDates.filter(d => new Date(d.date) >= today);

      const container = document.createElement('div');
      container.classList.add('live-list');

      const datesDiv = document.createElement('div');
      datesDiv.classList.add('live-dates');

      const renderDates = dates => {
        datesDiv.innerHTML = '';
        if (!dates.length) {
          datesDiv.innerHTML = `<p class="no-dates">No shows listed</p>`;
          return;
        }

        dates.forEach(d => {
          const entry = document.createElement('div');
          entry.classList.add('tour-entry');
          entry.innerHTML = this.buildDate(d);
          datesDiv.appendChild(entry);
        });
      };

      renderDates(upcoming);

      const links = this.createPastUpcomingLinks(
        () => renderDates(past),
        () => renderDates(upcoming)
      );

      container.append(links, datesDiv);
      section.appendChild(container);
    } catch (err) {
      console.error('Error loading live', err);
    }
  }

  buildDate({date, time, city, country, venue, ticketUrl, soldOut}) {
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

  createPastUpcomingLinks(onPast, onUpcoming) {
    const div = document.createElement('div');
    div.classList.add('live-links');

    const pastLink = document.createElement('a');
    pastLink.textContent = 'PAST';
    const upcomingLink = document.createElement('a');
    upcomingLink.textContent = 'UPCOMING';

    pastLink.addEventListener('click', e => { e.preventDefault(); pastLink.classList.add('active'); upcomingLink.classList.remove('active'); onPast(); });
    upcomingLink.addEventListener('click', e => { e.preventDefault(); upcomingLink.classList.add('active'); pastLink.classList.remove('active'); onUpcoming(); });

    div.append(pastLink, upcomingLink);
    return div;
  }

  async loadSignUp(section) {
    try {
      const countrySelect = section.querySelector('#country');
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      const countries = await res.json();
      countries.sort((a,b) => a.name.common.localeCompare(b.name.common));

      countries.forEach(c => {
        const option = document.createElement('option');
        option.value = c.cca2;
        option.textContent = c.name.common;
        countrySelect.appendChild(option);
      });

      const form = section.querySelector('.signup-form');
      form.addEventListener('submit', e => this.handleSubmitForm(e));
    } catch(err) {
      console.error('Error loading signup', err);
    }
  }

  handleSubmitForm(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.querySelector('#email').value.trim();
    const first = form.querySelector('#first_name').value.trim();
    const last = form.querySelector('#last_name').value.trim();
    const country = form.querySelector('#country').value;
    const marketing = form.querySelector('#marketing_email').checked;

    if (!email || !marketing) return;

    window._learnq = window._learnq || [];
    _learnq.push(['identify', { $email: email, $first_name: first, $last_name: last, Country: country, Marketing_Email: marketing, Source: 'Website Signup' }]);
    _learnq.push(['subscribe', { list: 'LIST_ID', email }]);

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
}

document.addEventListener('DOMContentLoaded', () => new BandPage());
