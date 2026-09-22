/* MOVX v91 — retired native artwork portal
   The duplicated v54 portal has been visually disabled since v83. Keep its
   compatibility classes/dataset only; do not allocate hidden DOM or WebGL. */

const root=document.documentElement;
root.classList.add('movx-v54','v54-fallback','v54-runtime-retired','v91-runtime-retired');
root.dataset.movxArtworkPortal='v91-retired';
