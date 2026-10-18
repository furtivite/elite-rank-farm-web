import { LANGUAGE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { DEFAULT_LANGUAGE } from '@/shared/lib/i18n/types'

export const LANGUAGE_BOOT_SCRIPT = `(function () {
  var key = ${JSON.stringify(LANGUAGE_STORAGE_KEY)};
  var language = ${JSON.stringify(DEFAULT_LANGUAGE)};
  try {
    var stored = localStorage.getItem(key);
    if (stored === 'ru' || stored === 'en') {
      language = stored;
    }
  } catch (error) {}
  document.documentElement.lang = language;
})();`
