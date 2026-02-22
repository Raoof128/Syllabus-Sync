import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

const BATCH_2 = {
  nl: {
    settings_about: "Over",
    security: "Beveiliging",
    linkExpiredOrInvalid: "Link verlopen of ongeldig",
    requestNewResetLink: "Nieuwe resetlink aanvragen",
    verifyingRequest: "Uw verzoek verifiëren...",
    redirecting: "Doorsturen...",
    loadingContentPleaseWait: "Inhoud laden, even geduld aub",
    youAreOfflineDesc:
      "Syllabus Sync vereist een internetverbinding. Controleer uw verzoek en probeer het opnieuw.",
    errorProfileLoad:
      "We konden uw profielinstellingen niet laden. Dit is gemeld bij ons technische team.",
    passkeysBiometricLogin: "Passkeys & biometrisch inloggen",
    announcements: "Aankondigingen",
    thisWeek: "Deze week",
    totalEvents: "Totaal aantal evenementen",
    freeFood: "Gratis eten",
  },
  sv: {
    settings_about: "Om",
    security: "Säkerhet",
    linkExpiredOrInvalid: "Länken har löpt ut eller är ogiltig",
    requestNewResetLink: "Begär ny återställningslänk",
    verifyingRequest: "Verifierar din begäran...",
    redirecting: "Omdirigerar...",
    loadingContentPleaseWait: "Laddar innehåll, vänta...",
    youAreOfflineDesc:
      "Syllabus Sync kräver en internetanslutning. Kontrollera din anslutning och försök igen.",
    errorProfileLoad:
      "Vi kunde inte ladda dina profilinställningar. Detta har rapporterats till vårt tekniska team.",
    passkeysBiometricLogin: "Passkeys & biometrisk inloggning",
    announcements: "Meddelanden",
    thisWeek: "Denna vecka",
    totalEvents: "Totalt antal evenemang",
    freeFood: "Gratis mat",
  },
  no: {
    settings_about: "Om",
    security: "Sikkerhet",
    linkExpiredOrInvalid: "Koblingen er utløpt eller ugyldig",
    requestNewResetLink: "Be om ny tilbakestillingskobling",
    verifyingRequest: "Verifiserer forespørselen dein...",
    redirecting: "Omdirigerer...",
    loadingContentPleaseWait: "Laster innhold, vennligst vent",
    youAreOfflineDesc:
      "Syllabus Sync krever en internettforbindelse. Vennligst sjekk forbindelsen din og prøv på nytt.",
    errorProfileLoad:
      "Vi kunne ikke laste inn profilinnstillingene dine. Dette har blitt rapportert til vårt tekniske team.",
    passkeysBiometricLogin: "Passkeys & biometrisk pålogging",
    announcements: "Kunngjøringer",
    thisWeek: "Denne uken",
    totalEvents: "Totalt antall arrangementer",
    freeFood: "Gratis mat",
  },
  da: {
    settings_about: "Om",
    security: "Sikkerhed",
    linkExpiredOrInvalid: "Linket er udløbet eller ugyldigt",
    requestNewResetLink: "Anmod om nyt nulstillingslink",
    verifyingRequest: "Verificerer din anmodning...",
    redirecting: "Omdirigerer...",
    loadingContentPleaseWait: "Indlæser indhold, vent venligst",
    youAreOfflineDesc:
      "Syllabus Sync kræver en internetforbindelse. Tjek venligst din forbindelse og prøv igen.",
    errorProfileLoad:
      "Vi kunne ikke indlæse dine profilindstillinger. Dette er blevet rapporteret til vores tekniske team.",
    passkeysBiometricLogin: "Passkeys & biometrisk login",
    announcements: "Meddelelser",
    thisWeek: "Denne uge",
    totalEvents: "Samlede begivenheder",
    freeFood: "Gratis mad",
  },
  fi: {
    settings_about: "Tietoja",
    security: "Turvallisuus",
    linkExpiredOrInvalid: "Linkki vanhentunut tai virheellinen",
    requestNewResetLink: "Pyydä uusi palautuslinkki",
    verifyingRequest: "Vahvistetaan pyyntöäsi...",
    redirecting: "Uudelleenohjataan...",
    loadingContentPleaseWait: "Ladataan sisältöä, odota hetki",
    youAreOfflineDesc:
      "Syllabus Sync vaatii Internet-yhteyden. Tarkista yhteys ja yritä uudelleen.",
    errorProfileLoad:
      "Profiiliasetuksiasi ei voitu ladata. Tästä on ilmoitettu tekniselle tiimillemme.",
    passkeysBiometricLogin: "Passkeyt & biometrinen kirjautuminen",
    announcements: "Ilmoitukset",
    thisWeek: "Tällä viikolla",
    totalEvents: "Tapahtumia yhteensä",
    freeFood: "Ilmainen ruoka",
  },
  tr: {
    settings_about: "Hakkında",
    security: "Güvenlik",
    linkExpiredOrInvalid: "Bağlantı süresi dolmuş veya geçersiz",
    requestNewResetLink: "Yeni sıfırlama bağlantısı iste",
    verifyingRequest: "İsteğiniz doğrulanıyor...",
    redirecting: "Yönlendiriliyor...",
    loadingContentPleaseWait: "İçerik yükleniyor, lütfen bekleyin",
    youAreOfflineDesc:
      "Syllabus Sync internet bağlantısı gerektirir. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.",
    errorProfileLoad:
      "Profil ayarlarınız yüklenemedi. Bu durum teknik ekibimize bildirildi.",
    passkeysBiometricLogin: "Geçiş Anahtarları ve Biyometrik Giriş",
    announcements: "Duyurular",
    thisWeek: "Bu Hafta",
    totalEvents: "Toplam Etkinlik",
    freeFood: "Ücretsiz Yemek",
  },
  pl: {
    settings_about: "O aplikacji",
    security: "Bezpieczeństwo",
    linkExpiredOrInvalid: "Link wygasł lub jest nieprawidłowy",
    requestNewResetLink: "Poproś o nowy link resetujący",
    verifyingRequest: "Weryfikacja żądania...",
    redirecting: "Przekierowywanie...",
    loadingContentPleaseWait: "Ładowanie treści, proszę czekać",
    youAreOfflineDesc:
      "Syllabus Sync wymaga połączenia z Internetem. Sprawdź połączenie i spróbuj ponownie.",
    errorProfileLoad:
      "Nie udało się załadować ustawień profilu. Zgłoszono to naszemu zespołowi technicznemu.",
    passkeysBiometricLogin: "Klucze dostępu i logowanie biometryczne",
    announcements: "Ogłoszenia",
    thisWeek: "W tym tygodniu",
    totalEvents: "Wszystkie wydarzenia",
    freeFood: "Darmowe jedzenie",
  },
  hu: {
    settings_about: "Névjegy",
    security: "Biztonság",
    linkExpiredOrInvalid: "A link lejárt vagy érvénytelen",
    requestNewResetLink: "Új jelszó-visszaállító link kérése",
    verifyingRequest: "Kérés ellenőrzése...",
    redirecting: "Átirányítás...",
    loadingContentPleaseWait: "Tartalom betöltése, kérjük várjon",
    youAreOfflineDesc:
      "A Syllabus Sync használatához internetkapcsolat szükséges. Kérjük, ellenőrizze a kapcsolatot, és próbálja újra.",
    errorProfileLoad:
      "Nem sikerült betölteni a profilbeállításokat. Ezt jeleztük a technikai csapatunknak.",
    passkeysBiometricLogin: "Jelkulcsok és biometrikus belépés",
    announcements: "Hirdetmények",
    thisWeek: "Ezen a héten",
    totalEvents: "Összes esemény",
    freeFood: "Ingyen étel",
  },
  ro: {
    settings_about: "Despre",
    security: "Securitate",
    linkExpiredOrInvalid: "Link expirat sau invalid",
    requestNewResetLink: "Solicită un nou link de resetare",
    verifyingRequest: "Se verifică solicitarea...",
    redirecting: "Se redirecționează...",
    loadingContentPleaseWait: "Se încarcă conținutul, vă rugăm așteptați",
    youAreOfflineDesc:
      "Syllabus Sync necesită o conexiune la internet. Vă rugăm să verificați conexiunea și să încercați din nou.",
    errorProfileLoad:
      "Nu am putut încărca setările profilului tău. Acest lucru a fost raportat echipei noastre tehnice.",
    passkeysBiometricLogin: "Chei de acces și autentificare biometrică",
    announcements: "Anunțuri",
    thisWeek: "Săptămâna aceasta",
    totalEvents: "Total evenimente",
    freeFood: "Mâncare gratuită",
  },
  cs: {
    settings_about: "O aplikaci",
    security: "Zabezpečení",
    linkExpiredOrInvalid: "Odkaz vypršel nebo je neplatný",
    requestNewResetLink: "Požádat o nový odkaz pro resetování",
    verifyingRequest: "Ověřování požadavku...",
    redirecting: "Přesměrování...",
    loadingContentPleaseWait: "Načítání obsahu, čekejte prosím",
    youAreOfflineDesc:
      "Syllabus Sync vyžaduje připojení k internetu. Zkontrolujte prosím připojení a zkuste to znovu.",
    errorProfileLoad:
      "Nepodařilo se načíst nastavení profilu. Bylo to nahlášeno našemu technickému týmu.",
    passkeysBiometricLogin: "Přístupové klíče a biometrické přihlášení",
    announcements: "Oznámení",
    thisWeek: "Tento týden",
    totalEvents: "Celkem událostí",
    freeFood: "Jídlo zdarma",
  },
  id: {
    settings_about: "Tentang",
    security: "Keamanan",
    linkExpiredOrInvalid: "Tautan kedaluwarsa atau tidak valid",
    requestNewResetLink: "Minta tautan pengaturan ulang baru",
    verifyingRequest: "Memverifikasi permintaan Anda...",
    redirecting: "Mengarahkan...",
    loadingContentPleaseWait: "Memuat konten, harap tunggu",
    youAreOfflineDesc:
      "Syllabus Sync memerlukan koneksi internet. Silakan periksa koneksi Anda dan coba lagi.",
    errorProfileLoad:
      "Kami tidak dapat memuat pengaturan profil Anda. Masalah ini telah dilaporkan ke tim teknis kami.",
    passkeysBiometricLogin: "Kunci Akses & Login Biometrik",
    announcements: "Pengumuman",
    thisWeek: "Minggu Ini",
    totalEvents: "Total Acara",
    freeFood: "Makanan Gratis",
  },
  ms: {
    settings_about: "Tentang",
    security: "Keselamatan",
    linkExpiredOrInvalid: "Pautan tamat tempoh atau tidak sah",
    requestNewResetLink: "Minta pautan penetapan semula baharu",
    verifyingRequest: "Mengesahkan permintaan anda...",
    redirecting: "Menghalakan semula...",
    loadingContentPleaseWait: "Memuatkan kandungan, sila tunggu",
    youAreOfflineDesc:
      "Syllabus Sync memerlukan sambungan internet. Sila semak sambungan anda dan cuba lagi.",
    errorProfileLoad:
      "Kami tidak dapat memuatkan tetapan profil anda. Ini telah dilaporkan kepada pasukan teknikal kami.",
    passkeysBiometricLogin: "Kunci Akses & Log Masuk Biometrik",
    announcements: "Pengumuman",
    thisWeek: "Minggu Ini",
    totalEvents: "Jumlah Acara",
    freeFood: "Makanan Percuma",
  },
  th: {
    settings_about: "เกี่ยวกับ",
    security: "ความปลอดภัย",
    linkExpiredOrInvalid: "ลิงก์หมดอายุหรือไมถูกต้อง",
    requestNewResetLink: "ขอลิงก์รีเซ็ตใหม่",
    verifyingRequest: "กำลังตรวจสอบคำขอของคุณ...",
    redirecting: "กำลังเปลี่ยนเส้นทาง...",
    loadingContentPleaseWait: "กำลังโหลดเนื้อหา โปรดรอสักครู่",
    youAreOfflineDesc:
      "Syllabus Sync จำเป็นต้องมีการเชื่อมต่ออินเทอร์เน็ต โปรดตรวจสอบการเชื่อมต่อของคุณแล้วลองอีกครั้ง",
    errorProfileLoad:
      "เราไม่สามารถโหลดการตั้งค่าโปรไฟล์ของคุณได้ ปัญหานี้ได้รับการรายงานไปยังทีมวิศวกรของเราแล้ว",
    passkeysBiometricLogin: "พาสคีย์และการเข้าสู่ระบบด้วยไบโอเมตริกซ์",
    announcements: "ประกาศ",
    thisWeek: "สัปดาห์นี้",
    totalEvents: "กิจกรรมทั้งหมด",
    freeFood: "อาหารฟรี",
  },
  vi: {
    settings_about: "Giới thiệu",
    security: "Bảo mật",
    linkExpiredOrInvalid: "Liên kết đã hết hạn hoặc không hợp lệ",
    requestNewResetLink: "Yêu cầu liên kết đặt lại mới",
    verifyingRequest: "Đang xác minh yêu cầu của bạn...",
    redirecting: "Đang chuyển hướng...",
    loadingContentPleaseWait: "Đang tải nội dung, vui lòng đợi",
    youAreOfflineDesc:
      "Syllabus Sync yêu cầu kết nối internet. Vui lòng kiểm tra kết nối của bạn và thử lại.",
    errorProfileLoad:
      "Chúng tôi không thể tải cài đặt hồ sơ của bạn. Điều này đã được báo cáo cho đội ngũ kỹ thuật của chúng tôi.",
    passkeysBiometricLogin: "Passkey & Đăng nhập sinh trắc học",
    announcements: "Thông báo",
    thisWeek: "Tuần này",
    totalEvents: "Tổng số sự kiện",
    freeFood: "Thức ăn miễn phí",
  },
  he: {
    settings_about: "אודות",
    security: "אבטחה",
    linkExpiredOrInvalid: "הקישור פג תוקף או לא תקין",
    requestNewResetLink: "בקש קישור איפוס חדש",
    verifyingRequest: "מאמת את הבקשה שלך...",
    redirecting: "מפנה...",
    loadingContentPleaseWait: "טוען תוכן, אנא המתן",
    youAreOfflineDesc:
      "Syllabus Sync דורש חיבור לאינטרנט. אנא בדוק את החיבור שלך ונסה שוב.",
    errorProfileLoad:
      "לא הצלחנו לטעון את הגדרות הפרופיל שלך. הנושא דווח לצוות ההנדסה שלנו.",
    passkeysBiometricLogin: "מפתחות גישה וכניסה ביומטרית",
    announcements: "הודעות",
    thisWeek: "השבוע",
    totalEvents: 'סה"כ אירועים',
    freeFood: "אוכל חינם",
  },
  fa: {
    settings_about: "درباره",
    security: "امنیت",
    linkExpiredOrInvalid: "لینک منقضی شده یا نامعتبر است",
    requestNewResetLink: "درخواست لینک بازنشانی جدید",
    verifyingRequest: "در حال تأیید درخواست شما...",
    redirecting: "در حال هدایت...",
    loadingContentPleaseWait: "در حال بارگذاری محتوا، لطفاً منتظر بمانید",
    youAreOfflineDesc:
      "Syllabus Sync به اتصال اینترنت نیاز دارد. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.",
    errorProfileLoad:
      "ما نتوانستیم تنظیمات پروفایل شما را بارگذاری کنیم. این موضوع به تیم مهندسی ما گزارش شده است.",
    passkeysBiometricLogin: "کلیدهای عبور و ورود بیومتریک",
    announcements: "اعلان‌ها",
    thisWeek: "این هفته",
    totalEvents: "مجموع رویدادها",
    freeFood: "غذای رایگان",
  },
  ur: {
    settings_about: "بارے میں",
    security: "سیکیورٹی",
    linkExpiredOrInvalid: "لنک کی میعاد ختم ہو گئی ہے یا غیر درست ہے",
    requestNewResetLink: "نیا ری سیٹ لنک طلب کریں",
    verifyingRequest: "آپ کی درخواست کی تصدیق ہو رہی ہے...",
    redirecting: "ری ڈائریکٹ ہو رہا ہے...",
    loadingContentPleaseWait: "مواد لوڈ ہو رہا ہے، براہ کرم انتظار کریں",
    youAreOfflineDesc:
      "سلیبس سنک کے لیے انٹرنیٹ کنکشن درکار ہے۔ براہ کرم اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔",
    errorProfileLoad:
      "ہم آپ کے پروفائل کی ترتیبات لوڈ نہیں کر سکے۔ اس کی اطلاع ہماری انجینئرنگ ٹیم کو دے دی گئی ہے۔",
    passkeysBiometricLogin: "اس کیز اور بائیو میٹرک لاگ ان",
    announcements: "اعلانانات",
    thisWeek: "اس ہفتے",
    totalEvents: "کل واقعات",
    freeFood: "مفت کھانا",
  },
  uk: {
    settings_about: "Про додаток",
    security: "Безпека",
    linkExpiredOrInvalid: "Посилання закінчилося або недійсне",
    requestNewResetLink: "Запросити нове посилання для скидання",
    verifyingRequest: "Перевірка вашого запиту...",
    redirecting: "Перенаправлення...",
    loadingContentPleaseWait: "Завантаження контенту, будь ласка, зачекайте",
    youAreOfflineDesc:
      "Syllabus Sync потребує підключення к інтернету. Будь ласка, перевірте з'єднання та спробуйте ще раз.",
    errorProfileLoad:
      "Не вдалося завантажити налаштування профілю. Про це повідомлено нашу інженерну групу.",
    passkeysBiometricLogin: "Ключі доступу та біометричний вхід",
    announcements: "Оголошення",
    thisWeek: "Цього тижня",
    totalEvents: "Всього подій",
    freeFood: "Безкоштовна їжа",
  },
  ta: {
    settings_about: "பற்றி",
    security: "பாதுகாப்பு",
    linkExpiredOrInvalid: "இணைப்பு காலாவதியானது அல்லது தவறானது",
    requestNewResetLink: "புதிய மீட்டமைப்பு இணைப்பைக் கோரவும்",
    verifyingRequest: "உங்கள் கோரிக்கையைச் சரிபார்க்கிறது...",
    redirecting: "மறுதிசைப்படுத்துகிறது...",
    loadingContentPleaseWait:
      "உள்ளடக்கம் ஏற்றப்படுகிறது, தயவுசெய்து காத்திருக்கவும்",
    youAreOfflineDesc:
      "Syllabus Sync-க்கு இணைய இணைப்பு தேவை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    errorProfileLoad:
      "உங்கள் சுயவிவர அமைப்புகளை எங்களால் ஏற்ற முடியவில்லை. இது எங்கள் பொறியியல் குழுவிற்குத் தெரிவிக்கப்பட்டுள்ளது.",
    passkeysBiometricLogin: "பாஸ்கீகள் மற்றும் பயோமெட்ரிக் உள்நுழைவு",
    announcements: "அறிவிப்புகள்",
    thisWeek: "இந்த வாரம்",
    totalEvents: "மொத்த நிகழ்வுகள்",
    freeFood: "இலவச உணவு",
  },
  bn: {
    settings_about: "সম্পর্কে",
    security: "নিরাপত্তা",
    linkExpiredOrInvalid: "লিঙ্কটি মেয়াদোত্তীর্ণ বা অবৈধ",
    requestNewResetLink: "নতুন রিসেট লিঙ্কের জন্য অনুরোধ করুন",
    verifyingRequest: "আপনার অনুরোধ যাচাই করা হচ্ছে...",
    redirecting: "পুনঃনির্দেশ করা হচ্ছে...",
    loadingContentPleaseWait: "কন্টেন্ট লোড হচ্ছে, দয়া করে অপেক্ষা করুন",
    youAreOfflineDesc:
      "Syllabus Sync-এর জন্য ইন্টারনেট সংযোগ প্রয়োজন। অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।",
    errorProfileLoad:
      "আমরা আপনার প্রোফাইল সেটিংস লোড করতে পারিনি। এটি আমাদের ইঞ্জিনিয়ারিং টিমকে জানানো হয়েছে।",
    passkeysBiometricLogin: "পাসকি এবং বায়োমেট্রিক লগইন",
    announcements: "ঘোষণা",
    thisWeek: "এই সপ্তাহে",
    totalEvents: "মোট ইভেন্ট",
    freeFood: "বিনামূল্যে খাবার",
  },
  ne: {
    settings_about: "बारेमा",
    security: "सुरक्षा",
    linkExpiredOrInvalid: "लिङ्क समाप्त भएको वा अमान्य छ",
    requestNewResetLink: "नयाँ रिसेट लिङ्क अनुरोध गर्नुहोस्",
    verifyingRequest: "तपाईंको अनुरोध प्रमाणित गरिँदैछ...",
    redirecting: "पुन: निर्देशित गरिँदैछ...",
    loadingContentPleaseWait: "सामग्री लोड हुँदैछ, कृपया पर्खनुहोस्",
    youAreOfflineDesc:
      "Syllabus Sync को लागि इन्टरनेट जडान आवश्यक छ। कृपया आफ्नो जडान जाँच गर्नुहोस् र पुन: प्रयास गर्नुहोस्।",
    errorProfileLoad:
      "हामीले तपाईंको प्रोफाइल सेटिङहरू लोड गर्न सकेनौं। यो हाम्रो इन्जिनियरिङ टोलीलाई जानकारी गराइएको छ।",
    passkeysBiometricLogin: "पासकी र बायोमेट्रिक लगइन",
    announcements: "घोषणा",
    thisWeek: "यो हप्ता",
    totalEvents: "कुल कार्यक्रमहरू",
    freeFood: "नि: शुल्क खाना",
  },
  si: {
    settings_about: "පිළිබඳව",
    security: "ආරක්ෂාව",
    linkExpiredOrInvalid: "සබැඳිය කල් ඉකුත් වී ඇත හෝ වලංගු නොවේ",
    requestNewResetLink: "නව යළි පිහිටුවීමේ සබැඳියක් ඉල්ලන්න",
    verifyingRequest: "ඔබගේ ඉල්ලීම පරීක්ෂා කරමින්...",
    redirecting: "යොමු කරමින්...",
    loadingContentPleaseWait:
      "අන්තර්ගතය පූරණය වෙමින් පවතී, කරුණාකර රැඳී සිටින්න",
    youAreOfflineDesc:
      "Syllabus Sync සඳහා අන්තර්ජාල සම්බන්ධතාවයක් අවශ්‍ය වේ. කරුණාකර ඔබගේ සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
    errorProfileLoad:
      "අපට ඔබගේ පැතිකඩ සැකසුම් පූරණය කිරීමට නොහැකි විය. මෙය අපගේ ඉංජිනේරු කණ්ඩායමට දන්වා ඇත.",
    passkeysBiometricLogin: "පැස්කී සහ ජෛවමිතික පුරනය වීම",
    announcements: "නිවේදන",
    thisWeek: "මේ සතියේ",
    totalEvents: "මුළු සිදුවීම්",
    freeFood: "නොමිලේ ආහාර",
  },
};

async function main() {
  for (const locale of Object.keys(BATCH_2)) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, "utf8");
    const json = JSON.parse(content);

    const translations = BATCH_2[locale];
    for (const [key, value] of Object.entries(translations)) {
      json[key] = value;
    }

    await fs.writeFile(localeFilePath, JSON.stringify(json, null, 2));
    console.log(`Updated Batch 2 translations for ${locale}`);
  }
}

main().catch(console.error);
