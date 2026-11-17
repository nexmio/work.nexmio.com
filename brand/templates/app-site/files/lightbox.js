/* Opens a picture of the app in a larger view when it is clicked (or chosen with the keyboard).
   Every <img class="shot"> gets it. Escape, a click outside the picture or the Close button closes it. */
(function () {
  const shots = document.querySelectorAll('img.shot');
  if (!shots.length || typeof HTMLDialogElement === 'undefined') return;

  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Larger picture');
  const big = document.createElement('img');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'lightbox-close';
  close.textContent = 'Close';
  box.append(close, big);
  document.body.append(box);

  const open = (img) => {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.showModal();
    close.focus();
  };
  close.addEventListener('click', () => box.close());
  // A click outside the picture (on the dark area) closes it.
  box.addEventListener('click', (e) => {
    if (e.target === box) box.close();
  });
  box.addEventListener('close', () => {
    big.removeAttribute('src');
  });

  shots.forEach((img) => {
    img.classList.add('zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Larger picture: ' + img.alt);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });
})();
