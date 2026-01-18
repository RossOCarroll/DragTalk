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
      console.log(html);
      this.mainContent.innerHTML = html;
    } catch(err) {
      console.error('Error loading page', err);
      
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