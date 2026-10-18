import { SESSION_CACHE_STORAGE_KEY } from '@/shared/config/storageKeys'

export const SIGNED_IN_BOOT_SCRIPT = `(function () {
  try {
    var login = localStorage.getItem(${JSON.stringify(SESSION_CACHE_STORAGE_KEY)});
    if (login) {
      document.documentElement.dataset.signedIn = 'yes';
    }
  } catch (error) {}
})();`
