import { createClient } from '@supabase/supabase-js';

const BASE_PATH = import.meta.env.BASE_URL;

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

const { data: { session } } = await getSupabase().auth.getSession();
if (!session) {
  window.location.href = `${BASE_PATH}login.html`;
}

class Admin {
  constructor() {
    this.liveSection = document.getElementById('live-admin');
    this.liveTable = document.getElementById('live-table');
    this.musicSection = document.getElementById('music-admin');
    this.musicTable = document.getElementById('music-table');
    this.videosSection = document.getElementById('videos-admin');
    this.videoTable = document.getElementById('video-table');
    this.addShowBtn = document.getElementById('add-live-btn');
    this.addVideoBtn = document.getElementById('add-video-btn');
    this.addMusicBtn = document.getElementById('add-music-btn');
    this.cancelBtns = document.querySelectorAll('.cancel-btn');
    this.liveForm = document.getElementById('live-form');
    this.videoForm = document.getElementById('video-form');
    this.musicForm = document.getElementById('music-form');
    this.signOutBtn = document.getElementById('signout-btn');
    this.carouselTable = document.getElementById('carousel-table');
    this.carouselForm = document.getElementById('carousel-form');
    this.carouselModal = document.getElementById('carousel-modal');
    this.addCarouselBtn = document.getElementById('add-carousel-btn');

    this.editingId = null;

    this.cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    })

    this.modalLayer = document.getElementById('modal-layer');
    this.liveModal = document.getElementById('live-modal');
    this.videoModal = document.getElementById('video-modal');
    this.musicModal = document.getElementById('music-modal');
  
    this.addShowBtn.addEventListener('click', () => this.openModal(this.liveModal));
    this.modalLayer.addEventListener('click', () => this.closeModal());
    this.addVideoBtn.addEventListener('click', () => this.openModal(this.videoModal));
    this.addMusicBtn.addEventListener('click', () => this.openModal(this.musicModal));
    this.liveForm.addEventListener('submit', (event) => this.handleAddShow(event));
    this.liveTable.addEventListener('click', (event) => this.handleLiveTableClick(event));
    this.videoTable.addEventListener('click', (event) => this.handleVideoTableClick(event));
    this.musicTable.addEventListener('click', (event) => this.handleMusicTableClick(event));
    this.videoForm.addEventListener('submit', (event) => this.handleAddVideo(event));
    this.musicForm.addEventListener('submit', (event) => this.handleAddMusic(event));
    this.signOutBtn.addEventListener('click', () => this.signOut());
    this.addCarouselBtn.addEventListener('click', () => this.openModal(this.carouselModal));
    this.carouselForm.addEventListener('submit', e => this.handleAddCarousel(e));
    this.carouselTable.addEventListener('click', e => this.handleCarouselTableClick(e));

    [this.liveModal, this.videoModal, this.musicModal, this.carouselModal].forEach(modal => {
      modal.addEventListener('click', e => e.stopPropagation());
    });

    document.querySelectorAll('.section-toggle').forEach(heading => {
      heading.addEventListener('click', () => {
        const content = heading.nextElementSibling;
        const icon = heading.querySelector('.toggle-icon');
        const isExpanded = content.classList.toggle('expanded');
        icon.textContent = isExpanded ? '▼' : '▶';
      });
    });

    this.renderLiveShow();
    this.renderVideos();
    this.renderMusic();
    this.renderCarousel();

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        await getSupabase().auth.signOut();
        window.location.href = `${BASE_PATH}login.html`;
      }, 30 * 60 * 1000); // 30 minutes
    };

    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('click', resetTimer);
    resetTimer();

  }

  openModal(modal) {
    this.modalLayer.classList.remove('hidden');
    modal.classList.remove('hidden');
  }

  closeModal() {
    this.modalLayer.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    })
    this.editingId = null;
    this.liveForm.reset();
    this.musicForm.reset();
    this.videoForm.reset();
    this.carouselForm.reset();
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC'
    });
  }

  normalizeYouTubeUrl(url) {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    const embedMatch = url.match(/embed\/([^?]+)/);
  
    let videoId = null;
    if (watchMatch) videoId = watchMatch[1];
    else if (shortMatch) videoId = shortMatch[1];
    else if (embedMatch) videoId = embedMatch[1];
  
    if (!videoId) throw new Error('Invalid YouTube URL');
    return `https://www.youtube.com/embed/${videoId}`;
  }

  async fetchLiveShows() {
    try {
      const { data: live, error } = await getSupabase()
        .from('live')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      return live;

    } catch(error) {
      console.error(error)
    }
  }

  async renderLiveShow() {
    const shows = await this.fetchLiveShows();
    
    this.liveTable.innerHTML = '';
    this.liveTable.innerHTML = `
    <tr>
      <th>Date</th><th>Time</th><th>City</th><th>Country</th>
      <th>Venue</th><th>Tickets</th><th>Sold Out</th><th>Notes</th><th>Actions</th>
    </tr>
    `;

    shows.forEach(show => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.formatDate(show.date)}</td>
        <td>${show.time}</td>
        <td>${show.city}</td>
        <td>${show.country}</td>
        <td>${show.venue}</td>
        <td><a href="${show.ticketUrl}" target="_blank">Link</a></td>
        <td>${show.soldOut ? 'Yes' : 'No'}</td>
        <td>${show.notes || ''}</td>
        <td>
          <button class="button edit" data-id="${show.id}">Edit</button>
          <button class="button delete" data-id="${show.id}">Delete</button>
        </td>
      `
      row.dataset.id = show.id;
      this.liveTable.appendChild(row);
    })
  }

  async fetchVideos() {
    try {
      const { data: videos, error } = await getSupabase()
        .from('videos')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return videos;

    } catch(error) {
      console.error(error)
    }
  }

  async renderVideos() {
    const videos = await this.fetchVideos();
    
    this.videoTable.innerHTML = '';
    this.videoTable.innerHTML = `
    <tr>
      <th>Title</th><th>link</th><th>Actions</th>
    </tr>
    `;

    videos.forEach(video => {
      const row = document.createElement('tr');
      row.dataset.id = video.id;
      row.innerHTML = `
        <td>${video.title}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${video.src}</td>
        <td>
          <button class="button edit" data-id="${video.id}">Edit</button>
          <button class="button delete" data-id="${video.id}">Delete</button>
        </td>
      `
      this.videoTable.appendChild(row);
    })
  }

  async fetchMusic() {
    try {
      const { data: music, error } = await getSupabase()
        .from('music')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return music;

    } catch(error) {
      console.error(error)
    }
  }

  async renderMusic() {
    const albums = await this.fetchMusic();

    this.musicTable.innerHTML = '';
    this.musicTable.innerHTML = `
    <tr>
      <th>Cover</th><th>Title</th><th>Year</th><th>Streaming</th><th>Actions</th>
    </tr>
    `;

    albums.forEach(album => {
      const tr = document.createElement('tr');
  
      const coverTd = document.createElement('td');
      coverTd.innerHTML = `<img src="${album.cover}" alt="${album.title}" style="width:50px; height:auto;">`;
      tr.appendChild(coverTd);
  
      const titleTd = document.createElement('td');
      titleTd.textContent = album.title;
      tr.appendChild(titleTd);
  
      const yearTd = document.createElement('td');
      yearTd.textContent = album.releaseYear;
      tr.appendChild(yearTd);

      const platforms = [
        { url: album.spotify, icon: 'assets/img/svg/spotify.svg', name: 'Spotify' },
        { url: album.bandcamp, icon: 'assets/img/svg/bandcamp.svg', name: 'Bandcamp' },
        { url: album.appleMusic, icon: 'assets/img/svg/apple.svg', name: 'Apple Music' },
        { url: album.youtube, icon: 'assets/img/svg/youtube.svg', name: 'YouTube' }
      ];
  
      const streamingTd = document.createElement('td');
      const streamingHtml = platforms
        .filter(p => p.url)
        .map(p => `<a href="${p.url}" target="_blank" title="${p.name}" style="margin-right:5px;"><img src="${p.icon}" alt="${p.name}" style="width:24px; vertical-align:middle;"></a>`)
        .join('');
      streamingTd.innerHTML = streamingHtml;
      tr.appendChild(streamingTd);
  
      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `
        <button class="button edit" data-id="${album.id}">Edit</button>
        <button class="button delete" data-id="${album.id}">Delete</button>
      `;
      tr.appendChild(actionsTd);
  
      this.musicTable.appendChild(tr);
    });
  }

  async addShow(show) {
    try {
      const { error } = await getSupabase()
        .from('live')
        .insert(show);
      if (error) throw error;
    } catch (error) {
      console.error('Error adding show', error);
    }
  }

  async updateShow(show, id) {
    try {
      const { error } = await getSupabase()
        .from('live')
        .update(show)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating show', error);
    }
  }

  async handleAddShow(event) {
    event.preventDefault();
  
    const formData = new FormData(this.liveForm);
    const show = Object.fromEntries(formData.entries());
    
    const payload = {
      date: show.date,
      time: show.time,
      city: show.city,
      country: show.country,
      venue: show.venue,
      ticketUrl: show.ticketUrl,
      soldOut: formData.has('soldOut'),
      notes: show.notes
    };
  
    if (!payload.date || !payload.time || !payload.city || !payload.country || !payload.venue) {
      alert('All fields except notes and ticket url are required');
      return;
    }
  
    if (this.editingId) {
      await this.updateShow(payload, this.editingId);
    } else {
      await this.addShow(payload);
    }
  
    this.editingId = null;
    this.liveForm.reset();
    this.closeModal();
    this.renderLiveShow();
  }

  async handleEditShow(id) {
    const shows = await this.fetchLiveShows();
    const show = shows.find(show => String(show.id) === String(id));

    if (!show) return;

    this.liveForm.elements.date.value = show.date ? show.date.slice(0, 10) : '';
    this.liveForm.elements.time.value = show.time;
    this.liveForm.elements.city.value = show.city;
    this.liveForm.elements.country.value = show.country;
    this.liveForm.elements.venue.value = show.venue;
    this.liveForm.elements.ticketUrl.value = show.ticketUrl || '';
    this.liveForm.elements.notes.value = show.notes || '';
    this.liveForm.elements.soldOut.checked = !!show.soldOut;
    
    this.openModal(this.liveModal);
    this.editingId = id;
  }

  async handleDeleteShow(id) {
    if (!confirm('Are you sure you want to delete this show?')) return;
    try {
      const { error } = await getSupabase()
        .from('live')
        .delete()
        .eq('id', id);
      if (error) throw error;
      this.renderLiveShow();
    } catch (error) {
      console.error('Error deleting show', error);
    }
  }

  handleLiveTableClick(event) {
    const editBtn = event.target.closest('.edit');
    const deleteBtn = event.target.closest('.delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      this.handleEditShow(id);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      this.handleDeleteShow(id);
    }
  }

  async addVideo(video) {
    try {
      const { error } = await getSupabase()
        .from('videos')
        .insert(video);
      if (error) throw error;
    } catch (error) {
      console.error('Error adding video', error);
    }
  }

  handleVideoTableClick(event) {
    const editBtn = event.target.closest('.edit');
    const deleteBtn = event.target.closest('.delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      this.handleEditVideo(id);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      this.handleDeleteVideo(id);
    }
  }

  async updateVideo(video, id) {
    try {
      const { error } = await getSupabase()
        .from('videos')
        .update(video)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating show', error);
    }
  }

  async handleAddVideo(event) {
    event.preventDefault();
    const formData = new FormData(this.videoForm);
    const videoInfo = Object.fromEntries(formData.entries());
  
    const payload = {
      title: videoInfo.title,
      src: videoInfo.src
    };
  
    if (!payload.title || !payload.src) {
      alert('Must add fields title and url');
      return;
    }
  
    try {
      payload.src = this.normalizeYouTubeUrl(payload.src);
    } catch (e) {
      alert('Please enter a valid YouTube URL');
      return;
    }
  
    if (this.editingId) {
      await this.updateVideo(payload, this.editingId);
    } else {
      await this.addVideo(payload);
    }
  
    this.editingId = null;
    this.videoForm.reset();
    this.closeModal();
    this.renderVideos();
  }

  async handleDeleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const { error } = await getSupabase()
        .from('videos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      this.renderVideos();
    } catch (error) {
      console.error('Error deleting show', error);
    }
  }

  async handleEditVideo(id) {
    const videos = await this.fetchVideos();
    const video = videos.find(v => String(v.id) === String(id));

    if (!video) return;
    console.log(video);

    this.videoForm.elements.title.value = video.title;
    this.videoForm.elements.src.value = video.src;

    this.editingId = id;

    this.openModal(this.videoModal);
  }

  async updateMusic(payload, id) {
    try {
      const { error } = await getSupabase()
        .from('music')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating music', error);
    }
  }

  async uploadCover(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await getSupabase()
      .storage
      .from('covers')
      .upload(fileName, file);
  
    if (error) throw new Error(error);
  
    const { data: { publicUrl } } = getSupabase()
      .storage
      .from('covers')
      .getPublicUrl(fileName);
  
    return publicUrl;
  }
  
  async handleAddMusic(event) {
    event.preventDefault();
    const formData = new FormData(this.musicForm);
    const musicInfo = Object.fromEntries(formData.entries());
    const coverFile = this.musicForm.querySelector('#music-cover').files[0];
  
    if (!musicInfo.title || !musicInfo.releaseYear) {
      alert('Title and release year are required');
      return;
    }
  
    if (!this.editingId && !coverFile) {
      alert('Cover image is required');
      return;
    }
  
    try {
      let coverUrl;
      if (coverFile) coverUrl = await this.uploadCover(coverFile);
  
      const payload = {
        title: musicInfo.title,
        releaseYear: musicInfo.releaseYear,
        spotify: musicInfo.spotify || null,
        bandcamp: musicInfo.bandcamp || null,
        appleMusic: musicInfo.apple || null,
        youtube: musicInfo.youtube || null
      };
  
      if (coverUrl) payload.cover = coverUrl;
  
      if (this.editingId) {
        await this.updateMusic(payload, this.editingId);
      } else {
        const { error } = await getSupabase().from('music').insert(payload);
        if (error) throw error;
      }
  
      this.editingId = null;
      this.musicForm.reset();
      this.closeModal();
      this.renderMusic();
    } catch (err) {
      console.error(err);
    }
  }

  async handleDeleteMusic(id) {
    if (!confirm('Are you sure you want to delete this album?')) return;
    try {
      const { error } = await getSupabase()
        .from('music')
        .delete()
        .eq('id', id);
      if (error) throw error;
      this.renderMusic();
    } catch (error) {
      console.error('Error deleting show', error);
    }
  }

  handleMusicTableClick(event) {
    const editBtn = event.target.closest('.edit');
    const deleteBtn = event.target.closest('.delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      this.handleEditMusic(id);
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      this.handleDeleteMusic(id);
    }
  }

  async handleEditMusic(id) {
    const albums = await this.fetchMusic();
    const album = albums.find(album => String(album.id) === String(id));
    if (!album) return;
  
    this.musicForm.elements.title.value = album.title;
    this.musicForm.elements.releaseYear.value = album.releaseYear ?? '';
    this.musicForm.elements.spotify.value = album.spotify ?? '';
    this.musicForm.elements.bandcamp.value = album.bandcamp ?? '';
    this.musicForm.elements.apple.value = album.appleMusic ?? '';
    this.musicForm.elements.youtube.value = album.youtube ?? '';
  
    this.editingId = id;
    this.openModal(this.musicModal);
  }

  async signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      console.error(`Error signing out: ${error}`);
      return;
    };
    window.location.href = `${BASE_PATH}login.html`;
  }

  async fetchCarousel() {
    try {
      const { data, error } = await getSupabase()
        .from('carousel')
        .select('*')
        .order('order', { ascending: true });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching carousel', error);
    }
  }

  async renderCarousel() {
    const slides = await this.fetchCarousel();
    if (!slides) return;

    this.carouselTable.innerHTML = `
      <tr>
        <th>Image</th><th>Title</th><th>Subtitle</th><th>Description</th><th>Link</th><th>Order</th><th>Actions</th>
      </tr>
    `;

    slides.forEach(slide => {
      const row = document.createElement('tr');
      row.dataset.id = slide.id;
      row.innerHTML = `
        <td><img src="${slide.image}" alt="${slide.title}" style="width:50px; height:auto;"></td>
        <td>${slide.title}</td>
        <td>${slide.subtitle ?? ''}</td>
        <td>${slide.description ?? ''}</td>
        <td>${slide.link ?? ''}</td>
        <td>${slide.order ?? ''}</td>
        <td>
          <button class="button edit" data-id="${slide.id}">Edit</button>
          <button class="button delete" data-id="${slide.id}">Delete</button>
        </td>
      `;
      this.carouselTable.appendChild(row);
    });
  }

  async uploadCarouselImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await getSupabase()
      .storage
      .from('covers')
      .upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = getSupabase()
      .storage
      .from('covers')
      .getPublicUrl(fileName);
    return publicUrl;
  }

  async handleAddCarousel(event) {
    event.preventDefault();
    const formData = new FormData(this.carouselForm);
    const info = Object.fromEntries(formData.entries());
    const imageFile = this.carouselForm.querySelector('#carousel-cover').files[0];

    if (!info.title) {
      alert('Title is required');
      return;
    }

    if (!this.editingId && !imageFile) {
      alert('Image is required');
      return;
    }

    try {
      let imageUrl;
      if (imageFile) imageUrl = await this.uploadCarouselImage(imageFile);

      const payload = {
        title: info.title,
        subtitle: info.subtitle || null,
        description: info.description || null,
        link: info.link || null,
        order: info.order ? parseInt(info.order) : null
      };

      if (imageUrl) payload.image = imageUrl;

      if (this.editingId) {
        await getSupabase().from('carousel').update(payload).eq('id', this.editingId);
      } else {
        await getSupabase().from('carousel').insert(payload);
      }

      this.editingId = null;
      this.carouselForm.reset();
      this.closeModal();
      this.renderCarousel();
    } catch (err) {
      console.error('Error saving carousel slide', err);
    }
  }

  async handleEditCarousel(id) {
    const slides = await this.fetchCarousel();
    const slide = slides.find(s => String(s.id) === String(id));
    if (!slide) return;

    this.carouselForm.elements.title.value = slide.title ?? '';
    this.carouselForm.elements.subtitle.value = slide.subtitle ?? '';
    this.carouselForm.elements.description.value = slide.description ?? '';
    this.carouselForm.elements.link.value = slide.link ?? '';
    this.carouselForm.elements.order.value = slide.order ?? '';

    this.editingId = id;
    this.openModal(this.carouselModal);
  }

  async handleDeleteCarousel(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
      const { error } = await getSupabase()
        .from('carousel')
        .delete()
        .eq('id', id);
      if (error) throw error;
      this.renderCarousel();
    } catch (error) {
      console.error('Error deleting slide', error);
    }
  }

  handleCarouselTableClick(event) {
    const editBtn = event.target.closest('.edit');
    const deleteBtn = event.target.closest('.delete');
    if (editBtn) this.handleEditCarousel(editBtn.dataset.id);
    if (deleteBtn) this.handleDeleteCarousel(deleteBtn.dataset.id);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Admin());
} else {
  new Admin();
}