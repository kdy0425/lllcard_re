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

let lastTrigger = null;
let activeModal = null;
let mainToHide = null;

function lockBackground(modal) {
  document.body.style.overflow = 'hidden';
  const main = document.querySelector('#content');
  if (main && !main.contains(modal)) {
    main.setAttribute('aria-hidden', 'true');
    mainToHide = main;
  }
}

function unlockBackground() {
  document.body.style.overflow = '';
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

