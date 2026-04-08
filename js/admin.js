if(sessionStorage.getItem('isAdmin') !== 'true') {
  window.location.href = 'login.html';
}

const API_BASE =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/'
    : './data/'; // fallback for GitHub Pages

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
    this.editingId;

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

    [this.liveModal, this.videoModal, this.musicModal].forEach(modal => {
      modal.addEventListener('click', e => e.stopPropagation());
    });

    this.renderLiveShow();
    this.renderVideos();
    this.renderMusic();

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
  }

  async fetchLiveShows() {
    try {
      let response = await fetch(`${API_BASE}live`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      };

      return await response.json();

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
        <td>${show.date}</td>
        <td>${show.time}</td>
        <td>${show.city}</td>
        <td>${show.country}</td>
        <td>${show.venue}</td>
        <td><a href="${show.ticketUrl}" target="_blank">Link</a></td>
        <td>${show.soldOut}</td>
        <td>${show.notes}</td>
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
      let response = await fetch(`${API_BASE}videos`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      };

      return await response.json();

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
        <td>${video.src}</td>
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
      let response = await fetch(`${API_BASE}music`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      };

      return await response.json();

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
  
      const streamingTd = document.createElement('td');
      album.streaming.forEach(link => {
        streamingTd.innerHTML += `<a href="${link.url}" target="_blank" title="${link.platform}" style="margin-right:5px;"><img src="${link.icon}" alt="${link.platform}" style="width:24px;"></a>`;
      });
      tr.appendChild(streamingTd);
  
      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `
        <button class="edit-btn" data-id="${album.id}">Edit</button>
        <button class="delete-btn" data-id="${album.id}">Delete</button>
      `;
      tr.appendChild(actionsTd);
  
      this.musicTable.appendChild(tr);
    });
  }

  async addShow(showData) {
    try {
      let response = await fetch(`${API_BASE}live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(showData)
      });

      if (!response.ok) {
        throw new Error(`There was an HTTP error:${response.status}`)
      }

      return response.json();

    } catch(error) {
      console.error(error);
    }
  }

  async updateShow(show, id) {
    try {
      let response = await fetch(`${API_BASE}live/${id}`, {
        method: 'PUT',
        headers: {
          'Content-type' : 'application/json'
        },
        body: JSON.stringify(show)
      })

      if (!response.ok) {
        throw new Error(`There was an HTTP error ${response.status}`)
      }

      return await response.json();
    } catch(error) {
      console.error(error);
    }
  }

  async handleAddShow(event) {
    event.preventDefault();

    const formData = new FormData(this.liveForm);
    const show = Object.fromEntries(formData.entries());
    show.soldOut = formData.has('soldOut');

    if (
      !show.date ||
      !show.time ||
      !show.city ||
      !show.country ||
      !show.venue
    ) {
      alert('All fields except notes and ticket url are required');
      return;
    }

    if (this.editingId) {
      await this.updateShow(show, this.editingId)
    } else {

      await this.addShow(show);
    }

    this.editingId = null;
    this.liveForm.reset();
    this.closeModal();
    this.renderLiveShow();
  }

  async handleEditShow(id) {
    const shows = await this.fetchLiveShows();
    const show = shows.find(show =>  show.id === id);

    if (!show) return;

    this.liveForm.elements.date.value = show.date;
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
    let confirmed = confirm('Are you sure you want to delete this show?');
    if (!confirmed) return;

    try {
      let response = await fetch(`${API_BASE}live/${id}`, {
        method: 'DELETE'
      })


      if (!response.ok) {
        throw new Error(`There was an HTTP error ${response.status}`)
      }

      this.renderLiveShow();
    } catch(error) {
      console.error(error);
    }
  }

  handleLiveTableClick(event) {
    const editBtn = event.target.closest('.edit');
    const deleteBtn = event.target.closest('.delete');

    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      this.handleEditShow(id);
    }

    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      this.handleDeleteShow(id);
    }

  }

  handleAddVideo() {

  }

  handleAddMusic() {

  }
}





document.addEventListener('DOMContentLoaded', () => {
  new Admin();
})