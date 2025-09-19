// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';
import { fetchPlaceholders, rootLink } from '../../scripts/commerce.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const labels = await fetchPlaceholders();

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.classList.remove('active');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">All Categories</h5><hr />';

/**
 * Sets up the submenu
 * @param {navSection} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(submenu.cloneNode(true));

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  const navTools = nav.querySelector('.nav-tools');

  /** Wishlist */
  const wishlist = document.createRange().createContextualFragment(`
     <div class="wishlist-wrapper nav-tools-wrapper">
       <button type="button" class="nav-wishlist-button" aria-label="Wishlist"></button>
       <div class="wishlist-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(wishlist);

  const wishlistButton = navTools.querySelector('.nav-wishlist-button');

  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta ? new URL(wishlistMeta, window.location).pathname : '/wishlist';

  wishlistButton.addEventListener('click', () => {
    window.location.href = rootLink(wishlistPath);
  });

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  /**
   * Handles loading states for navigation panels with state management
   *
   * @param {HTMLElement} panel - The panel element to manage loading state for
   * @param {HTMLElement} button - The button that triggers the panel
   * @param {Function} loader - Async function to execute during loading
   */
  async function withLoadingState(panel, button, loader) {
    if (panel.dataset.loaded === 'true' || panel.dataset.loading === 'true') return;

    button.setAttribute('aria-busy', 'true');
    panel.dataset.loading = 'true';

    try {
      await loader();
      panel.dataset.loaded = 'true';
    } finally {
      panel.dataset.loading = 'false';
      button.removeAttribute('aria-busy');

      // Execute pending toggle if exists
      if (panel.dataset.pendingToggle === 'true') {
        // eslint-disable-next-line no-nested-ternary
        const pendingState = panel.dataset.pendingState === 'true' ? true : (panel.dataset.pendingState === 'false' ? false : undefined);

        // Clear pending flags
        panel.removeAttribute('data-pending-toggle');
        panel.removeAttribute('data-pending-state');

        // Execute the pending toggle
        const show = pendingState ?? !panel.classList.contains('nav-tools-panel--show');
        panel.classList.toggle('nav-tools-panel--show', show);
      }
    }
  }

  function togglePanel(panel, state) {
    // If loading is in progress, queue the toggle action
    if (panel.dataset.loading === 'true') {
      // Store the pending toggle action
      panel.dataset.pendingToggle = 'true';
      panel.dataset.pendingState = state !== undefined ? state.toString() : '';
      return;
    }

    const show = state ?? !panel.classList.contains('nav-tools-panel--show');
    panel.classList.toggle('nav-tools-panel--show', show);
  }

  // Lazy loading for mini cart fragment
  async function loadMiniCartFragment() {
    await withLoadingState(minicartPanel, cartButton, async () => {
      const miniCartMeta = getMetadata('mini-cart');
      const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
      const miniCartFragment = await loadFragment(miniCartPath);
      minicartPanel.append(miniCartFragment.firstElementChild);
    });
  }

  async function toggleMiniCart(state) {
    if (state) {
      await loadMiniCartFragment();
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }

    togglePanel(minicartPanel, state);
  }

  cartButton.addEventListener('click', () => toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show')));

  // Cart Item Counter
  events.on('cart/data', (data) => {
    // preload mini cart fragment if user has a cart
    if (data) loadMiniCartFragment();

    if (data?.totalQuantity) {
      cartButton.setAttribute('data-count', data.totalQuantity);
    } else {
      cartButton.removeAttribute('data-count');
    }
  }, { eager: true });

  /** Search */
  const searchFragment = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form id="search-bar-form"></form>
      <div class="search-bar-result" style="display: none;"></div>
    </div>
  </div>
  `);

  navTools.append(searchFragment);

  const searchPanel = navTools.querySelector('.nav-search-panel');
  const searchButton = navTools.querySelector('.nav-search-button');
  const searchForm = searchPanel.querySelector('#search-bar-form');
  const searchResult = searchPanel.querySelector('.search-bar-result');

  async function toggleSearch(state) {
    const pageSize = 4;

    if (state) {
      await withLoadingState(searchPanel, searchButton, async () => {
        await import('../../scripts/initializers/search.js');

        // Load search components in parallel
        const [
          { search },
          { render },
          { SearchResults },
          { provider: UI, Input, Button },
        ] = await Promise.all([
          import('@dropins/storefront-product-discovery/api.js'),
          import('@dropins/storefront-product-discovery/render.js'),
          import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
          import('@dropins/tools/components.js'),
          import('@dropins/tools/lib.js'),
        ]);

        render.render(SearchResults, {
          skeletonCount: pageSize,
          scope: 'popover',
          routeProduct: ({ urlKey, sku }) => rootLink(`/products/${urlKey}/${sku}`),
          onSearchResult: (results) => {
            searchResult.style.display = results.length > 0 ? 'block' : 'none';
          },
          slots: {
            ProductImage: (ctx) => {
              const { product, defaultImageProps } = ctx;
              const anchorWrapper = document.createElement('a');
              anchorWrapper.href = rootLink(`/products/${product.urlKey}/${product.sku}`);

              tryRenderAemAssetsImage(ctx, {
                alias: product.sku,
                imageProps: defaultImageProps,
                wrapper: anchorWrapper,
                params: {
                  width: defaultImageProps.width,
                  height: defaultImageProps.height,
                },
              });
            },
            Footer: async (ctx) => {
              // View all results button
              const viewAllResultsWrapper = document.createElement('div');

              const viewAllResultsButton = await UI.render(Button, {
                children: labels.Global?.SearchViewAll,
                variant: 'secondary',
                href: rootLink('/search'),
              })(viewAllResultsWrapper);

              ctx.appendChild(viewAllResultsWrapper);

              ctx.onChange((next) => {
                viewAllResultsButton?.setProps((prev) => ({
                  ...prev,
                  href: `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`,
                }));
              });
            },
          },
        })(searchResult);

        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = e.target.search.value;
          if (query.length) {
            window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(query)}`;
          }
        });

        UI.render(Input, {
          name: 'search',
          placeholder: labels.Global?.Search,
          onValue: (phrase) => {
            if (!phrase) {
              search(null, { scope: 'popover' });
              return;
            }

            if (phrase.length < 3) {
              return;
            }

            search({
              phrase,
              pageSize,
            }, { scope: 'popover' });
          },
        })(searchForm);
      });
    }

    togglePanel(searchPanel, state);
    if (state) searchForm?.querySelector('input')?.focus();
  }

  searchButton.addEventListener('click', () => toggleSearch(!searchPanel.classList.contains('nav-tools-panel--show')));

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    // Check if undo is enabled for mini cart
    const miniCartElement = document.querySelector(
      '[data-block-name="commerce-mini-cart"]',
    );
    const undoEnabled = miniCartElement
      && (miniCartElement.textContent?.includes('undo-remove-item')
        || miniCartElement.innerHTML?.includes('undo-remove-item'));

    // For mini cart: if undo is enabled, be more restrictive about when to close
    const shouldCloseMiniCart = undoEnabled
      ? !minicartPanel.contains(e.target)
      && !cartButton.contains(e.target)
      && !e.target.closest('header')
      : !minicartPanel.contains(e.target) && !cartButton.contains(e.target);

    if (shouldCloseMiniCart) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  // Create scrolling banner
  const scrollingBanner = document.createElement('div');
  scrollingBanner.className = 'scrolling-banner';
  scrollingBanner.innerHTML = `
    <div class="scrolling-banner-content">
      <div class="banner-item">
        <a href="/sale">🔥 UP TO 70% OFF - END OF SEASON SALE</a>
      </div>
      <div class="banner-item">
        <a href="/shipping">🚚 FREE SHIPPING ON ORDERS OVER £79.99</a>
      </div>
      <div class="banner-item">
        <a href="/new-arrivals">✨ FOCUS ON PRE-FALL '25 : SHOP THE EDIT</a>
      </div>
      <div class="banner-item">
        <a href="/membership">👑 NEW IN: ACNE | FRIZMWORKS | PATAGONIA</a>
      </div>
      <div class="banner-item">
        <a href="/sustainability">🌱 SHOP SUSTAINABLE FASHION</a>
      </div>
    </div>
  `;

  // Create top black bar
  const topBar = document.createElement('div');
  topBar.className = 'top-bar';
  topBar.innerHTML = `
    <div class="top-bar-content">
      <div class="top-bar-left">
        <a href="/men">MEN</a>
        <a href="/women">WOMEN</a>
      </div>
      <div class="top-bar-center">
         <div class="top-bar-gif">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="_logo_gk4wp_59 _logo_136en_185" aria-label="Go to On Homepage" role="img"><path d="M36.281 11.384c-.056.058-.114.13-.17.188l-2.364 2.41-.057.058c-.057.072-.057.145.014.247a8.331 8.331 0 0 1 1.096 3.309c.257 2.409-.342 4.571-1.822 6.473-1.268 1.625-2.92 2.64-4.899 3.09-.911.204-1.837.218-2.762.117-1.524-.16-2.891-.726-4.116-1.655-1.766-1.335-2.862-3.105-3.318-5.311-.17-.813-.199-1.64-.128-2.453.171-1.901.883-3.585 2.15-5.022 1.21-1.379 2.692-2.278 4.443-2.685a8.03 8.03 0 0 1 2.635-.189 8.5 8.5 0 0 1 3.588 1.147c.142.087.2.029.285-.058l2.35-2.395c.056-.058.113-.13.185-.217l2.889 2.945.001.001Zm-5.342 7.4c.071-2.8-2.093-4.832-4.529-4.905-2.748-.073-4.798 2.25-4.798 4.76 0 2.57 2.122 4.79 4.67 4.746 2.507.03 4.6-2.076 4.656-4.6Zm3.605 19.391c.014 2.351 0 4.717 0 7.068v.32h-4.13v-.29c0-2.468.015-4.935 0-7.403 0-1.291-.44-2.423-1.366-3.323a3.827 3.827 0 0 0-2.208-1.06c-1.11-.16-2.121.117-3.018.799-.898.696-1.424 1.64-1.595 2.757-.086.537-.1 1.089-.1 1.64-.014 2.192 0 4.369 0 6.56v.305h-4.101v-.276c0-2.656-.029-5.326.014-7.982.029-1.408.47-2.743 1.196-3.962 1.21-2.032 2.934-3.338 5.198-3.875a8.414 8.414 0 0 1 2.178-.203c2.265.101 4.201 1.015 5.74 2.742 1.096 1.248 1.794 2.7 2.036 4.369.098.608.155 1.217.155 1.812"></path></svg>
     </div>
     </div>
      <div class="top-bar-right">
        <select class="country-selector" aria-label="Select country">
          <option value="us">US</option>
          <option value="eu"${window.sessionStorage.getItem('countryCode') === 'eu' ? 'selected' : ''}>DE</option>
          <option value="us-vip"${window.sessionStorage.getItem('countryCode') === 'us-vip' ? 'selected' : ''}>US VIP</option>
        </select>
       
        <a href="/help">Help</a>
        <a href="/account">Account</a>
      </div>
    </div>
  `;

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(scrollingBanner);
  block.append(topBar);
  block.append(navWrapper);

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  const selectElement = document.querySelector(".country-selector");

  selectElement.addEventListener("change", (event) => {
    const configJSON = JSON.parse(window.sessionStorage.getItem('config'));
    if(event.target.value === 'eu') {
      configJSON['public']['default']['headers']['cs']['Magento-Store-View-Code'] = 'de';
      configJSON['public']['default']['headers']['cs']['AC-Source-Locale'] = 'de';
      configJSON['public']['default']['headers']['cs']['AC-Price-Book-ID'] = 'eu';
    } 
     if(event.target.value === 'us-vip') {
      configJSON['public']['default']['headers']['cs']['Magento-Store-View-Code'] = 'en';
      configJSON['public']['default']['headers']['cs']['AC-Source-Locale'] = 'en';
      configJSON['public']['default']['headers']['cs']['AC-Price-Book-ID'] = 'vip';
    }
    else {
      configJSON['public']['default']['headers']['cs']['Magento-Store-View-Code'] = 'en';
      configJSON['public']['default']['headers']['cs']['AC-Source-Locale'] = 'en';
      configJSON['public']['default']['headers']['cs']['AC-Price-Book-ID'] = 'us';
    }

    window.sessionStorage.setItem('countryCode', event.target.value);

    configJSON[':expiry'] = Math.round(Date.now() / 1000) + 7200;
    window.sessionStorage.setItem('config', JSON.stringify(configJSON));

    // Handle URL locale switching based on target value
    let newUrl = window.location.href;
    let urlChanged = false;
    
    // Split URL to get protocol+domain and path parts
    const urlParts = newUrl.split('/', 3); // ['https:', '', 'domain.com']
    const baseUrl = urlParts.join('/'); // 'https://domain.com'
    const pathPart = newUrl.substring(baseUrl.length); // everything after domain
    
    if(event.target.value === 'eu') {
      // Switch to German locale
      if(newUrl.includes('/en/')) {
        newUrl = newUrl.replace('/en/', '/de/');
        urlChanged = true;
      }
      // Only replace -en patterns in the path part (after first /)
      if(pathPart.includes('-en')) {
        const newPathPart = pathPart.replace(/-en/g, '-de');
        newUrl = baseUrl + newPathPart;
        urlChanged = true;
      }
    } else {
      // Switch to English locale (us)
      if(newUrl.includes('/de/')) {
        newUrl = newUrl.replace('/de/', '/en/');
        urlChanged = true;
      }
      // Only replace -de patterns in the path part (after first /)
      if(pathPart.includes('-de')) {
        const newPathPart = pathPart.replace(/-de/g, '-en');
        newUrl = baseUrl + newPathPart;
        urlChanged = true;
      }
    }
    
    // Only navigate if URL actually changed
    if(urlChanged) {
      window.location.href = newUrl;
    } else {
      // If no URL patterns matched, just reload to apply the new config
      window.location.reload();
    }

  });


  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}
