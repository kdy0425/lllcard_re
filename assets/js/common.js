//디자인 셀렉트
(function () {
  document.querySelectorAll('select').forEach(function (selectEl) {
    const settings = {
      showSearch: false,
      allowDeselect: false,
    };
    new SlimSelect({
      select: selectEl,
      settings,
    });
  });
})();


//모바일 토글 검색용
(function () {
  document.querySelectorAll('.toggle_items').forEach(function (wrap) {
    const items = wrap.querySelector('.items');
    const btn = wrap.querySelector('.toggle_button');
    if (!items || !btn) return;

    const span = btn.querySelector('span');

    items.style.display = 'none';
    items.style.overflow = 'hidden';
    items.style.maxHeight = '0px';
    btn.classList.remove('active');
    if (span) span.textContent = '상세검색 열기';

    const open = () => {
      btn.classList.add('active');
      if (span) span.textContent = '상세검색 닫기';

      items.style.display = 'flex';
      items.style.overflow = 'hidden';
      items.style.maxHeight = '0px';

      requestAnimationFrame(() => {
        const h = items.scrollHeight;
        items.style.maxHeight = h + 'px';
      });

      const onEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        items.style.maxHeight = 'none';
        items.style.overflow = 'visible';
        items.removeEventListener('transitionend', onEnd);
      };
      items.addEventListener('transitionend', onEnd);
    };

    const close = () => {
      btn.classList.remove('active');
      if (span) span.textContent = '상세검색 열기';

      items.style.overflow = 'hidden';
      items.style.maxHeight = items.scrollHeight + 'px';

      requestAnimationFrame(() => {
        items.style.maxHeight = '0px';
      });

      const onEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        items.style.display = 'none';
        items.removeEventListener('transitionend', onEnd);
      };
      items.addEventListener('transitionend', onEnd);
    };

    btn.addEventListener('click', function () {
      const isOpen = btn.classList.contains('active');
      isOpen ? close() : open();
    });
  });
})();


///접근성 팝업
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const htmlElForModal = document.documentElement;
let modalScrollLocked = false;
let modalSavedHtmlPaddingRight = '';

let lastTrigger = null;
let activeModal = null;
let mainToHide = null;

function lockBackground(modal) {
  const html = document.documentElement;
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  modalSavedHtmlPaddingRight = html.style.paddingRight;

  if (!modalScrollLocked) {
    modalScrollLocked = true;

    if (scrollbarWidth > 0) {
      html.style.paddingRight = scrollbarWidth + 'px';
    }
  }
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';
  document.documentElement.style.height = '100%';
  const main = document.querySelector('#content');
  if (main && !main.contains(modal)) {
    main.setAttribute('aria-hidden', 'true');
    mainToHide = main;
  }
}

function unlockBackground() {
  document.body.style.overflow = '';
  document.body.style.height = '';
  document.documentElement.style.height = '';
  if (modalScrollLocked && htmlElForModal) {
    htmlElForModal.style.paddingRight = modalSavedHtmlPaddingRight;
    modalScrollLocked = false;
  }

  if (mainToHide) {
    mainToHide.removeAttribute('aria-hidden');
    mainToHide = null;
  }
}


function getFocusEdges(container) {
  const list = Array.from(container.querySelectorAll(FOCUSABLE))
    .filter(el => el.offsetParent !== null || el === document.activeElement);
  return { first: list[0] || null, last: list[list.length - 1] || null };
}

// 모달 열기
function openModal(modal) {
  if (!modal) return;
  activeModal = modal;
  modal.hidden = false;

  lockBackground(modal);

  const { first } = getFocusEdges(modal);
  const fallback = modal.querySelector('.modal__scroll') || modal.querySelector('.modal__dialog');
  (first || fallback).focus();

  modal.addEventListener('keydown', trapHandler);
  modal.addEventListener('click', backdropHandler);
}

// 모달 닫기
function closeModal(modal) {
  // 인자로 modal 안 오면 activeModal 사용
  const target = modal || activeModal;
  if (!target) return;

  target.hidden = true;
  target.removeEventListener('keydown', trapHandler);
  target.removeEventListener('click', backdropHandler);

  unlockBackground();

  // 포커스 복귀
  if (lastTrigger && document.contains(lastTrigger)) {
    lastTrigger.focus();
  }

  if (activeModal === target) {
    activeModal = null;
  }
}


