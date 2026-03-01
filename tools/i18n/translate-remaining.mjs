/**
 * Translate the 18 new keys for remaining locales that weren't covered
 * in the first batch.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en', 'translations.json'), 'utf8'));

const TRANSLATIONS = {
  bn: {
    failedToStartSetup: 'সেটআপ শুরু করতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।',
    verificationFailedCheckCode: 'যাচাই ব্যর্থ। অনুগ্রহ করে আপনার কোড পরীক্ষা করুন।',
    invalidCodeTryAgain: 'অবৈধ কোড। অনুগ্রহ করে আবার চেষ্টা করুন।',
    twoFactorEnabled: 'দ্বি-ফ্যাক্টর প্রমাণীকরণ সক্রিয়!',
    networkErrorCheckConnection:
      'নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    failedToDisable2FA: 'দ্বি-ফ্যাক্টর প্রমাণীকরণ নিষ্ক্রিয় করতে ব্যর্থ',
    twoFactorDisabled: 'দ্বি-ফ্যাক্টর প্রমাণীকরণ নিষ্ক্রিয়।',
    authenticatorAppsList: 'Google Authenticator, Authy, বা Microsoft Authenticator',
    totpSecurityNote:
      'নিরাপত্তার জন্য, আপনার ৬-সংখ্যার কোড একটি সক্রিয় গাণিতিক স্বাক্ষর হিসাবে কাজ করে যা প্রতি ৩০ সেকেন্ডে রিফ্রেশ হয়। একবার ব্যবহার করা হলে, রিপ্লে আক্রমণ প্রতিরোধ করতে এটি স্থায়ীভাবে অবৈধ হয়ে যায়।',
    typeCodeManually: 'ম্যানুয়ালি লিঙ্ক করতে এই কোডটি আপনার অ্যাপে টাইপ করুন।',
    passkeysNotSupported: 'এই ডিভাইসে পাসকি সমর্থিত নয়।',
    invalidCode: 'অবৈধ কোড',
    failedToDisableSms2FA: 'SMS দ্বি-ফ্যাক্টর প্রমাণীকরণ নিষ্ক্রিয় করতে ব্যর্থ',
    sectionError: 'বিভাগ ত্রুটি',
    errorInSection: '{{section}}-এ ত্রুটি',
    sectionErrorMessage:
      'এই বিভাগ লোড করার সময় কিছু ভুল হয়েছে। আপনি আবার চেষ্টা করতে পারেন বা অন্যান্য সেটিংস পরীক্ষা করতে পারেন।',
    unitNotFoundHint: 'আপনার ইউনিট খুঁজে পাচ্ছেন না? নিচে কোড এবং নাম ম্যানুয়ালি প্রবেশ করান।',
    clickToChangeLocation: '(অবস্থান পরিবর্তন করতে ক্লিক করুন)',
  },
  cs: {
    failedToStartSetup: 'Spuštění nastavení se nezdařilo. Zkuste to prosím znovu.',
    verificationFailedCheckCode: 'Ověření se nezdařilo. Zkontrolujte prosím svůj kód.',
    invalidCodeTryAgain: 'Neplatný kód. Zkuste to prosím znovu.',
    twoFactorEnabled: 'Dvoufaktorové ověřování aktivováno!',
    networkErrorCheckConnection: 'Chyba sítě. Zkontrolujte připojení a zkuste to znovu.',
    failedToDisable2FA: 'Deaktivace dvoufaktorového ověřování se nezdařila',
    twoFactorDisabled: 'Dvoufaktorové ověřování deaktivováno.',
    authenticatorAppsList: 'Google Authenticator, Authy nebo Microsoft Authenticator',
    totpSecurityNote:
      'Z bezpečnostních důvodů funguje váš 6místný kód jako aktivní matematický podpis, který se obnovuje každých 30 sekund. Po použití je trvale zneplatněn, aby se zabránilo útokům přehráním.',
    typeCodeManually: 'Zadejte tento kód do aplikace pro ruční propojení.',
    passkeysNotSupported: 'Přístupové klíče nejsou na tomto zařízení podporovány.',
    invalidCode: 'Neplatný kód',
    failedToDisableSms2FA: 'Deaktivace SMS dvoufaktorového ověřování se nezdařila',
    sectionError: 'Chyba sekce',
    errorInSection: 'Chyba v {{section}}',
    sectionErrorMessage:
      'Při načítání této sekce došlo k chybě. Můžete to zkusit znovu nebo zkontrolovat jiná nastavení.',
    unitNotFoundHint: 'Nenašli jste svůj předmět? Zadejte kód a název ručně níže.',
    clickToChangeLocation: '(klikněte pro změnu umístění)',
  },
  da: {
    failedToStartSetup: 'Opsætningen kunne ikke startes. Prøv venligst igen.',
    verificationFailedCheckCode: 'Bekræftelse mislykkedes. Tjek venligst din kode.',
    invalidCodeTryAgain: 'Ugyldig kode. Prøv venligst igen.',
    twoFactorEnabled: 'Tofaktor-godkendelse aktiveret!',
    networkErrorCheckConnection: 'Netværksfejl. Tjek din forbindelse og prøv igen.',
    failedToDisable2FA: 'Kunne ikke deaktivere tofaktor-godkendelse',
    twoFactorDisabled: 'Tofaktor-godkendelse deaktiveret.',
    authenticatorAppsList: 'Google Authenticator, Authy eller Microsoft Authenticator',
    totpSecurityNote:
      'Af sikkerhedshensyn fungerer din 6-cifrede kode som en aktiv matematisk signatur, der opdateres hvert 30. sekund. Når den er brugt, bliver den permanent ugyldig for at forhindre genafspilningsangreb.',
    typeCodeManually: 'Indtast denne kode i din app for at forbinde den manuelt.',
    passkeysNotSupported: 'Adgangsnøgler understøttes ikke på denne enhed.',
    invalidCode: 'Ugyldig kode',
    failedToDisableSms2FA: 'Kunne ikke deaktivere SMS tofaktor-godkendelse',
    sectionError: 'Sektionsfejl',
    errorInSection: 'Fejl i {{section}}',
    sectionErrorMessage:
      'Noget gik galt under indlæsning af denne sektion. Du kan prøve igen eller tjekke andre indstillinger.',
    unitNotFoundHint: 'Kan du ikke finde dit fag? Indtast koden og navnet manuelt nedenfor.',
    clickToChangeLocation: '(klik for at ændre placering)',
  },
  el: {
    failedToStartSetup: 'Αποτυχία εκκίνησης ρύθμισης. Δοκιμάστε ξανά.',
    verificationFailedCheckCode: 'Η επαλήθευση απέτυχε. Ελέγξτε τον κωδικό σας.',
    invalidCodeTryAgain: 'Μη έγκυρος κωδικός. Δοκιμάστε ξανά.',
    twoFactorEnabled: 'Ο έλεγχος ταυτότητας δύο παραγόντων ενεργοποιήθηκε!',
    networkErrorCheckConnection: 'Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
    failedToDisable2FA: 'Αποτυχία απενεργοποίησης ελέγχου ταυτότητας δύο παραγόντων',
    twoFactorDisabled: 'Ο έλεγχος ταυτότητας δύο παραγόντων απενεργοποιήθηκε.',
    authenticatorAppsList: 'Google Authenticator, Authy ή Microsoft Authenticator',
    totpSecurityNote:
      'Για λόγους ασφαλείας, ο 6ψήφιος κωδικός σας λειτουργεί ως ενεργή μαθηματική υπογραφή που ανανεώνεται κάθε 30 δευτερόλεπτα. Μόλις χρησιμοποιηθεί, ακυρώνεται μόνιμα για την αποτροπή επιθέσεων επανάληψης.',
    typeCodeManually: 'Πληκτρολογήστε αυτόν τον κωδικό στην εφαρμογή σας για χειροκίνητη σύνδεση.',
    passkeysNotSupported: 'Τα κλειδιά πρόσβασης δεν υποστηρίζονται σε αυτή τη συσκευή.',
    invalidCode: 'Μη έγκυρος κωδικός',
    failedToDisableSms2FA: 'Αποτυχία απενεργοποίησης SMS ελέγχου ταυτότητας',
    sectionError: 'Σφάλμα ενότητας',
    errorInSection: 'Σφάλμα στο {{section}}',
    sectionErrorMessage:
      'Κάτι πήγε στραβά κατά τη φόρτωση αυτής της ενότητας. Μπορείτε να δοκιμάσετε ξανά ή να ελέγξετε άλλες ρυθμίσεις.',
    unitNotFoundHint:
      'Δεν βρίσκετε το μάθημά σας; Εισάγετε τον κωδικό και το όνομα χειροκίνητα παρακάτω.',
    clickToChangeLocation: '(κάντε κλικ για αλλαγή τοποθεσίας)',
  },
  fa: {
    failedToStartSetup: 'شروع تنظیمات ناموفق بود. لطفاً دوباره تلاش کنید.',
    verificationFailedCheckCode: 'تأیید ناموفق بود. لطفاً کد خود را بررسی کنید.',
    invalidCodeTryAgain: 'کد نامعتبر. لطفاً دوباره تلاش کنید.',
    twoFactorEnabled: 'احراز هویت دو مرحله‌ای فعال شد!',
    networkErrorCheckConnection: 'خطای شبکه. لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.',
    failedToDisable2FA: 'غیرفعال کردن احراز هویت دو مرحله‌ای ناموفق بود',
    twoFactorDisabled: 'احراز هویت دو مرحله‌ای غیرفعال شد.',
    authenticatorAppsList: 'Google Authenticator، Authy یا Microsoft Authenticator',
    totpSecurityNote:
      'برای امنیت، کد ۶ رقمی شما به عنوان یک امضای ریاضی فعال عمل می‌کند که هر ۳۰ ثانیه تازه‌سازی می‌شود. پس از استفاده، برای جلوگیری از حملات بازپخش به طور دائمی باطل می‌شود.',
    typeCodeManually: 'این کد را در برنامه خود وارد کنید تا به صورت دستی پیوند دهید.',
    passkeysNotSupported: 'کلیدهای عبور در این دستگاه پشتیبانی نمی‌شوند.',
    invalidCode: 'کد نامعتبر',
    failedToDisableSms2FA: 'غیرفعال کردن احراز هویت پیامکی ناموفق بود',
    sectionError: 'خطای بخش',
    errorInSection: 'خطا در {{section}}',
    sectionErrorMessage:
      'هنگام بارگذاری این بخش مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا تنظیمات دیگر را بررسی کنید.',
    unitNotFoundHint: 'واحد درسی خود را پیدا نمی‌کنید؟ کد و نام را به صورت دستی در زیر وارد کنید.',
    clickToChangeLocation: '(برای تغییر مکان کلیک کنید)',
  },
  fi: {
    failedToStartSetup: 'Asetusten aloitus epäonnistui. Yritä uudelleen.',
    verificationFailedCheckCode: 'Vahvistus epäonnistui. Tarkista koodisi.',
    invalidCodeTryAgain: 'Virheellinen koodi. Yritä uudelleen.',
    twoFactorEnabled: 'Kaksivaiheinen todentaminen aktivoitu!',
    networkErrorCheckConnection: 'Verkkovirhe. Tarkista yhteytesi ja yritä uudelleen.',
    failedToDisable2FA: 'Kaksivaiheisen todentamisen poistaminen epäonnistui',
    twoFactorDisabled: 'Kaksivaiheinen todentaminen poistettu käytöstä.',
    authenticatorAppsList: 'Google Authenticator, Authy tai Microsoft Authenticator',
    totpSecurityNote:
      'Turvallisuussyistä 6-numeroinen koodisi toimii aktiivisena matemaattisena allekirjoituksena, joka päivittyy 30 sekunnin välein. Käytön jälkeen se mitätöidään pysyvästi uudelleentoistoiskujen estämiseksi.',
    typeCodeManually: 'Kirjoita tämä koodi sovellukseesi yhdistääksesi sen manuaalisesti.',
    passkeysNotSupported: 'Salasana-avaimia ei tueta tässä laitteessa.',
    invalidCode: 'Virheellinen koodi',
    failedToDisableSms2FA: 'SMS-kaksivaiheisen todentamisen poistaminen epäonnistui',
    sectionError: 'Osiovirhe',
    errorInSection: 'Virhe kohdassa {{section}}',
    sectionErrorMessage:
      'Jotain meni pieleen ladattaessa tätä osiota. Voit yrittää uudelleen tai tarkistaa muut asetukset.',
    unitNotFoundHint: 'Etkö löydä kurssiasi? Syötä koodi ja nimi manuaalisesti alla.',
    clickToChangeLocation: '(klikkaa vaihtaaksesi sijaintia)',
  },
  he: {
    failedToStartSetup: 'ההגדרה נכשלה. אנא נסה שוב.',
    verificationFailedCheckCode: 'האימות נכשל. אנא בדוק את הקוד שלך.',
    invalidCodeTryAgain: 'קוד לא תקין. אנא נסה שוב.',
    twoFactorEnabled: 'אימות דו-שלבי הופעל!',
    networkErrorCheckConnection: 'שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.',
    failedToDisable2FA: 'השבתת אימות דו-שלבי נכשלה',
    twoFactorDisabled: 'אימות דו-שלבי הושבת.',
    authenticatorAppsList: 'Google Authenticator, Authy או Microsoft Authenticator',
    totpSecurityNote:
      'לצורכי אבטחה, הקוד בן 6 הספרות שלך פועל כחתימה מתמטית פעילה המתחדשת כל 30 שניות. לאחר השימוש, הוא מבוטל לצמיתות למניעת התקפות שידור חוזר.',
    typeCodeManually: 'הקלד קוד זה באפליקציה שלך לקישור ידני.',
    passkeysNotSupported: 'מפתחות גישה אינם נתמכים במכשיר זה.',
    invalidCode: 'קוד לא תקין',
    failedToDisableSms2FA: 'השבתת אימות SMS נכשלה',
    sectionError: 'שגיאת מדור',
    errorInSection: 'שגיאה ב-{{section}}',
    sectionErrorMessage: 'משהו השתבש בטעינת מדור זה. ניתן לנסות שוב או לבדוק הגדרות אחרות.',
    unitNotFoundHint: 'לא מוצא את הקורס? הזן את הקוד והשם ידנית למטה.',
    clickToChangeLocation: '(לחץ לשינוי מיקום)',
  },
  hu: {
    failedToStartSetup: 'A beállítás indítása sikertelen. Kérjük, próbálja újra.',
    verificationFailedCheckCode: 'Az ellenőrzés sikertelen. Kérjük, ellenőrizze a kódját.',
    invalidCodeTryAgain: 'Érvénytelen kód. Kérjük, próbálja újra.',
    twoFactorEnabled: 'Kétfaktoros hitelesítés bekapcsolva!',
    networkErrorCheckConnection: 'Hálózati hiba. Ellenőrizze a kapcsolatot és próbálja újra.',
    failedToDisable2FA: 'A kétfaktoros hitelesítés kikapcsolása sikertelen',
    twoFactorDisabled: 'Kétfaktoros hitelesítés kikapcsolva.',
    authenticatorAppsList: 'Google Authenticator, Authy vagy Microsoft Authenticator',
    totpSecurityNote:
      'Biztonsági okokból a 6 jegyű kódja aktív matematikai aláírásként működik, amely 30 másodpercenként frissül. Használat után véglegesen érvénytelenné válik a visszajátszásos támadások megelőzése érdekében.',
    typeCodeManually: 'Írja be ezt a kódot az alkalmazásába a manuális összekapcsoláshoz.',
    passkeysNotSupported: 'A hozzáférési kulcsok nem támogatottak ezen az eszközön.',
    invalidCode: 'Érvénytelen kód',
    failedToDisableSms2FA: 'Az SMS kétfaktoros hitelesítés kikapcsolása sikertelen',
    sectionError: 'Szekció hiba',
    errorInSection: 'Hiba a {{section}} részben',
    sectionErrorMessage:
      'Valami hiba történt a szekció betöltése során. Próbálja újra, vagy ellenőrizze a többi beállítást.',
    unitNotFoundHint: 'Nem találja a tantárgyát? Adja meg a kódot és a nevet kézzel alább.',
    clickToChangeLocation: '(kattintson a hely módosításához)',
  },
  id: {
    failedToStartSetup: 'Gagal memulai pengaturan. Silakan coba lagi.',
    verificationFailedCheckCode: 'Verifikasi gagal. Periksa kode Anda.',
    invalidCodeTryAgain: 'Kode tidak valid. Silakan coba lagi.',
    twoFactorEnabled: 'Otentikasi dua faktor diaktifkan!',
    networkErrorCheckConnection: 'Kesalahan jaringan. Periksa koneksi Anda dan coba lagi.',
    failedToDisable2FA: 'Gagal menonaktifkan otentikasi dua faktor',
    twoFactorDisabled: 'Otentikasi dua faktor dinonaktifkan.',
    authenticatorAppsList: 'Google Authenticator, Authy, atau Microsoft Authenticator',
    totpSecurityNote:
      'Untuk keamanan, kode 6 digit Anda berfungsi sebagai tanda tangan matematis aktif yang diperbarui setiap 30 detik. Setelah digunakan, kode menjadi tidak valid secara permanen untuk mencegah serangan pemutaran ulang.',
    typeCodeManually: 'Ketik kode ini di aplikasi Anda untuk menghubungkannya secara manual.',
    passkeysNotSupported: 'Kunci sandi tidak didukung di perangkat ini.',
    invalidCode: 'Kode tidak valid',
    failedToDisableSms2FA: 'Gagal menonaktifkan otentikasi SMS',
    sectionError: 'Kesalahan Bagian',
    errorInSection: 'Kesalahan di {{section}}',
    sectionErrorMessage:
      'Terjadi kesalahan saat memuat bagian ini. Anda dapat mencoba lagi atau memeriksa pengaturan lainnya.',
    unitNotFoundHint:
      'Tidak menemukan mata kuliah Anda? Masukkan kode dan nama secara manual di bawah.',
    clickToChangeLocation: '(klik untuk mengubah lokasi)',
  },
  ms: {
    failedToStartSetup: 'Gagal memulakan tetapan. Sila cuba lagi.',
    verificationFailedCheckCode: 'Pengesahan gagal. Sila semak kod anda.',
    invalidCodeTryAgain: 'Kod tidak sah. Sila cuba lagi.',
    twoFactorEnabled: 'Pengesahan dua faktor diaktifkan!',
    networkErrorCheckConnection: 'Ralat rangkaian. Sila semak sambungan anda dan cuba lagi.',
    failedToDisable2FA: 'Gagal menyahaktifkan pengesahan dua faktor',
    twoFactorDisabled: 'Pengesahan dua faktor dinyahaktifkan.',
    authenticatorAppsList: 'Google Authenticator, Authy, atau Microsoft Authenticator',
    totpSecurityNote:
      'Untuk keselamatan, kod 6 digit anda berfungsi sebagai tandatangan matematik aktif yang dikemas kini setiap 30 saat. Setelah digunakan, ia tidak sah secara kekal untuk mencegah serangan ulang tayang.',
    typeCodeManually: 'Taipkan kod ini dalam aplikasi anda untuk memautkannya secara manual.',
    passkeysNotSupported: 'Kunci laluan tidak disokong pada peranti ini.',
    invalidCode: 'Kod tidak sah',
    failedToDisableSms2FA: 'Gagal menyahaktifkan pengesahan SMS',
    sectionError: 'Ralat Bahagian',
    errorInSection: 'Ralat dalam {{section}}',
    sectionErrorMessage:
      'Sesuatu telah berlaku semasa memuatkan bahagian ini. Anda boleh cuba lagi atau semak tetapan lain.',
    unitNotFoundHint: 'Tidak menemui kursus anda? Masukkan kod dan nama secara manual di bawah.',
    clickToChangeLocation: '(klik untuk menukar lokasi)',
  },
  ne: {
    failedToStartSetup: 'सेटअप सुरु गर्न असफल। कृपया पुनः प्रयास गर्नुहोस्।',
    verificationFailedCheckCode: 'प्रमाणीकरण असफल। कृपया आफ्नो कोड जाँच गर्नुहोस्।',
    invalidCodeTryAgain: 'अमान्य कोड। कृपया पुनः प्रयास गर्नुहोस्।',
    twoFactorEnabled: 'दुई-चरण प्रमाणीकरण सक्रिय!',
    networkErrorCheckConnection:
      'नेटवर्क त्रुटि। कृपया आफ्नो जडान जाँच गरेर पुनः प्रयास गर्नुहोस्।',
    failedToDisable2FA: 'दुई-चरण प्रमाणीकरण निष्क्रिय गर्न असफल',
    twoFactorDisabled: 'दुई-चरण प्रमाणीकरण निष्क्रिय।',
    authenticatorAppsList: 'Google Authenticator, Authy, वा Microsoft Authenticator',
    totpSecurityNote:
      'सुरक्षाको लागि, तपाईंको ६-अंकको कोड हरेक ३० सेकेन्डमा रिफ्रेश हुने सक्रिय गणितीय हस्ताक्षरको रूपमा काम गर्दछ। एकचोटि प्रयोग गरिसकेपछि, यो रिप्ले आक्रमणहरू रोक्नको लागि स्थायी रूपमा अमान्य हुन्छ।',
    typeCodeManually: 'म्यानुअल रूपमा लिंक गर्न यो कोड आफ्नो एपमा टाइप गर्नुहोस्।',
    passkeysNotSupported: 'यस यन्त्रमा पासकीहरू समर्थित छैनन्।',
    invalidCode: 'अमान्य कोड',
    failedToDisableSms2FA: 'SMS दुई-चरण प्रमाणीकरण निष्क्रिय गर्न असफल',
    sectionError: 'खण्ड त्रुटि',
    errorInSection: '{{section}} मा त्रुटि',
    sectionErrorMessage:
      'यो खण्ड लोड गर्दा केही गलत भयो। तपाईं पुनः प्रयास गर्न सक्नुहुन्छ वा अन्य सेटिङहरू जाँच गर्न सक्नुहुन्छ।',
    unitNotFoundHint: 'तपाईंको इकाई भेटिएन? तल कोड र नाम म्यानुअल रूपमा प्रविष्ट गर्नुहोस्।',
    clickToChangeLocation: '(स्थान परिवर्तन गर्न क्लिक गर्नुहोस्)',
  },
  nl: {
    failedToStartSetup: 'Instelling starten mislukt. Probeer het opnieuw.',
    verificationFailedCheckCode: 'Verificatie mislukt. Controleer uw code.',
    invalidCodeTryAgain: 'Ongeldige code. Probeer het opnieuw.',
    twoFactorEnabled: 'Tweefactorauthenticatie geactiveerd!',
    networkErrorCheckConnection: 'Netwerkfout. Controleer uw verbinding en probeer het opnieuw.',
    failedToDisable2FA: 'Tweefactorauthenticatie uitschakelen mislukt',
    twoFactorDisabled: 'Tweefactorauthenticatie uitgeschakeld.',
    authenticatorAppsList: 'Google Authenticator, Authy of Microsoft Authenticator',
    totpSecurityNote:
      'Voor de veiligheid werkt uw 6-cijferige code als een actieve wiskundige handtekening die elke 30 seconden wordt vernieuwd. Na gebruik wordt deze permanent ongeldig gemaakt om replay-aanvallen te voorkomen.',
    typeCodeManually: 'Voer deze code in uw app in om handmatig te koppelen.',
    passkeysNotSupported: 'Toegangssleutels worden niet ondersteund op dit apparaat.',
    invalidCode: 'Ongeldige code',
    failedToDisableSms2FA: 'SMS-tweefactorauthenticatie uitschakelen mislukt',
    sectionError: 'Sectiefout',
    errorInSection: 'Fout in {{section}}',
    sectionErrorMessage:
      'Er ging iets mis bij het laden van deze sectie. U kunt het opnieuw proberen of andere instellingen controleren.',
    unitNotFoundHint: 'Kunt u uw vak niet vinden? Voer de code en naam hieronder handmatig in.',
    clickToChangeLocation: '(klik om locatie te wijzigen)',
  },
  no: {
    failedToStartSetup: 'Kunne ikke starte oppsettet. Vennligst prøv igjen.',
    verificationFailedCheckCode: 'Verifisering mislyktes. Vennligst sjekk koden din.',
    invalidCodeTryAgain: 'Ugyldig kode. Vennligst prøv igjen.',
    twoFactorEnabled: 'Tofaktor-autentisering aktivert!',
    networkErrorCheckConnection: 'Nettverksfeil. Sjekk tilkoblingen din og prøv igjen.',
    failedToDisable2FA: 'Kunne ikke deaktivere tofaktor-autentisering',
    twoFactorDisabled: 'Tofaktor-autentisering deaktivert.',
    authenticatorAppsList: 'Google Authenticator, Authy eller Microsoft Authenticator',
    totpSecurityNote:
      'For sikkerheten fungerer din 6-sifrede kode som en aktiv matematisk signatur som fornyes hvert 30. sekund. Etter bruk blir den permanent ugyldig for å forhindre avspillingsangrep.',
    typeCodeManually: 'Skriv inn denne koden i appen din for å koble til manuelt.',
    passkeysNotSupported: 'Tilgangsnøkler støttes ikke på denne enheten.',
    invalidCode: 'Ugyldig kode',
    failedToDisableSms2FA: 'Kunne ikke deaktivere SMS tofaktor-autentisering',
    sectionError: 'Seksjonsfeil',
    errorInSection: 'Feil i {{section}}',
    sectionErrorMessage:
      'Noe gikk galt under lasting av denne seksjonen. Du kan prøve igjen eller sjekke andre innstillinger.',
    unitNotFoundHint: 'Finner du ikke faget ditt? Skriv inn koden og navnet manuelt nedenfor.',
    clickToChangeLocation: '(klikk for å endre plassering)',
  },
  pl: {
    failedToStartSetup: 'Nie udało się rozpocząć konfiguracji. Spróbuj ponownie.',
    verificationFailedCheckCode: 'Weryfikacja nie powiodła się. Sprawdź swój kod.',
    invalidCodeTryAgain: 'Nieprawidłowy kod. Spróbuj ponownie.',
    twoFactorEnabled: 'Uwierzytelnianie dwuskładnikowe włączone!',
    networkErrorCheckConnection: 'Błąd sieci. Sprawdź połączenie i spróbuj ponownie.',
    failedToDisable2FA: 'Nie udało się wyłączyć uwierzytelniania dwuskładnikowego',
    twoFactorDisabled: 'Uwierzytelnianie dwuskładnikowe wyłączone.',
    authenticatorAppsList: 'Google Authenticator, Authy lub Microsoft Authenticator',
    totpSecurityNote:
      'Ze względów bezpieczeństwa Twój 6-cyfrowy kod działa jako aktywny podpis matematyczny odnawiający się co 30 sekund. Po użyciu zostaje trwale unieważniony, aby zapobiec atakom powtórzeniowym.',
    typeCodeManually: 'Wpisz ten kod w aplikacji, aby połączyć ręcznie.',
    passkeysNotSupported: 'Klucze dostępu nie są obsługiwane na tym urządzeniu.',
    invalidCode: 'Nieprawidłowy kod',
    failedToDisableSms2FA: 'Nie udało się wyłączyć uwierzytelniania SMS',
    sectionError: 'Błąd sekcji',
    errorInSection: 'Błąd w {{section}}',
    sectionErrorMessage:
      'Coś poszło nie tak podczas ładowania tej sekcji. Możesz spróbować ponownie lub sprawdzić inne ustawienia.',
    unitNotFoundHint: 'Nie możesz znaleźć swojego przedmiotu? Wpisz kod i nazwę ręcznie poniżej.',
    clickToChangeLocation: '(kliknij, aby zmienić lokalizację)',
  },
  ro: {
    failedToStartSetup: 'Configurarea nu a putut fi pornită. Vă rugăm să încercați din nou.',
    verificationFailedCheckCode: 'Verificarea a eșuat. Verificați codul dvs.',
    invalidCodeTryAgain: 'Cod invalid. Vă rugăm să încercați din nou.',
    twoFactorEnabled: 'Autentificarea cu doi factori activată!',
    networkErrorCheckConnection: 'Eroare de rețea. Verificați conexiunea și încercați din nou.',
    failedToDisable2FA: 'Dezactivarea autentificării cu doi factori a eșuat',
    twoFactorDisabled: 'Autentificarea cu doi factori dezactivată.',
    authenticatorAppsList: 'Google Authenticator, Authy sau Microsoft Authenticator',
    totpSecurityNote:
      'Pentru securitate, codul dvs. de 6 cifre funcționează ca o semnătură matematică activă care se reîmprospătează la fiecare 30 de secunde. Odată utilizat, devine permanent invalid pentru a preveni atacurile de repetare.',
    typeCodeManually: 'Introduceți acest cod în aplicația dvs. pentru a-l conecta manual.',
    passkeysNotSupported: 'Cheile de acces nu sunt suportate pe acest dispozitiv.',
    invalidCode: 'Cod invalid',
    failedToDisableSms2FA: 'Dezactivarea autentificării SMS a eșuat',
    sectionError: 'Eroare secțiune',
    errorInSection: 'Eroare în {{section}}',
    sectionErrorMessage:
      'Ceva nu a mers bine la încărcarea acestei secțiuni. Puteți încerca din nou sau verifica alte setări.',
    unitNotFoundHint: 'Nu găsiți materia? Introduceți codul și numele manual mai jos.',
    clickToChangeLocation: '(faceți clic pentru a schimba locația)',
  },
  si: {
    failedToStartSetup: 'සැකසීම ආරම්භ කිරීමට අසමත් විය. කරුණාකර නැවත උත්සාහ කරන්න.',
    verificationFailedCheckCode: 'සත්‍යාපනය අසාර්ථකයි. කරුණාකර ඔබේ කේතය පරීක්ෂා කරන්න.',
    invalidCodeTryAgain: 'වලංගු නොවන කේතය. කරුණාකර නැවත උත්සාහ කරන්න.',
    twoFactorEnabled: 'ද්වි-සාධක සත්‍යාපනය සක්‍රිය කරන ලදී!',
    networkErrorCheckConnection: 'ජාල දෝෂයකි. කරුණාකර ඔබේ සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.',
    failedToDisable2FA: 'ද්වි-සාධක සත්‍යාපනය අක්‍රිය කිරීමට අසමත් විය',
    twoFactorDisabled: 'ද්වි-සාධක සත්‍යාපනය අක්‍රියයි.',
    authenticatorAppsList: 'Google Authenticator, Authy, හෝ Microsoft Authenticator',
    totpSecurityNote:
      'ආරක්ෂාව සඳහා, ඔබේ ඉලක්කම් 6ක කේතය තත්පර 30කට වරක් නැවුම් වන ක්‍රියාකාරී ගණිතමය අත්සනක් ලෙස ක්‍රියා කරයි. එක් වරක් භාවිතා කළ පසු, එය ප්‍රතිප්‍රහාර වැළැක්වීම සඳහා ස්ථිරවම අවලංගු වේ.',
    typeCodeManually: 'අතින් සම්බන්ධ කිරීමට මෙම කේතය ඔබේ යෙදුමේ ටයිප් කරන්න.',
    passkeysNotSupported: 'මෙම උපකරණයෙහි පාස්කීස් සහාය නොදක්වයි.',
    invalidCode: 'වලංගු නොවන කේතය',
    failedToDisableSms2FA: 'SMS ද්වි-සාධක සත්‍යාපනය අක්‍රිය කිරීමට අසමත් විය',
    sectionError: 'කොටස් දෝෂය',
    errorInSection: '{{section}} හි දෝෂය',
    sectionErrorMessage:
      'මෙම කොටස පූරණය කිරීමේදී යමක් වැරදී ඇත. ඔබට නැවත උත්සාහ කිරීමට හෝ වෙනත් සැකසීම් පරීක්ෂා කිරීමට හැකිය.',
    unitNotFoundHint: 'ඔබේ ඒකකය සොයාගත නොහැකිද? පහතින් කේතය සහ නම අතින් ඇතුළත් කරන්න.',
    clickToChangeLocation: '(ස්ථානය වෙනස් කිරීමට ක්ලික් කරන්න)',
  },
  sv: {
    failedToStartSetup: 'Det gick inte att starta inställningen. Försök igen.',
    verificationFailedCheckCode: 'Verifieringen misslyckades. Kontrollera din kod.',
    invalidCodeTryAgain: 'Ogiltig kod. Försök igen.',
    twoFactorEnabled: 'Tvåfaktorsautentisering aktiverad!',
    networkErrorCheckConnection: 'Nätverksfel. Kontrollera din anslutning och försök igen.',
    failedToDisable2FA: 'Det gick inte att inaktivera tvåfaktorsautentisering',
    twoFactorDisabled: 'Tvåfaktorsautentisering inaktiverad.',
    authenticatorAppsList: 'Google Authenticator, Authy eller Microsoft Authenticator',
    totpSecurityNote:
      'Av säkerhetsskäl fungerar din 6-siffriga kod som en aktiv matematisk signatur som uppdateras var 30:e sekund. Efter användning blir den permanent ogiltig för att förhindra uppspelningsattacker.',
    typeCodeManually: 'Skriv in den här koden i din app för att länka manuellt.',
    passkeysNotSupported: 'Åtkomstnycklar stöds inte på den här enheten.',
    invalidCode: 'Ogiltig kod',
    failedToDisableSms2FA: 'Det gick inte att inaktivera SMS-tvåfaktorsautentisering',
    sectionError: 'Sektionsfel',
    errorInSection: 'Fel i {{section}}',
    sectionErrorMessage:
      'Något gick fel vid laddning av det här avsnittet. Du kan försöka igen eller kontrollera andra inställningar.',
    unitNotFoundHint: 'Hittar du inte ditt ämne? Ange koden och namnet manuellt nedan.',
    clickToChangeLocation: '(klicka för att ändra plats)',
  },
  ta: {
    failedToStartSetup: 'அமைப்பைத் தொடங்குவது தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    verificationFailedCheckCode: 'சரிபார்ப்பு தோல்வியடைந்தது. உங்கள் குறியீட்டைச் சரிபார்க்கவும்.',
    invalidCodeTryAgain: 'தவறான குறியீடு. மீண்டும் முயற்சிக்கவும்.',
    twoFactorEnabled: 'இரு-காரணி அங்கீகாரம் இயக்கப்பட்டது!',
    networkErrorCheckConnection:
      'நெட்வொர்க் பிழை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    failedToDisable2FA: 'இரு-காரணி அங்கீகாரத்தை முடக்குவது தோல்வியடைந்தது',
    twoFactorDisabled: 'இரு-காரணி அங்கீகாரம் முடக்கப்பட்டது.',
    authenticatorAppsList: 'Google Authenticator, Authy, அல்லது Microsoft Authenticator',
    totpSecurityNote:
      'பாதுகாப்பிற்காக, உங்கள் 6-இலக்கக் குறியீடு ஒவ்வொரு 30 வினாடிகளுக்கும் புதுப்பிக்கப்படும் செயலில் கணித கையொப்பமாக செயல்படுகிறது. ஒருமுறை பயன்படுத்தப்பட்ட பின், மீண்டும் இயக்கும் தாக்குதல்களைத் தடுக்க நிரந்தரமாக செல்லாததாகிறது.',
    typeCodeManually: 'கைமுறையாக இணைக்க இந்தக் குறியீட்டை உங்கள் பயன்பாட்டில் தட்டச்சு செய்யவும்.',
    passkeysNotSupported: 'இந்தச் சாதனத்தில் கடவுச்சாவிகள் ஆதரிக்கப்படவில்லை.',
    invalidCode: 'தவறான குறியீடு',
    failedToDisableSms2FA: 'SMS இரு-காரணி அங்கீகாரத்தை முடக்குவது தோல்வியடைந்தது',
    sectionError: 'பிரிவு பிழை',
    errorInSection: '{{section}} இல் பிழை',
    sectionErrorMessage:
      'இந்தப் பிரிவை ஏற்றும்போது ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கலாம் அல்லது பிற அமைப்புகளைச் சரிபார்க்கலாம்.',
    unitNotFoundHint:
      'உங்கள் பாடத்தைக் காணவில்லையா? கீழே குறியீடு மற்றும் பெயரை கைமுறையாக உள்ளிடவும்.',
    clickToChangeLocation: '(இருப்பிடத்தை மாற்ற கிளிக் செய்யவும்)',
  },
  th: {
    failedToStartSetup: 'เริ่มต้นการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    verificationFailedCheckCode: 'การยืนยันล้มเหลว กรุณาตรวจสอบรหัสของคุณ',
    invalidCodeTryAgain: 'รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
    twoFactorEnabled: 'เปิดใช้งานการยืนยันตัวตนสองขั้นตอนแล้ว!',
    networkErrorCheckConnection: 'ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่',
    failedToDisable2FA: 'ปิดใช้งานการยืนยันตัวตนสองขั้นตอนไม่สำเร็จ',
    twoFactorDisabled: 'ปิดใช้งานการยืนยันตัวตนสองขั้นตอนแล้ว',
    authenticatorAppsList: 'Google Authenticator, Authy หรือ Microsoft Authenticator',
    totpSecurityNote:
      'เพื่อความปลอดภัย รหัส 6 หลักของคุณทำหน้าที่เป็นลายเซ็นทางคณิตศาสตร์ที่รีเฟรชทุก 30 วินาที เมื่อใช้แล้วจะถูกยกเลิกถาวรเพื่อป้องกันการโจมตีแบบรีเพลย์',
    typeCodeManually: 'พิมพ์รหัสนี้ในแอปของคุณเพื่อเชื่อมต่อด้วยตนเอง',
    passkeysNotSupported: 'อุปกรณ์นี้ไม่รองรับพาสคีย์',
    invalidCode: 'รหัสไม่ถูกต้อง',
    failedToDisableSms2FA: 'ปิดใช้งานการยืนยันตัวตน SMS ไม่สำเร็จ',
    sectionError: 'ข้อผิดพลาดส่วน',
    errorInSection: 'ข้อผิดพลาดใน {{section}}',
    sectionErrorMessage:
      'เกิดข้อผิดพลาดขณะโหลดส่วนนี้ คุณสามารถลองใหม่หรือตรวจสอบการตั้งค่าอื่นได้',
    unitNotFoundHint: 'หาวิชาไม่เจอ? กรอกรหัสและชื่อด้วยตนเองด้านล่าง',
    clickToChangeLocation: '(คลิกเพื่อเปลี่ยนตำแหน่ง)',
  },
  uk: {
    failedToStartSetup: 'Не вдалося розпочати налаштування. Спробуйте ще раз.',
    verificationFailedCheckCode: 'Перевірка не пройдена. Перевірте свій код.',
    invalidCodeTryAgain: 'Недійсний код. Спробуйте ще раз.',
    twoFactorEnabled: 'Двофакторна автентифікація увімкнена!',
    networkErrorCheckConnection: "Помилка мережі. Перевірте з'єднання та спробуйте ще раз.",
    failedToDisable2FA: 'Не вдалося вимкнути двофакторну автентифікацію',
    twoFactorDisabled: 'Двофакторну автентифікацію вимкнено.',
    authenticatorAppsList: 'Google Authenticator, Authy або Microsoft Authenticator',
    totpSecurityNote:
      'З міркувань безпеки ваш 6-значний код діє як активний математичний підпис, що оновлюється кожні 30 секунд. Після використання він стає назавжди недійсним для запобігання атакам повторного відтворення.',
    typeCodeManually: "Введіть цей код у додатку для ручного зв'язування.",
    passkeysNotSupported: 'Ключі доступу не підтримуються на цьому пристрої.',
    invalidCode: 'Недійсний код',
    failedToDisableSms2FA: 'Не вдалося вимкнути SMS автентифікацію',
    sectionError: 'Помилка розділу',
    errorInSection: 'Помилка у {{section}}',
    sectionErrorMessage:
      'Щось пішло не так при завантаженні цього розділу. Ви можете спробувати ще раз або перевірити інші налаштування.',
    unitNotFoundHint: 'Не можете знайти свою дисципліну? Введіть код і назву вручну нижче.',
    clickToChangeLocation: '(натисніть для зміни місцезнаходження)',
  },
  ur: {
    failedToStartSetup: 'سیٹ اپ شروع کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔',
    verificationFailedCheckCode: 'تصدیق ناکام۔ براہ کرم اپنا کوڈ چیک کریں۔',
    invalidCodeTryAgain: 'غلط کوڈ۔ براہ کرم دوبارہ کوشش کریں۔',
    twoFactorEnabled: 'دو عنصری توثیق فعال!',
    networkErrorCheckConnection:
      'نیٹ ورک خرابی۔ براہ کرم اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    failedToDisable2FA: 'دو عنصری توثیق غیر فعال کرنے میں ناکامی',
    twoFactorDisabled: 'دو عنصری توثیق غیر فعال۔',
    authenticatorAppsList: 'Google Authenticator، Authy، یا Microsoft Authenticator',
    totpSecurityNote:
      'سیکیورٹی کے لیے، آپ کا 6 ہندسوں کا کوڈ ایک فعال ریاضیاتی دستخط کے طور پر کام کرتا ہے جو ہر 30 سیکنڈ میں ریفریش ہوتا ہے۔ ایک بار استعمال ہونے کے بعد، ری پلے حملوں کو روکنے کے لیے یہ مستقل طور پر ناکارہ ہو جاتا ہے۔',
    typeCodeManually: 'دستی طور پر لنک کرنے کے لیے یہ کوڈ اپنی ایپ میں ٹائپ کریں۔',
    passkeysNotSupported: 'اس ڈیوائس پر پاس کیز تعاون یافتہ نہیں ہیں۔',
    invalidCode: 'غلط کوڈ',
    failedToDisableSms2FA: 'SMS دو عنصری توثیق غیر فعال کرنے میں ناکامی',
    sectionError: 'سیکشن خرابی',
    errorInSection: '{{section}} میں خرابی',
    sectionErrorMessage:
      'اس سیکشن کو لوڈ کرتے وقت کچھ غلط ہو گیا۔ آپ دوبارہ کوشش کر سکتے ہیں یا دیگر ترتیبات چیک کر سکتے ہیں۔',
    unitNotFoundHint: 'اپنا مضمون نہیں مل رہا؟ نیچے کوڈ اور نام دستی طور پر درج کریں۔',
    clickToChangeLocation: '(مقام تبدیل کرنے کے لیے کلک کریں)',
  },
  vi: {
    failedToStartSetup: 'Không thể bắt đầu thiết lập. Vui lòng thử lại.',
    verificationFailedCheckCode: 'Xác minh thất bại. Vui lòng kiểm tra mã của bạn.',
    invalidCodeTryAgain: 'Mã không hợp lệ. Vui lòng thử lại.',
    twoFactorEnabled: 'Đã bật xác thực hai yếu tố!',
    networkErrorCheckConnection: 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.',
    failedToDisable2FA: 'Không thể tắt xác thực hai yếu tố',
    twoFactorDisabled: 'Đã tắt xác thực hai yếu tố.',
    authenticatorAppsList: 'Google Authenticator, Authy hoặc Microsoft Authenticator',
    totpSecurityNote:
      'Vì lý do bảo mật, mã 6 chữ số của bạn hoạt động như một chữ ký toán học tích cực được làm mới mỗi 30 giây. Sau khi sử dụng, nó sẽ bị vô hiệu hóa vĩnh viễn để ngăn chặn các cuộc tấn công phát lại.',
    typeCodeManually: 'Nhập mã này vào ứng dụng của bạn để liên kết thủ công.',
    passkeysNotSupported: 'Thiết bị này không hỗ trợ khóa mật khẩu.',
    invalidCode: 'Mã không hợp lệ',
    failedToDisableSms2FA: 'Không thể tắt xác thực SMS',
    sectionError: 'Lỗi phần',
    errorInSection: 'Lỗi trong {{section}}',
    sectionErrorMessage:
      'Đã xảy ra lỗi khi tải phần này. Bạn có thể thử lại hoặc kiểm tra các cài đặt khác.',
    unitNotFoundHint: 'Không tìm thấy môn học? Nhập mã và tên thủ công bên dưới.',
    clickToChangeLocation: '(nhấp để thay đổi vị trí)',
  },
};

// Apply translations
const locales = fs
  .readdirSync(LOCALES_DIR)
  .filter((d) => d !== 'en' && fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

let totalApplied = 0;

for (const locale of locales) {
  const dict = TRANSLATIONS[locale];
  if (!dict) continue;

  const locPath = path.join(LOCALES_DIR, locale, 'translations.json');
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  let applied = 0;

  for (const [key, value] of Object.entries(dict)) {
    if (loc[key] === en[key] || !loc[key]) {
      loc[key] = value;
      applied++;
    }
  }

  if (applied > 0) {
    fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8');
    console.log(`${locale}: ${applied} translations applied`);
    totalApplied += applied;
  }
}

console.log(`\nTotal: ${totalApplied} translations applied across remaining locales`);
