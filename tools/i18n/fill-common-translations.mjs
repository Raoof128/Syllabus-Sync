import fs from 'node:fs/promises';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const BASE_LOCALE = 'en';
const TRANSLATION_FILE = 'translations.json';

const COMMON_TRANSLATIONS = {
  ar: {
    home: "الرئيسية", calendar: "التقويم", feed: "الموجز", map: "الخريطة", settings: "الإعدادات", manageProfiles: "إدارة الملفات الشخصية",
    loading: "جاري التحميل...", save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", add: "إضافة", close: "إغلاق", back: "رجوع", next: "التالي", previous: "السابق",
    search: "بحث", filter: "تصفية", view: "عرض", today: "اليوم", backToToday: "العودة لليوم",
    status: "الحالة", date: "التاريخ", location: "الموقع", units: "الوحدات", deadlines: "المواعيد النهائية", events: "الأحداث",
    email: "البريد الإلكتروني", password: "كلمة المرور", signIn: "تسجيل الدخول", signUp: "إنشاء حساب", signOut: "تسجيل الخروج",
    darkMode: "الوضع الداكن", light: "فاتح", dark: "داكن", system: "النظام"
  },
  bn: {
    home: "হোম", calendar: "ক্যালেন্ডার", feed: "ফিড", map: "মানচিত্র", settings: "সেটিংস", manageProfiles: "প্রোফাইল পরিচালনা",
    loading: "লোড হচ্ছে...", save: "সংরক্ষণ করুন", cancel: "বাতিল", delete: "মুছে ফেলুন", edit: "সম্পাদনা", add: "যোগ করুন", close: "বন্ধ করুন", back: "পিছনে", next: "পরবর্তী", previous: "পূর্ববর্তী",
    search: "অনুসন্ধান", filter: "ফিল্টার", view: "দেখুন", today: "আজ", backToToday: "আজকের দিনে ফিরে যান",
    status: "অবস্থা", date: "তারিখ", location: "অবস্থান", units: "ইউনিট", deadlines: "ডেডলাইন", events: "ইভেন্ট",
    email: "ইমেইল", password: "পাসওয়ার্ড", signIn: "সাইন ইন", signUp: "সাইন আপ", signOut: "সাইন আউট",
    darkMode: "ডার্ক মোড", light: "লাইট", dark: "ডার্ক", system: "সিস্টেম"
  },
  cs: {
    home: "Domů", calendar: "Kalendář", feed: "Přehled", map: "Mapa", settings: "Nastavení", manageProfiles: "Spravovat profil",
    loading: "Načítání...", save: "Uložit", cancel: "Zrušit", delete: "Smazat", edit: "Upravit", add: "Přidat", close: "Zavřít", back: "Zpět", next: "Další", previous: "Předchozí",
    search: "Hledat", filter: "Filtr", view: "Zobrazit", today: "Dnes", backToToday: "Zpět na dnešek",
    status: "Stav", date: "Datum", location: "Místo", units: "Předměty", deadlines: "Termíny", events: "Události",
    email: "E-mail", password: "Heslo", signIn: "Přihlásit se", signUp: "Registrovat se", signOut: "Odhlásit se",
    darkMode: "Tmavý režim", light: "Světlý", dark: "Tmavý", system: "Systém"
  },
  da: {
    home: "Hjem", calendar: "Kalender", feed: "Feed", map: "Kort", settings: "Indstillinger", manageProfiles: "Administrer profil",
    loading: "Indlæser...", save: "Gem", cancel: "Annuller", delete: "Slet", edit: "Rediger", add: "Tilføj", close: "Luk", back: "Tilbage", next: "Næste", previous: "Forrige",
    search: "Søg", filter: "Filter", view: "Vis", today: "I dag", backToToday: "Tilbage til i dag",
    status: "Status", date: "Dato", location: "Lokation", units: "Fag", deadlines: "Deadlines", events: "Begivenheder",
    email: "E-mail", password: "Adgangskode", signIn: "Log ind", signUp: "Tilmeld dig", signOut: "Log ud",
    darkMode: "Mørk tilstand", light: "Lys", dark: "Mørk", system: "System"
  },
  de: {
    home: "Startseite", calendar: "Kalender", feed: "Feed", map: "Karte", settings: "Einstellungen", manageProfiles: "Profil verwalten",
    loading: "Wird geladen...", save: "Speichern", cancel: "Abbrechen", delete: "Löschen", edit: "Bearbeiten", add: "Hinzufügen", close: "Schließen", back: "Zurück", next: "Weiter", previous: "Zurück",
    search: "Suchen", filter: "Filter", view: "Ansehen", today: "Heute", backToToday: "Zurück zu Heute",
    status: "Status", date: "Datum", location: "Ort", units: "Module", deadlines: "Fristen", events: "Events",
    email: "E-Mail", password: "Passwort", signIn: "Anmelden", signUp: "Registrieren", signOut: "Abmelden",
    darkMode: "Dunkelmodus", light: "Hell", dark: "Dunkel", system: "System"
  },
  el: {
    home: "Αρχική", calendar: "Ημερολόγιο", feed: "Ροή", map: "Χάρτης", settings: "Ρυθμίσεις", manageProfiles: "Διαχείριση προφίλ",
    loading: "Φόρτωση...", save: "Αποθήκευση", cancel: "Ακύρωση", delete: "Διαγραφή", edit: "Επεξεργασία", add: "Προσθήκη", close: "Κλείσιμο", back: "Πίσω", next: "Επόμενο", previous: "Προηγούμενο",
    search: "Αναζήτηση", filter: "Φίλτρο", view: "Προβολή", today: "Σήμερα", backToToday: "Επιστροφή στο σήμερα",
    status: "Κατάσταση", date: "Ημερομηνία", location: "Τοποθεσία", units: "Μαθήματα", deadlines: "Προθεσμίες", events: "Εκδηλώσεις",
    email: "Email", password: "Κωδικός", signIn: "Σύνδεση", signUp: "Εγγραφή", signOut: "Αποσύνδεση",
    darkMode: "Σκούρα λειτουργία", light: "Φωτεινό", dark: "Σκούρο", system: "Σύστημα"
  },
  es: {
    home: "Inicio", calendar: "Calendario", feed: "Feed", map: "Mapa", settings: "Ajustes", manageProfiles: "Gestionar perfil",
    loading: "Cargando...", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", add: "Añadir", close: "Cerrar", back: "Atrás", next: "Siguiente", previous: "Anterior",
    search: "Buscar", filter: "Filtrar", view: "Ver", today: "Hoy", backToToday: "Volver a hoy",
    status: "Estado", date: "Fecha", location: "Ubicación", units: "Unidades", deadlines: "Plazos", events: "Eventos",
    email: "Email", password: "Contraseña", signIn: "Iniciar sesión", signUp: "Registrarse", signOut: "Cerrar sesión",
    darkMode: "Modo oscuro", light: "Claro", dark: "Oscuro", system: "Sistema"
  },
  fa: {
    home: "خانه", calendar: "تقویم", feed: "فید", map: "نقشه", settings: "تنظیمات", manageProfiles: "مدیریت پروفایل",
    loading: "در حال بارگذاری...", save: "ذخیره", cancel: "لغو", delete: "حذف", edit: "ویرایش", add: "افزودن", close: "بستن", back: "برگشت", next: "بعدی", previous: "قبلی",
    search: "جستجو", filter: "فیلتر", view: "مشاهده", today: "امروز", backToToday: "برگشت به امروز",
    status: "وضعیت", date: "تاریخ", location: "مکان", units: "واحدها", deadlines: "مهلت‌ها", events: "رویدادها",
    email: "ایمیل", password: "رمز عبور", signIn: "ورود", signUp: "ثبت‌نام", signOut: "خروج",
    darkMode: "حالت تاریک", light: "روشن", dark: "تاریک", system: "سیستم"
  },
  fi: {
    home: "Koti", calendar: "Kalenteri", feed: "Syöte", map: "Kartta", settings: "Asetukset", manageProfiles: "Hallitse profiilia",
    loading: "Ladataan...", save: "Tallenna", cancel: "Peruuta", delete: "Poista", edit: "Muokkaa", add: "Lisää", close: "Sulje", back: "Takaisin", next: "Seuraava", previous: "Edellinen",
    search: "Hae", filter: "Suodata", view: "Näytä", today: "Tänään", backToToday: "Takaisin tähän päivään",
    status: "Tila", date: "Päivämäärä", location: "Sijainti", units: "Kurssit", deadlines: "Määräajat", events: "Tapahtumat",
    email: "Sähköposti", password: "Salasana", signIn: "Kirjaudu sisään", signUp: "Rekisteröidy", signOut: "Kirjaudu ulos",
    darkMode: "Tumma tila", light: "Vaale Sami", dark: "Tumma", system: "Järjestelmä"
  },
  fr: {
    home: "Accueil", calendar: "Calendrier", feed: "Flux", map: "Carte", settings: "Paramètres", manageProfiles: "Gérer le profil",
    loading: "Chargement...", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier", add: "Ajouter", close: "Fermer", back: "Retour", next: "Suivant", previous: "Précédent",
    search: "Rechercher", filter: "Filtrer", view: "Voir", today: "Aujourd'hui", backToToday: "Retour à aujourd'hui",
    status: "Statut", date: "Date", location: "Lieu", units: "Unités", deadlines: "Échéances", events: "Événements",
    email: "E-mail", password: "Mot de passe", signIn: "Connexion", signUp: "Inscription", signOut: "Déconnexion",
    darkMode: "Mode sombre", light: "Clair", dark: "Sombre", system: "Système"
  },
  he: {
    home: "בית", calendar: "לוח שנה", feed: "פיד", map: "מפה", settings: "הגדרות", manageProfiles: "ניהול פרופיל",
    loading: "טוען...", save: "שמור", cancel: "ביטול", delete: "מחק", edit: "ערוך", add: "הוסף", close: "סגור", back: "חזור", next: "הבא", previous: "הקודם",
    search: "חיפוש", filter: "סינון", view: "צפה", today: "היום", backToToday: "חזור להיום",
    status: "סטטוס", date: "תאריך", location: "מיקום", units: "קורסים", deadlines: "מועדים", events: "אירועים",
    email: "אימייל", password: "סיסמה", signIn: "התחבר", signUp: "הרשמה", signOut: "התנתק",
    darkMode: "מצב כהה", light: "בהיר", dark: "כהה", system: "מערכת"
  },
  hi: {
    home: "होम", calendar: "कैलेंडर", feed: "फ़ीड", map: "मानचित्र", settings: "सेटिंग्स", manageProfiles: "प्रोफ़ाइल प्रबंधित करें",
    loading: "लोड हो रहा है...", save: "सहेजें", cancel: "रद्द करें", delete: "मिटाएं", edit: "संपादित करें", add: "जोड़ें", close: "बंद करें", back: "पीछे", next: "अगला", previous: "पिछला",
    search: "खोजें", filter: "फ़िल्टर", view: "देखें", today: "आज", backToToday: "आज पर वापस जाएं",
    status: "स्थिति", date: "तारीख", location: "स्थान", units: "इकाइयाँ", deadlines: "समय सीमा", events: "कार्यक्रम",
    email: "ईमेल", password: "पासवर्ड", signIn: "साइन इन", signUp: "साइन अप", signOut: "साइन आउट",
    darkMode: "डार्क मोड", light: "लाइट", dark: "डार्क", system: "सिस्टम"
  },
  hu: {
    home: "Kezdőlap", calendar: "Naptár", feed: "Hírek", map: "Térkép", settings: "Beállítások", manageProfiles: "Profil kezelése",
    loading: "Betöltés...", save: "Mentés", cancel: "Mégse", delete: "Törlés", edit: "Szerkesztés", add: "Hozzáadás", close: "Bezárás", back: "Vissza", next: "Tovább", previous: "Előző",
    search: "Keresés", filter: "Szűrő", view: "Megtekintés", today: "Ma", backToToday: "Vissza a mai naphoz",
    status: "Állapot", date: "Dátum", location: "Helyszín", units: "Tárgyak", deadlines: "Határidők", events: "Események",
    email: "E-mail", password: "Jelszó", signIn: "Bejelentkezés", signUp: "Regisztráció", signOut: "Kijelentkezés",
    darkMode: "Sötét mód", light: "Világos", dark: "Sötét", system: "Rendszer"
  },
  id: {
    home: "Beranda", calendar: "Kalender", feed: "Feed", map: "Peta", settings: "Pengaturan", manageProfiles: "Kelola Profil",
    loading: "Memuat...", save: "Simpan", cancel: "Batal", delete: "Hapus", edit: "Ubah", add: "Tambah", close: "Tutup", back: "Kembali", next: "Berikutnya", previous: "Sebelumnya",
    search: "Cari", filter: "Filter", view: "Lihat", today: "Hari ini", backToToday: "Kembali ke hari ini",
    status: "Status", date: "Tanggal", location: "Lokasi", units: "Unit", deadlines: "Tenggat waktu", events: "Acara",
    email: "Email", password: "Kata sandi", signIn: "Masuk", signUp: "Daftar", signOut: "Keluar",
    darkMode: "Mode gelap", light: "Terang", dark: "Gelap", system: "Sistem"
  },
  it: {
    home: "Home", calendar: "Calendario", feed: "Feed", map: "Mappa", settings: "Impostazioni", manageProfiles: "Gestisci profilo",
    loading: "Caricamento...", save: "Salva", cancel: "Annulla", delete: "Elimina", edit: "Modifica", add: "Aggiungi", close: "Chiudi", back: "Indietro", next: "Avanti", previous: "Precedente",
    search: "Cerca", filter: "Filtra", view: "Vedi", today: "Oggi", backToToday: "Torna a oggi",
    status: "Stato", date: "Data", location: "Luogo", units: "Corsi", deadlines: "Scadenze", events: "Eventi",
    email: "Email", password: "Password", signIn: "Accedi", signUp: "Registrati", signOut: "Esci",
    darkMode: "Modo scuro", light: "Chiaro", dark: "Scuro", system: "Sistema"
  },
  ja: {
    home: "ホーム", calendar: "カレンダー", feed: "フィード", map: "マップ", settings: "設定", manageProfiles: "プロファイル管理",
    loading: "読み込み中...", save: "保存", cancel: "キャンセル", delete: "削除", edit: "編集", add: "追加", close: "閉じる", back: "戻る", next: "次へ", previous: "前へ",
    search: "検索", filter: "フィルター", view: "表示", today: "今日", backToToday: "今日に戻る",
    status: "ステータス", date: "日付", location: "場所", units: "科目", deadlines: "期限", events: "イベント",
    email: "メール", password: "パスワード", signIn: "サインイン", signUp: "サインアップ", signOut: "サインアウト",
    darkMode: "ダークモード", light: "ライト", dark: "ダーク", system: "システム"
  },
  ko: {
    home: "홈", calendar: "캘린더", feed: "피드", map: "지도", settings: "설정", manageProfiles: "프로필 관리",
    loading: "로딩 중...", save: "저장", cancel: "취소", delete: "삭제", edit: "편집", add: "추가", close: "닫기", back: "뒤로", next: "다음", previous: "이전",
    search: "검색", filter: "필터", view: "보기", today: "오늘", backToToday: "오늘로 돌아가기",
    status: "상태", date: "날짜", location: "장소", units: "과목", deadlines: "마감일", events: "이벤트",
    email: "이메일", password: "비밀번호", signIn: "로그인", signUp: "회원가입", signOut: "로그아웃",
    darkMode: "다크 모드", light: "라이트", dark: "다크", system: "시스템"
  },
  ms: {
    home: "Utama", calendar: "Kalendar", feed: "Suapan", map: "Peta", settings: "Tetapan", manageProfiles: "Urus Profil",
    loading: "Memuatkan...", save: "Simpan", cancel: "Batal", delete: "Padam", edit: "Edit", add: "Tambah", close: "Tutup", back: "Kembali", next: "Seterusnya", previous: "Sebelumnya",
    search: "Cari", filter: "Tapis", view: "Lihat", today: "Hari ini", backToToday: "Kembali ke hari ini",
    status: "Status", date: "Tarikh", location: "Lokasi", units: "Unit", deadlines: "Tarikh akhir", events: "Acara",
    email: "E-mel", password: "Kata laluan", signIn: "Log masuk", signUp: "Daftar", signOut: "Log keluar",
    darkMode: "Mod gelap", light: "Cerah", dark: "Gelap", system: "Sistem"
  },
  ne: {
    home: "होम", calendar: "पात्रो", feed: "फिड", map: "नक्सा", settings: "सेटिङहरू", manageProfiles: "प्रोफाइल व्यवस्थापन",
    loading: "लोड हुँदैछ...", save: "बचत गर्नुहोस्", cancel: "रद्द गर्नुहोस्", delete: "मेटाउनुहोस्", edit: "सम्पादन गर्नुहोस्", add: "थप्नुहोस्", close: "बन्द गर्नुहोस्", back: "पछाडि", next: "अर्को", previous: "अघिल्लो",
    search: "खोज्नुहोस्", filter: "फिल्टर", view: "हेर्नुहोस्", today: "आज", backToToday: "आजमा फर्कनुहोस्",
    status: "स्थिति", date: "मिति", location: "स्थान", units: "एकाइहरू", deadlines: "अन्तिम मिति", events: "कार्यक्रमहरू",
    email: "इमेल", password: "पासवर्ड", signIn: "साइन इन", signUp: "साइन अप", signOut: "साइन आउट",
    darkMode: "डार्क मोड", light: "लाइट", dark: "डार्क", system: "प्रणाली"
  },
  nl: {
    home: "Home", calendar: "Kalender", feed: "Feed", map: "Kaart", settings: "Instellingen", manageProfiles: "Profiel beheren",
    loading: "Laden...", save: "Opslaan", cancel: "Annuleren", delete: "Verwijderen", edit: "Bewerken", add: "Toevoegen", close: "Sluiten", back: "Terug", next: "Volgende", previous: "Vorige",
    search: "Zoeken", filter: "Filter", view: "Bekijken", today: "Vandaag", backToToday: "Terug naar vandaag",
    status: "Status", date: "Datum", location: "Locatie", units: "Vakken", deadlines: "Deadlines", events: "Evenementen",
    email: "E-mail", password: "Wachtwoord", signIn: "Inloggen", signUp: "Registreren", signOut: "Uitloggen",
    darkMode: "Donkere modus", light: "Licht", dark: "Donker", system: "Systeem"
  },
  no: {
    home: "Hjem", calendar: "Kalender", feed: "Strøm", map: "Kart", settings: "Innstillinger", manageProfiles: "Administrer profil",
    loading: "Laster...", save: "Lagre", cancel: "Avbryt", delete: "Slett", edit: "Rediger", add: "Legg til", close: "Lukk", back: "Tilbake", next: "Neste", previous: "Forrige",
    search: "Søk", filter: "Filter", view: "Vis", today: "I dag", backToToday: "Tilbake til i dag",
    status: "Status", date: "Dato", location: "Sted", units: "Emner", deadlines: "Frister", events: "Arrangementer",
    email: "E-post", password: "Passord", signIn: "Logg inn", signUp: "Registrer deg", signOut: "Logg ut",
    darkMode: "Mørk modus", light: "Lys", dark: "Mørk", system: "System"
  },
  pl: {
    home: "Start", calendar: "Kalendarz", feed: "Kanał", map: "Mapa", settings: "Ustawienia", manageProfiles: "Zarządzaj profilem",
    loading: "Ładowanie...", save: "Zapisz", cancel: "Anuluj", delete: "Usuń", edit: "Edytuj", add: "Dodaj", close: "Zamknij", back: "Wstecz", next: "Dalej", previous: "Poprzedni",
    search: "Szukaj", filter: "Filtr", view: "Zobacz", today: "Dzisiaj", backToToday: "Wróć do dzisiaj",
    status: "Status", date: "Data", location: "Lokalizacja", units: "Przedmioty", deadlines: "Terminy", events: "Wydarzenia",
    email: "E-mail", password: "Hasło", signIn: "Zaloguj się", signUp: "Zarejestruj się", signOut: "Wyloguj się",
    darkMode: "Tryb nocny", light: "Jasny", dark: "Ciemny", system: "System"
  },
  pt: {
    home: "Início", calendar: "Calendário", feed: "Feed", map: "Mapa", settings: "Definições", manageProfiles: "Gerir perfil",
    loading: "A carregar...", save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", add: "Adicionar", close: "Fechar", back: "Voltar", next: "Seguinte", previous: "Anterior",
    search: "Pesquisar", filter: "Filtrar", view: "Ver", today: "Hoje", backToToday: "Voltar a hoje",
    status: "Estado", date: "Data", location: "Localização", units: "Unidades", deadlines: "Prazos", events: "Eventos",
    email: "E-mail", password: "Senha", signIn: "Entrar", signUp: "Registar", signOut: "Sair",
    darkMode: "Modo escuro", light: "Claro", dark: "Escuro", system: "Sistema"
  },
  ro: {
    home: "Acasă", calendar: "Calendar", feed: "Flux", map: "Hartă", settings: "Setări", manageProfiles: "Gestionare profil",
    loading: "Se încarcă...", save: "Salvează", cancel: "Anulează", delete: "Șterge", edit: "Editează", add: "Adaugă", close: "Închide", back: "Înapoi", next: "Înainte", previous: "Anterior",
    search: "Caută", filter: "Filtru", view: "Vezi", today: "Azi", backToToday: "Înapoi la azi",
    status: "Status", date: "Data", location: "Locație", units: "Cursuri", deadlines: "Termene", events: "Evenimente",
    email: "E-mail", password: "Parolă", signIn: "Autentificare", signUp: "Înregistrare", signOut: "Deconectare",
    darkMode: "Mod întunecat", light: "Luminos", dark: "Întunecat", system: "Sistem"
  },
  ru: {
    home: "Главная", calendar: "Календарь", feed: "Лента", map: "Карта", settings: "Настройки", manageProfiles: "Профили",
    loading: "Загрузка...", save: "Сохранить", cancel: "Отмена", delete: "Удалить", edit: "Изменить", add: "Добавить", close: "Закрыть", back: "Назад", next: "Далее", previous: "Назад",
    search: "Поиск", filter: "Фильтр", view: "Смотреть", today: "Сегодня", backToToday: "Вернуться к сегодня",
    status: "Статус", date: "Дата", location: "Место", units: "Курсы", deadlines: "Сроки", events: "События",
    email: "Email", password: "Пароль", signIn: "Войти", signUp: "Регистрация", signOut: "Выйти",
    darkMode: "Темная тема", light: "Светлая", dark: "Темная", system: "Системная"
  },
  si: {
    home: "මුල් පිටුව", calendar: "දින දර්ශනය", feed: "පුවත්", map: "සිතියම", settings: "සැකසුම්", manageProfiles: "පැතිකඩ කළමනාකරණය",
    loading: "පූරණය වෙමින්...", save: "සුරකින්න", cancel: "අවලංගු කරන්න", delete: "මකන්න", edit: "සංස්කරණය", add: "එකතු කරන්න", close: "වසා දමන්න", back: "පසුපසට", next: "මීළඟ", previous: "පෙර",
    search: "සොයන්න", filter: "පෙරහන්", view: "බලන්න", today: "අද", backToToday: "අද දිනට ආපසු යන්න",
    status: "තත්ත්වය", date: "දිනය", location: "ස්ථානය", units: "ඒකක", deadlines: "අවසාන දිනයන්", events: "සමරු",
    email: "විද්‍යුත් තැපෑල", password: "මුරපදය", signIn: "ඇතුළු වන්න", signUp: "ලියාපදිංචි වන්න", signOut: "පිටවන්න",
    darkMode: "අඳුරු ප්‍රකාරය", light: "ආලෝකය", dark: "අඳුරු", system: "පද්ධතිය"
  },
  sv: {
    home: "Hem", calendar: "Kalender", feed: "Flöde", map: "Karta", settings: "Inställningar", manageProfiles: "Hantera profil",
    loading: "Laddar...", save: "Spara", cancel: "Avbryt", delete: "Ta bort", edit: "Redigera", add: "Lägg till", close: "Stäng", back: "Bakåt", next: "Nästa", previous: "Föregående",
    search: "Sök", filter: "Filter", view: "Visa", today: "Idag", backToToday: "Tillbaka till idag",
    status: "Status", date: "Datum", location: "Plats", units: "Kurser", deadlines: "Deadlines", events: "Evenemang",
    email: "E-post", password: "Lösenord", signIn: "Logga in", signUp: "Registrera dig", signOut: "Logga ut",
    darkMode: "Mörkt läge", light: "Ljust", dark: "Mörkt", system: "System"
  },
  ta: {
    home: "முகப்பு", calendar: "நாட்காட்டி", feed: "ஊட்டம்", map: "வரைபடம்", settings: "அமைப்புகள்", manageProfiles: "சுயவிவர மேலாண்மை",
    loading: "ஏற்றப்படுகிறது...", save: "சேமி", cancel: "ரத்து செய்", delete: "நீக்கு", edit: "திருத்து", add: "சேர்", close: "மூடு", back: "பின்னால்", next: "அடுத்து", previous: "முந்தைய",
    search: "தேடு", filter: "வடிகட்டி", view: "பார்", today: "இன்று", backToToday: "இன்றுக்குத் திரும்பு",
    status: "நிலை", date: "தேதி", location: "இடம்", units: "பாடங்கள்", deadlines: "காலக்கெடு", events: "நிகழ்வுகள்",
    email: "மின்னஞ்சல்", password: "கடவுச்சொல்", signIn: "உள்நுழை", signUp: "பதிவு செய்", signOut: "வெளியேறு",
    darkMode: "இருண்ட பயன்முறை", light: "ஒளி", dark: "இருள்", system: "கணினி"
  },
  th: {
    home: "หน้าแรก", calendar: "ปฏิทิน", feed: "ฟีด", map: "แผนที่", settings: "การตั้งค่า", manageProfiles: "จัดการโปรไฟล์",
    loading: "กำลังโหลด...", save: "บันทึก", cancel: "ยกเลิก", delete: "ลบ", edit: "แก้ไข", add: "เพิ่ม", close: "ปิด", back: "กลับ", next: "ถัดไป", previous: "ก่อนหน้า",
    search: "ค้นหา", filter: "ตัวกรอง", view: "ดู", today: "วันนี้", backToToday: "กลับไปยังวันนี้",
    status: "สถานะ", date: "วันที่", location: "สถานที่", units: "วิชา", deadlines: "กำหนดส่ง", events: "กิจกรรม",
    email: "อีเมล", password: "รหัสผ่าน", signIn: "เข้าสู่ระบบ", signUp: "ลงทะเบียน", signOut: "ออกจากระบบ",
    darkMode: "โหมดมืด", light: "สว่าง", dark: "มืด", system: "ระบบ"
  },
  tr: {
    home: "Ana Sayfa", calendar: "Takvim", feed: "Akış", map: "Harita", settings: "Ayarlar", manageProfiles: "Profili Yönet",
    loading: "Yükleniyor...", save: "Kaydet", cancel: "İptal", delete: "Sil", edit: "Düzenle", add: "Ekle", close: "Kapat", back: "Geri", next: "İleri", previous: "Geri",
    search: "Ara", filter: "Filtre", view: "Görüntüle", today: "Bugün", backToToday: "Bugüne Dön",
    status: "Durum", date: "Tarih", location: "Konum", units: "Dersler", deadlines: "Son Tarihler", events: "Etkinlikler",
    email: "E-posta", password: "Şifre", signIn: "Giriş Yap", signUp: "Kayıt Ol", signOut: "Çıkış Yap",
    darkMode: "Karanlık Mod", light: "Açık", dark: "Karanlık", system: "Sistem"
  },
  uk: {
    home: "Головна", calendar: "Календар", feed: "Стрічка", map: "Карта", settings: "Налаштування", manageProfiles: "Профіль",
    loading: "Завантаження...", save: "Зберегти", cancel: "Скасувати", delete: "Видалити", edit: "Редагувати", add: "Додати", close: "Закрити", back: "Назад", next: "Далі", previous: "Назад",
    search: "Пошук", filter: "Фільтр", view: "Перегляд", today: "Сьогодні", backToToday: "Назад до сьогодні",
    status: "Статус", date: "Дата", location: "Місце", units: "Курси", deadlines: "Терміни", events: "Події",
    email: "Email", password: "Пароль", signIn: "Увійти", signUp: "Реєстрація", signOut: "Вийти",
    darkMode: "Темна тема", light: "Світла", dark: "Темна", system: "Системна"
  },
  ur: {
    home: "ہوم", calendar: "کیلنڈر", feed: "فیڈ", map: "نقشہ", settings: "ترتیبات", manageProfiles: "پروفائل کا انتظام",
    loading: "لوڈ ہو رہا ہے...", save: "محفوظ کریں", cancel: "منسوخ کریں", delete: "حذف کریں", edit: "ترمیم کریں", add: "شامل کریں", close: "بند کریں", back: "واپس", next: "اگلا", previous: "پچھلا",
    search: "تلاش", filter: "فلٹر", view: "دیکھیں", today: "آج", backToToday: "آج پر واپس جائیں",
    status: "حیثیت", date: "تاریخ", location: "مقام", units: "یونٹس", deadlines: "آخری تاریخیں", events: "واقعات",
    email: "ای میل", password: "پاس ورڈ", signIn: "سائن ان", signUp: "سائن اپ", signOut: "سائن آؤٹ",
    darkMode: "ڈارک موڈ", light: "لائٹ", dark: "ڈارک", system: "سسٹم"
  },
  vi: {
    home: "Trang chủ", calendar: "Lịch", feed: "Bảng tin", map: "Bản đồ", settings: "Cài đặt", manageProfiles: "Quản lý hồ sơ",
    loading: "Đang tải...", save: "Lưu", cancel: "Hủy", delete: "Xóa", edit: "Sửa", add: "Thêm", close: "Đóng", back: "Quay lại", next: "Tiếp theo", previous: "Trước đó",
    search: "Tìm kiếm", filter: "Bộ lọc", view: "Xem", today: "Hôm nay", backToToday: "Quay lại hôm nay",
    status: "Trạng thái", date: "Ngày", location: "Vị trí", units: "Môn học", deadlines: "Hạn chót", events: "Sự kiện",
    email: "Email", password: "Mật khẩu", signIn: "Đăng nhập", signUp: "Đăng ký", signOut: "Đăng xuất",
    darkMode: "Chế độ tối", light: "Sáng", dark: "Tối", system: "Hệ thống"
  },
  zh: {
    home: "首页", calendar: "日历", feed: "动态", map: "地图", settings: "设置", manageProfiles: "个人资料管理",
    loading: "正在加载...", save: "保存", cancel: "取消", delete: "删除", edit: "编辑", add: "添加", close: "关闭", back: "返回", next: "下一步", previous: "上一步",
    search: "搜索", filter: "过滤", view: "查看", today: "今天", backToToday: "返回今天",
    status: "状态", date: "日期", location: "地点", units: "科目", deadlines: "截止日期", events: "活动",
    email: "邮箱", password: "密码", signIn: "登录", signUp: "注册", signOut: "退出登录",
    darkMode: "深色模式", light: "浅色", dark: "深色", system: "系统"
  }
};

async function main() {
  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);

  for (const locale of locales) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, 'utf8');
    const json = JSON.parse(content);

    const common = COMMON_TRANSLATIONS[locale];
    if (common) {
      for (const [key, value] of Object.entries(common)) {
        // Only update if it was likely English or missing
        if (json[key] === undefined || /^[A-Za-z\s.!?&-]+$/.test(json[key])) {
           json[key] = value;
        }
      }
      await fs.writeFile(localeFilePath, JSON.stringify(json, null, 2));
      console.log(`Updated common translations for ${locale}`);
    }
  }
}

main().catch(console.error);
