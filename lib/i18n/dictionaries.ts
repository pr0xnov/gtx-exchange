import { DEFAULT_LOCALE, Locale } from "./config";

/**
 * Deliberately a flat key -> string map, not a heavy i18n framework: the
 * app's UI text is fully enumerable and doesn't need plural rules,
 * interpolation libraries, or namespaced bundles loaded per-route. Extend
 * by adding a key here and to both translated dictionaries below —
 * TypeScript errors if `ru`/`uk` fall out of sync with `en` (see the
 * `Dictionary` type below).
 *
 * Keys are grouped by the page/area that owns them (nav.*, trading.*,
 * markets.*, wallet.*, account.*, auth.*, …) so ownership is obvious and
 * two areas never fight over the same key.
 */
const en = {
  // Shared across multiple pages
  "common.login": "Login",
  "common.register": "Registration",
  "common.dashboard": "Dashboard",
  "common.logout": "Log out",
  "common.loading": "Loading…",
  "common.error": "Something went wrong. Please try again.",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.back": "Back",
  "common.continue": "Continue",
  "common.submit": "Submit",
  "common.search": "Search",
  "common.noData": "No data available.",
  "common.viewAll": "View all",
  "common.optional": "Optional",

  // Navbar
  "nav.trading": "Trading",
  "nav.markets": "Markets",
  "nav.wallet": "Wallet",
  "nav.about": "About us",
  "nav.tariffs": "Tariffs",
  "nav.contacts": "Contacts",
  "nav.account": "Account",
  "nav.deposit": "Deposit",
  "nav.withdrawal": "Withdrawal",
  "nav.history": "History",
  "nav.verification": "Verification",
  "nav.downloads": "Downloads",
  "nav.settings": "Settings",
  "nav.support": "Support",
  "nav.accountMenu": "Account menu",
  "nav.toggleMenu": "Toggle menu",
  "nav.language": "Language",
  "nav.logoutSuccess": "You have been logged out",
  "nav.logoutError": "Failed to log out. Please try again.",
  "nav.searchAria": "Search cryptocurrencies",
  "nav.searchPlaceholder": "Search cryptocurrencies",
  "nav.searchNoResults": "No cryptocurrencies found.",
} as const;

export type DictionaryKey = keyof typeof en;
export type Dictionary = Record<DictionaryKey, string>;

const ru: Dictionary = {
  "common.login": "Войти",
  "common.register": "Регистрация",
  "common.dashboard": "Личный кабинет",
  "common.logout": "Выйти",
  "common.loading": "Загрузка…",
  "common.error": "Что-то пошло не так. Попробуйте ещё раз.",
  "common.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.confirm": "Подтвердить",
  "common.close": "Закрыть",
  "common.copy": "Копировать",
  "common.copied": "Скопировано",
  "common.back": "Назад",
  "common.continue": "Продолжить",
  "common.submit": "Отправить",
  "common.search": "Поиск",
  "common.noData": "Нет данных.",
  "common.viewAll": "Показать все",
  "common.optional": "Необязательно",

  "nav.trading": "Торговля",
  "nav.markets": "Рынки",
  "nav.wallet": "Кошелёк",
  "nav.about": "О нас",
  "nav.tariffs": "Тарифы",
  "nav.contacts": "Контакты",
  "nav.account": "Аккаунт",
  "nav.deposit": "Пополнение",
  "nav.withdrawal": "Вывод",
  "nav.history": "История",
  "nav.verification": "Верификация",
  "nav.downloads": "Загрузки",
  "nav.settings": "Настройки",
  "nav.support": "Поддержка",
  "nav.accountMenu": "Меню аккаунта",
  "nav.toggleMenu": "Открыть/закрыть меню",
  "nav.language": "Язык",
  "nav.logoutSuccess": "Вы вышли из аккаунта",
  "nav.logoutError": "Не удалось выйти. Попробуйте ещё раз.",
  "nav.searchAria": "Поиск криптовалют",
  "nav.searchPlaceholder": "Поиск криптовалют",
  "nav.searchNoResults": "Криптовалюты не найдены.",
};

const uk: Dictionary = {
  "common.login": "Увійти",
  "common.register": "Реєстрація",
  "common.dashboard": "Особистий кабінет",
  "common.logout": "Вийти",
  "common.loading": "Завантаження…",
  "common.error": "Щось пішло не так. Спробуйте ще раз.",
  "common.save": "Зберегти",
  "common.cancel": "Скасувати",
  "common.confirm": "Підтвердити",
  "common.close": "Закрити",
  "common.copy": "Копіювати",
  "common.copied": "Скопійовано",
  "common.back": "Назад",
  "common.continue": "Продовжити",
  "common.submit": "Надіслати",
  "common.search": "Пошук",
  "common.noData": "Немає даних.",
  "common.viewAll": "Показати всі",
  "common.optional": "Необов'язково",

  "nav.trading": "Торгівля",
  "nav.markets": "Ринки",
  "nav.wallet": "Гаманець",
  "nav.about": "Про нас",
  "nav.tariffs": "Тарифи",
  "nav.contacts": "Контакти",
  "nav.account": "Акаунт",
  "nav.deposit": "Поповнення",
  "nav.withdrawal": "Виведення",
  "nav.history": "Історія",
  "nav.verification": "Верифікація",
  "nav.downloads": "Завантаження",
  "nav.settings": "Налаштування",
  "nav.support": "Підтримка",
  "nav.accountMenu": "Меню акаунта",
  "nav.toggleMenu": "Відкрити/закрити меню",
  "nav.language": "Мова",
  "nav.logoutSuccess": "Ви вийшли з акаунта",
  "nav.logoutError": "Не вдалося вийти. Спробуйте ще раз.",
  "nav.searchAria": "Пошук криптовалют",
  "nav.searchPlaceholder": "Пошук криптовалют",
  "nav.searchNoResults": "Криптовалюти не знайдено.",
};

export const dictionaries: Record<Locale, Dictionary> = { en, ru, uk };

export function translate(locale: Locale, key: DictionaryKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key];
}
