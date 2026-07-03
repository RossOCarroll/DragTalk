import { createClient } from '@supabase/supabase-js';

let supabaseClient;

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      'https://xnqvjcjmympojjtkhcmt.supabase.co',
      'sb_publishable_poUZopim6HVLH-BycJrXag_NfIEh4Ft',
      {
        auth: {
          persistSession: true,
          storageKey: 'drag-talk-auth',
          detectSessionInUrl: false,
          flowType: 'pkce'
        }
      }
    );
  }
  return supabaseClient;
}

const BASE_PATH = import.meta.env.BASE_URL;

window.addEventListener('unhandledrejection', event => {
  console.warn('Unhandled promise rejection:', event.reason);
});

class BandPage {
  constructor() {
    this.navBar = document.querySelectorAll('nav a');
    this.mainContent = document.getElementById('main-content');
    this.header = document.querySelector('header');
    this.releaseSlide = null;
    this.navBarDelegation();
    this.loadHome();
    this.loadCarousel();

    this.mobileButton = document.querySelector('.nav-toggle');
    this.navLinks = document.querySelector('nav ul.nav-links');
    this.modal = document.getElementById('modal');
    this.closeBtn = document.querySelector('.modal-close');
    this.hamburgerSetUp();

    window.addEventListener('scroll', () => this.updateHeaderState(), { passive: true });

    window.addEventListener('load', () => {
      this.modal.classList.remove('hidden');
    });

    this.closeBtn.addEventListener('click', () => {
      this.modal.classList.add('hidden');
    });
  }

  updateHeaderState() {
    if (!this.header) return;
    const hero = document.querySelector('.home-hero');
    if (!hero) {
      this.header.classList.remove('header-on-hero');
      return;
    }
    const heroBottom = hero.getBoundingClientRect().bottom;
    this.header.classList.toggle('header-on-hero', heroBottom > this.header.offsetHeight);
  }

  renderFeatureRelease(root) {
    const wrap = (root || document).querySelector('.feature-release');
    if (!wrap || !this.releaseSlide) return;

    const slide = this.releaseSlide;
    const img = wrap.querySelector('.feature-image img');
    img.src = slide.image;
    img.alt = slide.title ?? '';
    wrap.querySelector('.feature-title').textContent = slide.title ?? '';
    wrap.querySelector('.feature-desc').textContent = slide.description ?? '';
    wrap.querySelector('.feature-listen').href = slide.link || '#';
    wrap.classList.add('is-ready');
  }

  async loadCarousel() {
    try {
      const { data: slides, error } = await getSupabase()
        .from('carousel')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      this.releaseSlide = slides[0] || null;
      this.renderFeatureRelease();

      const track = document.querySelector('.carousel-track');
      const dotsContainer = document.querySelector('.carousel-dots');
      const prevBtn = document.querySelector('.carousel-prev');
      const nextBtn = document.querySelector('.carousel-next');
      if (!track || !dotsContainer) return;
  
      track.innerHTML = '';
      dotsContainer.innerHTML = '';
  
      let current = 0;
      let autoPlay;
  
      slides.forEach((slide, i) => {
        const slideEl = document.createElement('div');
        slideEl.classList.add('carousel-slide');
        if (i === 0) slideEl.classList.add('active');
        slideEl.innerHTML = `
          <img src="${slide.image}" alt="${slide.title}">
          <div class="carousel-info">
            <p class="modal-subtitle">${slide.subtitle ?? ''}</p>
            <h2 class="modal-title">${slide.title}</h2>
            <p class="modal-desc">${slide.description ?? ''}</p>
            <a href="${slide.link ?? '#'}" class="modal-cta" target="_blank">Buy Now</a>
          </div>
        `;
        track.appendChild(slideEl);
  
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });
  
      const allSlides = track.querySelectorAll('.carousel-slide');
      const allDots = dotsContainer.querySelectorAll('.carousel-dot');
  
      function goTo(index) {
        allSlides[current].classList.remove('active');
        allDots[current].classList.remove('active');
        current = (index + allSlides.length) % allSlides.length;
        allSlides[current].classList.add('active');
        allDots[current].classList.add('active');
      }
  
      function startAutoPlay() {
        autoPlay = setInterval(() => goTo(current + 1), 7000);
      }
  
      function stopAutoPlay() {
        clearInterval(autoPlay);
      }
  
      if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => { stopAutoPlay(); goTo(current - 1); startAutoPlay(); });
        nextBtn.addEventListener('click', () => { stopAutoPlay(); goTo(current + 1); startAutoPlay(); });
      }
  
