import { THEME_STORAGE_KEY } from '@/shared/config/storageKeys'

export const THEME_BOOT_SCRIPT = `(function () {
  var key = ${JSON.stringify(THEME_STORAGE_KEY)};
  var preference = 'system';
  try {
    var stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      preference = stored;
    }
  } catch (error) {}
  var dark =
    preference === 'dark' ||
    (preference === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = preference;
})();`
