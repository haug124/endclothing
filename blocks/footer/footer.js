import { getRootPath, isMultistore } from '@dropins/tools/lib/aem/configs.js';
// Dropin Components
import {
  Button,
  provider as UI,
} from '@dropins/tools/components.js';

// Block-level
import createModal from '../modal/modal.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Toggles all storeSelector sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleStoreDropdown(sections, expanded = false) {
  sections
    .querySelectorAll('.storeview-modal .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const root = getRootPath();
  // Load Footer as Fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');

  // Footer content - Mailing List Section
  footer.innerHTML = `
    <div class="footer-mailing-list">
      <div class="mailing-list-content">
        <div class="mailing-list-text">
          <h3>SIGN UP TO THE END. MENSWEAR MAILING LIST</h3>
          <p>Sign up to hear about exclusive early sale access, and new collections. You can unsubscribe at any time. For details on how to do this and how we use your data, please see our <strong>Privacy Policy</strong>.</p>
        </div>
        <div class="mailing-list-form">
          <input type="email" placeholder="EMAIL ADDRESS" class="email-input">
          <button class="signup-button">SIGN UP</button>
        </div>
      </div>
      <div class="social-icons">
        <a href="#" class="social-icon instagram"></a>
        <a href="#" class="social-icon twitter"></a>
        <a href="#" class="social-icon facebook"></a>
      </div>
    </div>
    
    <div class="footer-navigation">
      <div class="nav-column">
        <h4>ABOUT</h4>
        <ul>
          <li><a href="/our-purpose">Our Purpose</a></li>
          <li><a href="/careers">Careers</a></li>
          <li><a href="/affiliates">Affiliates</a></li>
          <li><a href="/press">Press</a></li>
          <li><a href="/stores">Stores</a></li>
        </ul>
      </div>
      <div class="nav-column">
        <h4>CUSTOMER SERVICE</h4>
        <ul>
          <li><a href="/help">Help</a></li>
          <li><a href="/shipping">Shipping</a></li>
          <li><a href="/returns">Returns</a></li>
          <li><a href="/payments">Payments</a></li>
          <li><a href="/your-order">Your Order</a></li>
        </ul>
      </div>
      <div class="nav-column">
        <h4>CONTACT US</h4>
        <ul>
          <li><a href="/email-us">Email us</a></li>
        </ul>
      </div>
      <div class="nav-column">
        <h4>Apps & Gift Cards</h4>
        <div class="app-buttons">
          <button class="app-button end-apps">Our Apps</button>
          <button class="app-button gift-cards">Gift Cards</button>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="footer-bottom-content">
        <div class="footer-left">
          <div class="footer-logo">END.20</div>
          <div class="footer-links">
            <a href="/terms">Terms & Conditions</a>
            <a href="/cookies">Cookie Settings</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/other-policies">Other Policies</a>
            <a href="/sitemap">Sitemap</a>
          </div>
        </div>
        <div class="footer-center">
        </div>
        <div class="footer-right">
          <div class="payment-methods">
            <span class="payment-icon mastercard"></span>
            <span class="payment-icon amex"></span>
            <span class="payment-icon discover"></span>
            <span class="payment-icon jcb"></span>
            <span class="payment-icon visa"></span>
            <span class="payment-icon paypal"></span>
            <span class="payment-icon klarna"></span>
            <span class="payment-icon clearpay"></span>
          </div>
          <div class="copyright">
            Copyright © Ashworth and Parker Limited (t/a END.) 2025 | All Rights Reserved<br>
            Company registration number: 06866013 | VAT number: GB 389764913
          </div>
        </div>
      </div>
    </div>
  `;

  // Mailing list functionality
  const emailInput = footer.querySelector('.email-input');
  const signupButton = footer.querySelector('.signup-button');
  
  signupButton.addEventListener('click', () => {
    const email = emailInput.value;
    if (email && email.includes('@')) {
      // Handle email signup
      console.log('Email signup:', email);
      emailInput.value = '';
    }
  });

  // Store Switcher (if multistore)
  if (isMultistore()) {
    const storeSwitcherDiv = document.createElement('div');
    storeSwitcherDiv.className = 'storeview-switcher-button';
    footer.appendChild(storeSwitcherDiv);

    // Container and component refs
    let modal;

    // Modal Actions
    const showModal = async (content) => {
      modal = await createModal([content]);
      modal.showModal();
    };

    // Rendering the Store Switcher Modal Content
    const $storeSwitcherBtn = footer.querySelector(
      '.storeview-switcher-button',
    );

    // Store Switcher Modal Content
    const storeSwitcherPath = '/store-switcher';
    let fragmentStoreView;

    try {
      fragmentStoreView = await loadFragment(storeSwitcherPath);
      if (!fragmentStoreView) throw new Error(`Footer does not render due to Store Switcher fragment (${storeSwitcherPath}) not found`);
    } catch (error) {
      console.error('Error loading store switcher fragment:', error);
      return;
    }

    // Store Switcher Modal Content
    const storeSwitcher = document.createElement('div');

    // Return Storename from stores-switcher
    const selected = [...fragmentStoreView.querySelectorAll('a')].find((a) => {
      const url = new URL(a.href);
      return url.pathname.startsWith(root);
    });

    storeSwitcher.id = 'storeview-modal';
    while (fragmentStoreView.firstElementChild) {
      storeSwitcher.append(fragmentStoreView.firstElementChild);
    }

    // create classes for storeview modal sections
    const classes = ['storeview-title', 'storeview-list'];
    classes.forEach((c, i) => {
      const section = storeSwitcher.children[i];
      if (section) section.classList.add(`storeview-modal-${c}`);
    });

    // Store Switcher Modal Content - Store View Title
    const storeViewTitle = storeSwitcher.querySelector('.storeview-modal-storeview-title');
    const title = storeViewTitle.querySelector('h3');
    if (title) {
      title.className = '';
      title.closest('h3').classList.add('storeview-modal-storeview-title');
      title.setAttribute('tabindex', '0');
    }

    // Storeview List
    const storeViewList = storeSwitcher.querySelector('.storeview-modal-storeview-list');

    if (storeViewList && storeViewList.children.length) {
      // Add storeview-selection class to parent UL
      storeViewList
        .querySelectorAll(':scope .default-content-wrapper > ul')
        .forEach((storeView) => {
          if (storeView.querySelector('ul')) storeView.classList.add('storeview-selection');
        });

      // if multiple stores exist per region, add class storeviews and click events for accordion
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        if (storeRegion.children.length > 1) {
          if (storeRegion.querySelector('ul')) storeRegion.classList.add('storeviews');

          // Accessiblity: addeventlistener for 'click' and keyboard event and tab indexes
          storeViewList.querySelectorAll(':scope li').forEach((storeView) => {
            const link = storeView.closest('a');
            if (link) link.setAttribute('tabindex', '0');
            storeView.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const expanded = storeView.getAttribute('aria-expanded') === 'true';
                toggleStoreDropdown(storeViewList);
                storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
              }
            });
            storeView.addEventListener('click', () => {
              const expanded = storeView.getAttribute('aria-expanded') === 'true';
              toggleStoreDropdown(storeViewList);
              storeView.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            });
          });
        }
      });

      // If only one storeview link in region, convert parent UL into the li and remove the child UL
      storeViewList.querySelectorAll('.default-content-wrapper > ul > li > ul').forEach((storeRegion) => {
        const li = storeRegion.closest('li');

        if (storeRegion.children.length <= 1) {
          li.classList.add('storeview-single-store');
          const ulParent = li.closest('ul');
          const replacedChild = (storeRegion.firstElementChild);
          replacedChild.className = 'storeview-single-store';

          ulParent.replaceChild(replacedChild, li);
          ulParent.setAttribute('tabindex', '0');
        } else {
          li.classList.add('storeview-multiple-stores');
          li.setAttribute('tabindex', '0');
        }
      });

      UI.render(Button, {
        children: `${selected.text}`,
        'data-testid': 'storeview-switcher-button',
        className: 'storeview-switcher-button',
        size: 'medium',
        variant: 'teritary',
        onClick: () => {
          showModal(storeSwitcher);
        },
      })($storeSwitcherBtn);
    }
  }
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