      startAutoPlay();
  
    } catch (err) {
      console.error('Error loading carousel', err);
    }
  }

  hamburgerSetUp() {
    if (!this.mobileButton || !this.navLinks) return;

    this.mobileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navLinks.classList.toggle('show');
      this.mobileButton.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!this.mobileButton.contains(e.target) && !this.navLinks.contains(e.target)) {
        this.navLinks.classList.remove('show');
        this.mobileButton.classList.remove('active');
      }
    });

    this.navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        this.navLinks.classList.remove('show');
        this.mobileButton.classList.remove('active');
      });
    });
  }

  navBarDelegation() {
    this.navBar.forEach(link => {
      const section = link.dataset.section;
      if (!section) return; 

      link.addEventListener('click', e => {
        e.preventDefault();
        this.resetNav(link);
        link.classList.add('active');

        if (section === 'home') {
          this.loadHome();
        } else {
          this.loadSection(`${BASE_PATH}sections/${section}-section.html`);
        }

        if (this.navLinks.classList.contains('show')) {
          this.navLinks.classList.remove('show');
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
      
      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(section);
      this.updateHeaderState();

      if (url.includes('videos-section.html')) await this.loadVideos(section);
      if (url.includes('music-section.html')) await this.loadMusic(section);
      if (url.includes('live-section.html')) await this.loadLive(section);
      if (url.includes('store-section.html')) await this.loadStore(section);
      if (url.includes('sign-up-section.html')) await this.loadSignUp(section);

    } catch (err) {
      console.error('Error loading section', err);
    }
  }

  async loadHome() {
    try {
      const homeSection = await this.fetchSectionNode(`${BASE_PATH}sections/home-section.html`);
      this.mainContent.innerHTML = '';
      this.mainContent.appendChild(homeSection);
      this.updateHeaderState();
      this.renderFeatureRelease(homeSection);

      const sections = ['live', 'store', 'videos', 'music', 'sign-up'];
  
      for (const sec of sections) {
        try {
          const node = await this.fetchSectionNode(`${BASE_PATH}sections/${sec}-section.html`);
          homeSection.appendChild(node);
  
          if (sec === 'live') await this.loadLive(node);
          if (sec === 'music') await this.loadMusic(node);
          if (sec === 'videos') await this.loadVideos(node);
          if (sec === 'store') await this.loadStore(node);
          if (sec === 'sign-up') await this.loadSignUp(node);
  
        } catch (secErr) {
          console.error(`Failed loading section: ${sec}`, secErr);
        }
      }
  
    } catch (err) {
      console.error('Error loading home', err);
    }
  }

  async loadVideos(section) {
    const loading = section.querySelector('.section-loading');
    try {
      const { data: videos, error } = await getSupabase()
        .from('videos')
        .select('*')
        .order('id', { ascending: true });
  
      if (error) throw error;
      if (loading) loading.remove();
  
      const lightbox = document.createElement('div');
      lightbox.classList.add('video-lightbox', 'hidden');
      lightbox.innerHTML = `
        <div class="video-lightbox-content">
          <button class="video-lightbox-close">✕</button>
          <div class="video-lightbox-frame">
            <iframe allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
          </div>
          <p class="video-lightbox-title"></p>
        </div>
      `;
      document.body.appendChild(lightbox);
  
      const lightboxIframe = lightbox.querySelector('iframe');
      const lightboxTitle = lightbox.querySelector('.video-lightbox-title');
      const closeBtn = lightbox.querySelector('.video-lightbox-close');
  
      const closeLightbox = () => {
        lightbox.classList.add('hidden');
        lightboxIframe.src = '';
      };
  
      closeBtn.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeLightbox();
      });
  
      const grid = document.createElement('div');
      grid.classList.add('video-grid');
  
      videos.forEach(video => {
        let videoId = null;
        const embedMatch = video.src.match(/embed\/([^?]+)/);
        const watchMatch = video.src.match(/[?&]v=([^&]+)/);
        const shortMatch = video.src.match(/youtu\.be\/([^?]+)/);
        if (embedMatch) videoId = embedMatch[1];
        else if (watchMatch) videoId = watchMatch[1];
        else if (shortMatch) videoId = shortMatch[1];
  
        const videoEl = document.createElement('div');
        videoEl.classList.add('video');
  
        const thumb = document.createElement('div');
        thumb.classList.add('video-thumb');
        thumb.style.backgroundImage = `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`;
        thumb.style.cursor = 'pointer';
  
        const playBtn = document.createElement('div');
        playBtn.classList.add('play-btn');
        playBtn.innerHTML = '▶\uFE0E';
        thumb.appendChild(playBtn);
  
        thumb.addEventListener('click', () => {
          lightboxIframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1`;
          lightboxTitle.textContent = video.title;
          lightbox.classList.remove('hidden');
        });
  
        const title = document.createElement('p');
        title.classList.add('video-title');
        title.textContent = video.title;
  
        videoEl.appendChild(thumb);
        videoEl.appendChild(title);
        grid.appendChild(videoEl);
      });
  
      const wrapper = section.querySelector('.video-list') || section;
      wrapper.appendChild(grid);
  
    } catch (err) {
      console.error('Error loading videos', err);
    }
  }

  async loadMusic(section) {
    const loading = section.querySelector('.section-loading');
    try {
      const { data: albums, error } = await getSupabase()
        .from('music')
        .select('*')
        .order('releaseYear', { ascending: false });

      if (error) throw error;
      if (loading) loading.remove();

      const albumsDiv = document.createElement('div');
      albumsDiv.classList.add('albums');

      albums.forEach(album => {
        const albumDiv = document.createElement('div');
        albumDiv.classList.add('album');

        const cover = document.createElement('img');
        cover.src = album.cover;
        cover.loading = 'lazy';

        const title = document.createElement('h2');
        title.textContent = album.title;

        const released = document.createElement('p');
        released.textContent = `Released: ${album.releaseYear}`;

        const streamingDiv = document.createElement('div');
        streamingDiv.classList.add('streaming');

        const platforms = [
          { url: album.spotify, icon: 'assets/img/svg/spotify.svg' },
          { url: album.bandcamp, icon: 'assets/img/svg/bandcamp.svg' },
          { url: album.appleMusic, icon: 'assets/img/svg/apple.svg' },
          { url: album.youtube, icon: 'assets/img/svg/youtube.svg' }
        ];

        platforms.forEach(p => {
          if (!p.url) return;

          const link = document.createElement('a');
          link.href = p.url;
          link.target = '_blank';

          const img = document.createElement('img');
          img.src = p.icon;

          link.appendChild(img);
          streamingDiv.appendChild(link);
        });

        albumDiv.append(cover, title, released, streamingDiv);
        albumsDiv.appendChild(albumDiv);
      });

      section.appendChild(albumsDiv);

    } catch (err) {
      if (loading) loading.textContent = 'Failed to load music.';
      console.error('Error loading music', err);
    }
  }

  async loadStore(section) {
    const loading = section.querySelector('.section-loading');
    try {
      const { data: items, error } = await getSupabase()
        .from('store')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      if (loading) loading.remove();

      const grid = section.querySelector('.store-grid') || section;

      items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('store-item');

        const imageDiv = document.createElement('div');
        imageDiv.classList.add('store-item-image');

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.loading = 'lazy';
        imageDiv.appendChild(img);

        const title = document.createElement('div');
        title.classList.add('store-item-title');
        title.textContent = item.title;

        const shop = document.createElement('a');
        shop.classList.add('button', 'store-shop-button');
        shop.href = item.link || 'https://drag-talk.myspreadshop.com/all';
        shop.target = '_blank';
        shop.textContent = 'Shop';

        itemDiv.appendChild(imageDiv);
        itemDiv.appendChild(title);

        if (item.price) {
          const price = document.createElement('div');
          price.classList.add('store-item-price');
          price.textContent = item.price;
          itemDiv.appendChild(price);
        }

        itemDiv.appendChild(shop);
        grid.appendChild(itemDiv);
      });

    } catch (err) {
      if (loading) loading.textContent = 'Failed to load store.';
      console.error('Error loading store', err);
    }
  }

  async loadLive(section) {
    const loading = section.querySelector('.section-loading');
    try {
      const { data: liveDates, error } = await getSupabase()
        .from('live')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      if (loading) loading.remove();

      const today = new Date();
      today.setHours(0,0,0,0);

      const past = liveDates.filter(d => new Date(d.date) < today);
      const upcoming = liveDates.filter(d => new Date(d.date) >= today);

      const tag = section.querySelector('.section-tag');
      if (tag) tag.textContent = `${today.getFullYear()} TOUR · ${String(upcoming.length).padStart(2, '0')} DATES`;

      const container = document.createElement('div');
      container.classList.add('live-body');

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
      if (loading) loading.textContent = 'Failed to load shows.';
      console.error('Error loading live', err);
    }
  }

  buildDate({date, time, city, country, venue, ticketUrl, soldOut}) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC'
    });
  
    return `
      <div class="tour-info">
        <p class="tour-date">${formattedDate}</p>
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

    pastLink.addEventListener('click', e => {
      e.preventDefault();
      pastLink.classList.add('active');
      upcomingLink.classList.remove('active');
      onPast();
    });
    upcomingLink.addEventListener('click', e => {
      e.preventDefault();
      upcomingLink.classList.add('active');
      pastLink.classList.remove('active');
      onUpcoming();
    });

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

  handleSubmitForm(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const email = form.querySelector('#email').value.trim();
    const firstName = form.querySelector('#first_name').value.trim();
    const lastName = form.querySelector('#last_name').value.trim();
    const country = form.querySelector('#country').value;
    const marketingConsent = form.querySelector('#marketing_email').checked;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.querySelectorAll('.error-msg').forEach(el => el.remove());

    let valid = true;

    if (!email) {
      this.showError(form.querySelector('#email'), 'Email is required');
      valid = false;
    } else if (!emailRegex.test(email)) {
      this.showError(form.querySelector('#email'), 'Invalid email');
      valid = false;
    }

    if (!firstName) {
      this.showError(form.querySelector('#first_name'), 'First name required');
      valid = false;
    }
    if (!lastName) {
      this.showError(form.querySelector('#last_name'), 'Last name required');
      valid = false;
    }

    if (!country) {
      this.showError(form.querySelector('#country'), 'Country required');
      valid = false;
    }

    if (!marketingConsent) {
      this.showError(form.querySelector('#marketing_email'), 'You must agree to receive emails');
      valid = false;
    }

    if (!valid) return;

    window._learnq = window._learnq || [];
    _learnq.push(['identify', {
      $email: email,
      $first_name: firstName,
      $last_name: lastName,
      Country: country,
      Marketing_Email: marketingConsent,
      Source: 'Website Signup'
    }]);
    _learnq.push(['subscribe', { list: 'V4SEtE', email }]);

    form.reset();
    this.showSignupSuccess(form);
  }

  showError(inputEl, message) {
    const error = document.createElement('p');
    error.className = 'error-msg';
    error.textContent = message;
    inputEl.parentNode.appendChild(error);
  }

  showSignupSuccess(form) {
    this.showToast('Thanks for signing up — see you at the show 🤘');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    document.body.appendChild(toast);
  
    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () =>  {
  new BandPage();
});