// 탭 순환 & ESC 닫기
function trapHandler(e) {
  if (!activeModal) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(activeModal);
    return;
  }

  if (e.key === 'Tab') {
    const dialog = activeModal.querySelector('.modal__dialog') || activeModal;
    const { first, last } = getFocusEdges(dialog);
    if (!first || !last) {
      // 포커스 대상이 없으면 기본 동작 허용
      return;
    }
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

// 배경 클릭으로 닫기
function backdropHandler(e) {
  const target = e.target;
  if (target && (target.classList.contains('modal__backdrop') || target.dataset.close === 'true')) {
    closeModal(activeModal);
  }
}

// 열기 버튼
document.addEventListener('click', function (e) {
  const openBtn = e.target.closest('.js_modal_open');
  if (openBtn) {
    const sel = openBtn.getAttribute('data-target');
    const modal = document.querySelector(sel);
    if (!modal) return;
    lastTrigger = openBtn;
    openModal(modal);
    return;
  }

  const closeBtn = e.target.closest('.js_close_modal');
  if (closeBtn) {
    const modal = closeBtn.closest('[role="dialog"]');
    closeModal(modal || activeModal);
  }
});


// 헤더 검색/전체메뉴 접근성 제어
(function () {
  const header = document.querySelector('#header');
  if (!header) return;

  const searchLayer = header.querySelector('.header_search');
  const navLayer = header.querySelector('.nav_all');
  const searchBg = header.querySelector('.search_bg');

  const searchToggleBtn = searchLayer?.closest('.item')?.querySelector('button');

  const nav = document.getElementById('nav');
  const navOpenBtn = document.getElementById('nav_all_open');
  const navCloseBtn = document.getElementById('nav_all_close');

  const searchCloseBtn = header.querySelector('#btn_search_close');

  if (!searchLayer && !navLayer) return;

  if (!header.hasAttribute('tabindex')) {
    header.setAttribute('tabindex', '-1');
  }

  let searchOrigin = null;
  let navOrigin = null;
  let isSearchOpen = false;
  let isNavOpen = false;
  let isNavScrollLocked = false;

  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  let savedHtmlPaddingRight = '';
  let savedBodyPaddingRight = '';
  let savedScrollTop = 0;

  if (searchLayer) {
    searchLayer.setAttribute('aria-hidden', 'true');
  }
  if (navLayer) {
    navLayer.setAttribute('aria-hidden', 'true');
  }
  if (searchToggleBtn) {
    searchToggleBtn.setAttribute('aria-expanded', 'false');
  }
  if (navOpenBtn) {
    navOpenBtn.setAttribute('aria-expanded', 'false');
    nav.classList.add('hide');
  }
  if (navCloseBtn) {
    navCloseBtn.setAttribute('aria-expanded', 'false');
    navCloseBtn.style.display = 'none';
    nav.classList.remove('hide');
  }

  const setFocusInsideHeader = () => {
    if (!header) return;
    const { first } = getFocusEdges(header);
    if (first) {
      first.focus();
    } else {
      header.focus();
    }
  };

  function closeSearch() {
      if (!searchLayer || !isSearchOpen) return;
      isSearchOpen = false;
      searchLayer.classList.remove('show');
      searchLayer.setAttribute('aria-hidden', 'true');
      searchToggleBtn?.setAttribute('aria-expanded', 'false');
      searchBg?.classList.remove('show');

      if (isNavScrollLocked && !isNavOpen) {
        htmlEl.style.overflow = '';
        bodyEl.style.overflow = '';

        htmlEl.style.paddingRight = savedHtmlPaddingRight;
        isNavScrollLocked = false;

        window.scrollTo({ top: savedScrollTop, behavior: 'auto' });
      }

      const target = searchOrigin;
      searchOrigin = null;
      if (target && document.contains(target)) {
        target.focus();
      } else {
        searchToggleBtn?.focus();
      }
    }


    function closeNav() {
    if (!navLayer || !isNavOpen) return;
    navLayer.classList.remove('show');
    navLayer.setAttribute('aria-hidden', 'true');

    navOpenBtn?.setAttribute('aria-expanded', 'false');
    navCloseBtn?.setAttribute('aria-expanded', 'false');
    if (navOpenBtn) navOpenBtn.style.display = 'flex';
    if (navCloseBtn) navCloseBtn.style.display = 'none';

    if (nav) {
      nav.classList.remove('nav_hide');
    }

    isNavOpen = false;

    if (isNavScrollLocked && !isSearchOpen) {
      htmlEl.style.overflow = '';
      bodyEl.style.overflow = '';
      htmlEl.style.paddingRight = savedHtmlPaddingRight;

      isNavScrollLocked = false;

      window.scrollTo({ top: savedScrollTop, behavior: 'auto' });
    }

    const target = navOrigin;
    navOrigin = null;
    if (target && document.contains(target)) {
      target.focus();
    }
  }



  function openSearch() {
      if (!searchLayer || isSearchOpen) return;
      closeNav();
      if (!isNavScrollLocked) {
        savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        savedHtmlPaddingRight = htmlEl.style.paddingRight;
        if (scrollbarWidth > 0) {
          htmlEl.style.paddingRight = scrollbarWidth + 'px';
        }

        htmlEl.style.overflow = 'hidden';
        bodyEl.style.overflow = 'hidden';
        isNavScrollLocked = true;
      }
      window.scrollTo({ top: 0, behavior: 'auto' });

      searchOrigin = document.activeElement;
      isSearchOpen = true;
      searchLayer.classList.add('show');
      searchLayer.setAttribute('aria-hidden', 'false');
      searchToggleBtn?.setAttribute('aria-expanded', 'true');
      searchBg?.classList.add('show');

      const firstField = searchLayer.querySelector(FOCUSABLE);
      (firstField || header).focus();
    }


    function openNav() {
    if (!navLayer || isNavOpen) return;
    closeSearch();
    navOrigin = document.activeElement;

    navLayer.classList.add('show');
    navLayer.setAttribute('aria-hidden', 'false');

    navOpenBtn?.setAttribute('aria-expanded', 'true');
    navCloseBtn?.setAttribute('aria-expanded', 'true');
    if (navOpenBtn) navOpenBtn.style.display = 'none';
    if (navCloseBtn) navCloseBtn.style.display = 'flex';

    if (nav) {
      nav.classList.add('nav_hide');
    }

    isNavOpen = true;

    if (!isNavScrollLocked) {
      savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      savedHtmlPaddingRight = htmlEl.style.paddingRight;

      if (scrollbarWidth > 0) {
        htmlEl.style.paddingRight = scrollbarWidth + 'px';
      }

      htmlEl.style.overflow = 'hidden';
      bodyEl.style.overflow = 'hidden';
      isNavScrollLocked = true;

      window.scrollTo({ top: savedScrollTop, behavior: 'auto' });
    }
  }


  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      if (isSearchOpen) {
        e.preventDefault();
        closeSearch();
        return;
      }
      if (isNavOpen) {
        e.preventDefault();
        closeNav();
        return;
      }
    }

    if (!isSearchOpen || e.key !== 'Tab') return;
    const { first, last } = getFocusEdges(header);
    if (!first || !last) return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onFocusIn = (e) => {
    const target = e.target;
    if (isSearchOpen && header && !header.contains(target)) {
      setFocusInsideHeader();
    }
    if (isNavOpen && header && !header.contains(target)) {
      closeNav();
    }
  };

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('focusin', onFocusIn);

  searchToggleBtn?.addEventListener('click', function () {
    if (isSearchOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  searchCloseBtn?.addEventListener('click', closeSearch);
  searchBg?.addEventListener('click', closeSearch);

  navOpenBtn?.addEventListener('click', function () {
    if (isNavOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  navCloseBtn?.addEventListener('click', function () {
    closeNav();
  });
})();


// 모바일 전체메뉴 아코디언
(function () {
  const MOBILE_MAX_WIDTH = 1100;
  const navRoot = document.querySelector('.nav_all .all_inner > ul');
  if (!navRoot) return;

  const triggers = Array.from(navRoot.querySelectorAll(':scope > li > a'));
  let activeLink = null;

  const closeSubmenu = (link) => {
    if (!link) return;
    link.classList.remove('active');
    const submenu = link.nextElementSibling;
    if (submenu && submenu instanceof HTMLElement) {
      submenu.style.maxHeight = '0px';
    }
  };

  const openSubmenu = (link) => {
    const submenu = link.nextElementSibling;
    if (!submenu || !(submenu instanceof HTMLElement)) return;
    link.classList.add('active');
    submenu.style.maxHeight = `${submenu.scrollHeight + 30}px`;
  };

  const resetMenus = () => {
    activeLink = null;
    triggers.forEach((link) => {
      link.classList.remove('active');
      const submenu = link.nextElementSibling;
      if (submenu && submenu instanceof HTMLElement) {
        submenu.style.maxHeight = '';
      }
    });
  };

  const handleClick = (e) => {
    if (window.innerWidth > MOBILE_MAX_WIDTH) return;
    e.preventDefault();
    const link = e.currentTarget;
    if (!(link instanceof HTMLElement)) return;

    if (link === activeLink) {
      closeSubmenu(link);
      activeLink = null;
      return;
    }

    closeSubmenu(activeLink);
    openSubmenu(link);
    activeLink = link;
  };

  triggers.forEach((link) => {
    link.addEventListener('click', handleClick);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_MAX_WIDTH) {
      resetMenus();
    }
  });
})();



//alert 팝업
function alert_popup(type, options) {
  const modal = document.getElementById('alert_modal');
  if (!modal) return;

  const iconAlert = modal.querySelector('.icon_alert');
  const iconComp = modal.querySelector('.icon_comp');
  const textBox = modal.querySelector('.alert_text');
  const descEl = modal.querySelector('.alert_desc');

  const okBtn = modal.querySelector('[data-role="ok"]');
  const cancelBtn = modal.querySelector('[data-role="cancel"]');

  if (iconAlert) {
    iconAlert.style.display = (type === 'alert') ? 'block' : 'none';
  }
  if (iconComp) {
    iconComp.style.display = (type === 'comp') ? 'block' : 'none';
  }
  if (type !== 'alert' && type !== 'comp') {
    if (iconAlert) iconAlert.style.display = 'none';
    if (iconComp)  iconComp.style.display  = 'none';
  }

  const opts = (options && typeof options === 'object')
    ? options
    : { message: options };

  const desc   = opts.desc   || '알림';
  const message = opts.message || '';
  const buttons = opts.buttons || 'ok';

  const onOk     = typeof opts.onOk === 'function' ? opts.onOk : null;
  const onCancel = typeof opts.onCancel === 'function' ? opts.onCancel : null;

  if (descEl) {
    descEl.textContent = desc;

    if (opts.desc) {
      descEl.classList.remove('sound_only');
    } else {
      descEl.classList.add('sound_only');
    }
  }

  if (textBox) {
    if (Array.isArray(message)) {
      const html = message
        .map(line => String(line))
        .join('<br>');
      textBox.innerHTML = html;
    } else {
      textBox.textContent = String(message);
    }
  }

  if (okBtn) {
    okBtn.style.display = 'inline-flex';
  }
  if (cancelBtn) {
    cancelBtn.style.display = (buttons === 'okcancel') ? 'inline-flex' : 'none';
  }

  if (okBtn)     okBtn.onclick     = null;
  if (cancelBtn) cancelBtn.onclick = null;

  function closeAndCallback(cb) {
    if (typeof closeModal === 'function') {
      closeModal(modal);
    } else {
      modal.hidden = true;
    }
    if (cb) cb();
  }

  if (okBtn) {
    okBtn.onclick = function () {
      closeAndCallback(onOk);
    };
  }
  if (cancelBtn && buttons === 'okcancel') {
    cancelBtn.onclick = function () {
      closeAndCallback(onCancel);
    };
  }

  if (typeof openModal === 'function') {
    openModal(modal);
  } else {
    modal.hidden = false;
  }
}



//datepicker
document.addEventListener('DOMContentLoaded', function() {
	document.querySelectorAll('.datepicker').forEach(function(pickerField) {
		var picker = new Pikaday({
			field: pickerField,
			onSelect: function() {
				var date = picker.getDate();
				var year = date.getFullYear();
				var month = (date.getMonth() + 1).toString().padStart(2, '0');
				var day = date.getDate().toString().padStart(2, '0');
				var formattedDate = `${year}-${month}-${day}`;
				pickerField.value = formattedDate;
			},
			showMonthAfterYear : true
			//firstDay: 1,  // 1-> 시작날짜 월요일 0-> 일요일
			//minDate: new Date(), //선택 최소날짜
			//maxDate: new Date(2020, 11, 31), //선택 최대날짜
			//yearRange: [2000, 2020] //표시년도
		});
	});
});