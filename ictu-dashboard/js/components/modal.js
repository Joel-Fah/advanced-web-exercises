/* modal.js */
function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  const root = document.getElementById('modalRoot');
  if (!root) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <h3 class="modal-title">${escapeHTML(title)}</h3>
      <p class="modal-message">${escapeHTML(message)}</p>
      <div class="modal-actions">
        <button class="btn btn--ghost" id="modalCancel">${escapeHTML(cancelText)}</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--terracotta'}" id="modalConfirm">${escapeHTML(confirmText)}</button>
      </div>
    </div>
  `;

  root.appendChild(overlay);

  const close = () => { overlay.remove(); };
  overlay.querySelector('#modalCancel').onclick = () => { close(); if (onCancel) onCancel(); };
  overlay.querySelector('#modalConfirm').onclick = () => { close(); if (onConfirm) onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };

  overlay.querySelector('#modalConfirm').focus();
}

/* toast.js */
function showToast(message, type = 'info', duration = 3500) {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  root.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 250ms ease forwards';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
