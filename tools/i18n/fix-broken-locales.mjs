import fs from 'node:fs/promises';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const TRANSLATION_FILE = 'translations.json';

const BROKEN_LOCALES_FIX = {
  cs: {
    todoList: "Seznam úkolů", todos: "Úkoly", addTodo: "Přidat úkol", noTodos: "Žádné úkoly", myEvents: "Moje události", today: "Dnes", backToToday: "Zpět na dnešek", status: "Stav", date: "Datum", location: "Místo", home: "Domů", calendar: "Kalendář", feed: "Přehled", map: "Mapa", settings: "Nastavení", manageProfiles: "Spravovat profil", loading: "Načítání...", save: "Uložit", cancel: "Zrušit", delete: "Smazat", edit: "Upravit", add: "Přidat", close: "Zavřít", back: "Zpět", next: "Další", previous: "Předchozí", search: "Hledat", filter: "Filtr", view: "Zobrazit", settings_general: "Obecné", settings_appearance: "Vzhled", settings_experience: "Zkušenost", settings_about: "O aplikaci", security: "Zabezpečení", darkMode: "Tmavý režim", light: "Světlý", dark: "Tmavý", system: "Systém", email: "E-mail", password: "Heslo", signIn: "Přihlásit se", signUp: "Registrovat se", signOut: "Odhlásit se"
  },
  da: {
    todoList: "To-do liste", todos: "Opgaver", addTodo: "Tilføj opgave", noTodos: "Ingen opgaver", myEvents: "Mine begivenheder", today: "I dag", backToToday: "Tilbage til i dag", status: "Status", date: "Dato", location: "Lokation", home: "Hjem", calendar: "Kalender", feed: "Feed", map: "Kort", settings: "Indstillinger", manageProfiles: "Administrer profil", loading: "Indlæser...", save: "Gem", cancel: "Annuller", delete: "Slet", edit: "Rediger", add: "Tilføj", close: "Luk", back: "Tilbage", next: "Næste", previous: "Forrige", search: "Søg", filter: "Filter", view: "Vis", settings_general: "Generelt", settings_appearance: "Udseende", settings_experience: "Oplevelse", settings_about: "Om", security: "Sikkerhed", darkMode: "Mørk tilstand", light: "Lys", dark: "Mørk", system: "System", email: "E-mail", password: "Adgangskode", signIn: "Log ind", signUp: "Tilmeld dig", signOut: "Log ud"
  },
  el: {
    todoList: "Λίστα εργασιών", todos: "Εργασίες", addTodo: "Προσθήκη εργασίας", noTodos: "Δεν υπάρχουν εργασίες", myEvents: "Οι εκδηλώσεις μου", today: "Σήμερα", backToToday: "Επιστροφή στο σήμερα", status: "Κατάσταση", date: "Ημερομηνία", location: "Τοποθεσία", home: "Αρχική", calendar: "Ημερολόγιο", feed: "Ροή", map: "Χάρτης", settings: "Ρυθμίσεις", manageProfiles: "Διαχείριση προφίλ", loading: "Φόρτωση...", save: "Αποθήκευση", cancel: "Ακύρωση", delete: "Διαγραφή", edit: "Επεξεργασία", add: "Προσθήκη", close: "Κλείσιμο", back: "Πίσω", next: "Επόμενο", previous: "Προηγούμενο", search: "Αναζήτηση", filter: "Φίλτρο", view: "Προβολή", settings_general: "Γενικά", settings_appearance: "Εμφάνιση", settings_experience: "Εμπειρία", settings_about: "Πληροφορίες", security: "Ασφάλεια", darkMode: "Σκούρα λειτουργία", light: "Φωτεινό", dark: "Σκούρο", system: "Σύστημα", email: "Email", password: "Κωδικός", signIn: "Σύνδεση", signUp: "Εγγραφή", signOut: "Αποσύνδεση"
  },
  fi: {
    todoList: "Tehtävälista", todos: "Tehtävät", addTodo: "Lisää tehtävä", noTodos: "Ei tehtäviä", myEvents: "Omat tapahtumat", today: "Tänään", backToToday: "Takaisin tähän päivään", status: "Tila", date: "Päivämäärä", location: "Sijainti", home: "Koti", calendar: "Kalenteri", feed: "Syöte", map: "Kartta", settings: "Asetukset", manageProfiles: "Hallitse profiilia", loading: "Ladataan...", save: "Tallenna", cancel: "Peruuta", delete: "Poista", edit: "Muokkaa", add: "Lisää", close: "Sulje", back: "Takaisin", next: "Seuraava", previous: "Edellinen", search: "Hae", filter: "Suodata", view: "Näytä", settings_general: "Yleiset", settings_appearance: "Ulkoasu", settings_experience: "Kokemus", settings_about: "Tietoja", security: "Turvallisuus", darkMode: "Tumma tila", light: "Vaalea", dark: "Tumma", system: "Järjestelmä", email: "Sähköposti", password: "Salasana", signIn: "Kirjaudu sisään", signUp: "Rekisteröidy", signOut: "Kirjaudu ulos"
  },
  hu: {
    todoList: "Feladatlista", todos: "Feladatok", addTodo: "Feladat hozzáadása", noTodos: "Nincsenek feladatok", myEvents: "Eseményeim", today: "Ma", backToToday: "Vissza a mai naphoz", status: "Állapot", date: "Dátum", location: "Helyszín", home: "Kezdőlap", calendar: "Naptár", feed: "Hírek", map: "Térkép", settings: "Beállítások", manageProfiles: "Profil kezelése", loading: "Betöltés...", save: "Mentés", cancel: "Mégse", delete: "Törlés", edit: "Szerkesztés", add: "Hozzáadás", close: "Bezárás", back: "Vissza", next: "Tovább", previous: "Előző", search: "Keresés", filter: "Szűrő", view: "Megtekintés", settings_general: "Általános", settings_appearance: "Megjelenés", settings_experience: "Élmény", settings_about: "Névjegy", security: "Biztonság", darkMode: "Sötét mód", light: "Világos", dark: "Sötét", system: "Rendszer", email: "E-mail", password: "Jelszó", signIn: "Bejelentkezés", signUp: "Regisztráció", signOut: "Kijelentkezés"
  },
  no: {
    todoList: "To-do-liste", todos: "Oppgaver", addTodo: "Legg til oppgave", noTodos: "Ingen oppgaver", myEvents: "Mine hendelser", today: "I dag", backToToday: "Tilbake til i dag", status: "Status", date: "Dato", location: "Sted", home: "Hjem", calendar: "Kalender", feed: "Strøm", map: "Kart", settings: "Innstillinger", manageProfiles: "Administrer profil", loading: "Laster...", save: "Lagre", cancel: "Avbryt", delete: "Slett", edit: "Rediger", add: "Legg til", close: "Lukk", back: "Tilbake", next: "Neste", previous: "Forrige", search: "Søk", filter: "Filter", view: "Vis", settings_general: "Generelt", settings_appearance: "Utseende", settings_experience: "Opplevelse", settings_about: "Om", security: "Sikkerhet", darkMode: "Mørk modus", light: "Lys", dark: "Mørk", system: "System", email: "E-post", password: "Passord", signIn: "Logg inn", signUp: "Registrer deg", signOut: "Logg ut"
  },
  pl: {
    todoList: "Lista zadań", todos: "Zadania", addTodo: "Dodaj zadanie", noTodos: "Brak zadań", myEvents: "Moje wydarzenia", today: "Dzisiaj", backToToday: "Wróć do dzisiaj", status: "Status", date: "Data", location: "Lokalizacja", home: "Start", calendar: "Kalendarz", feed: "Kanał", map: "Mapa", settings: "Ustawienia", manageProfiles: "Zarządzaj profilem", loading: "Ładowanie...", save: "Zapisz", cancel: "Anuluj", delete: "Usuń", edit: "Edytuj", add: "Dodaj", close: "Zamknij", back: "Wstecz", next: "Dalej", previous: "Poprzedni", search: "Szukaj", filter: "Filtr", view: "Zobacz", settings_general: "Ogólne", settings_appearance: "Wygląd", settings_experience: "Doświadczenie", settings_about: "O aplikacji", security: "Bezpieczeństwo", darkMode: "Tryb nocny", light: "Jasny", dark: "Ciemny", system: "System", email: "E-mail", password: "Hasło", signIn: "Zaloguj się", signUp: "Zarejestruj się", signOut: "Wyloguj się"
  },
  ro: {
    todoList: "Listă de sarcini", todos: "Sarcini", addTodo: "Adaugă sarcină", noTodos: "Nicio sarcină", myEvents: "Evenimentele mele", today: "Azi", backToToday: "Înapoi la azi", status: "Status", date: "Data", location: "Locație", home: "Acasă", calendar: "Calendar", feed: "Flux", map: "Hartă", settings: "Setări", manageProfiles: "Gestionare profil", loading: "Se încarcă...", save: "Salvează", cancel: "Anulează", delete: "Șterge", edit: "Editează", add: "Adaugă", close: "Închide", back: "Înapoi", next: "Înainte", previous: "Anterior", search: "Caută", filter: "Filtru", view: "Vezi", settings_general: "General", settings_appearance: "Aspect", settings_experience: "Experiență", settings_about: "Despre", security: "Securitate", darkMode: "Mod întunecat", light: "Luminos", dark: "Întunecat", system: "Sistem", email: "E-mail", password: "Parolă", signIn: "Autentificare", signUp: "Înregistrare", signOut: "Deconectare"
  },
  sv: {
    todoList: "Att göra-lista", todos: "Uppgifter", addTodo: "Lägg till uppgift", noTodos: "Inga uppgifter", myEvents: "Mina händelser", today: "Idag", backToToday: "Tillbaka till idag", status: "Status", date: "Datum", location: "Plats", home: "Hem", calendar: "Kalender", feed: "Flöde", map: "Karta", settings: "Inställningar", manageProfiles: "Hantera profil", loading: "Laddar...", save: "Spara", cancel: "Avbryt", delete: "Ta bort", edit: "Redigera", add: "Lägg till", close: "Stäng", back: "Bakåt", next: "Nästa", previous: "Föregående", search: "Sök", filter: "Filter", view: "Visa", settings_general: "Allmänt", settings_appearance: "Utseende", settings_experience: "Upplevelse", settings_about: "Om", security: "Säkerhet", darkMode: "Mörkt läge", light: "Ljust", dark: "Mörkt", system: "System", email: "E-post", password: "Lösenord", signIn: "Logga in", signUp: "Registrera dig", signOut: "Logga ut"
  },
  tr: {
    todoList: "Yapılacaklar Listesi", todos: "Görevler", addTodo: "Görev ekle", noTodos: "Görev yok", myEvents: "Etkinliklerim", today: "Bugün", backToToday: "Bugüne dön", status: "Durum", date: "Tarih", location: "Konum", home: "Ana Sayfa", calendar: "Takvim", feed: "Akış", map: "Harita", settings: "Ayarlar", manageProfiles: "Profili Yönet", loading: "Yükleniyor...", save: "Kaydet", cancel: "İptal", delete: "Sil", edit: "Düzenle", add: "Ekle", close: "Kapat", back: "Geri", next: "İleri", previous: "Geri", search: "Ara", filter: "Filtre", view: "Görüntüle", settings_general: "Genel", settings_appearance: "Görünüm", settings_experience: "Deneyim", settings_about: "Hakkında", security: "Güvenlik", darkMode: "Karanlık Mod", light: "Açık", dark: "Karanlık", system: "Sistem", email: "E-posta", password: "Şifre", signIn: "Giriş Yap", signUp: "Kayıt Ol", signOut: "Çıkış Yap"
  },
  uk: {
    todoList: "Список справ", todos: "Завдання", addTodo: "Додати завдання", noTodos: "Немає завдань", myEvents: "Мої події", today: "Сьогодні", backToToday: "Назад до сьогодні", status: "Статус", date: "Дата", location: "Місце", home: "Головна", calendar: "Календар", feed: "Стрічка", map: "Карта", settings: "Налаштування", manageProfiles: "Керування профілем", loading: "Завантаження...", save: "Зберегти", cancel: "Скасувати", delete: "Видалити", edit: "Редагувати", add: "Додати", close: "Закрити", back: "Назад", next: "Далі", previous: "Назад", search: "Пошук", filter: "Фільтр", view: "Перегляд", settings_general: "Загальні", settings_appearance: "Вигляд", settings_experience: "Досвід", settings_about: "Про додаток", security: "Безпека", darkMode: "Темна тема", light: "Світла", dark: "Темна", system: "Системна", email: "Email", password: "Пароль", signIn: "Увійти", signUp: "Реєстрація", signOut: "Вийти"
  }
};

async function main() {
  for (const locale of Object.keys(BROKEN_LOCALES_FIX)) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, 'utf8');
    const json = JSON.parse(content);

    const translations = BROKEN_LOCALES_FIX[locale];
    for (const [key, value] of Object.entries(translations)) {
      json[key] = value;
    }

    await fs.writeFile(localeFilePath, JSON.stringify(json, null, 2));
    console.log(`Fixed major gaps for ${locale}`);
  }
}

main().catch(console.error);
