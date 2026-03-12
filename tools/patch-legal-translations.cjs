#!/usr/bin/env node

/**
 * Patch all missing Privacy + Terms translations into locale files.
 *
 * Tier 1 — full paragraph-level translations for major languages
 * Tier 2 — title-level + footer translations for remaining languages
 * Universal — privacyFooter and terms_sections for all locales
 *
 * Usage:  node tools/patch-legal-translations.cjs
 */

const fs = require('fs');
const path = require('path');
const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en', 'translations.json');
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));

// ── Universal small keys (footer / nav) ──────────────────────────
const UNIVERSAL = {
  fa: { privacyFooter: 'سیاست حفظ حریم خصوصی', terms_sections: 'بخش‌ها' },
  ar: { privacyFooter: 'سياسة الخصوصية', terms_sections: 'الأقسام' },
  es: { privacyFooter: 'Política de Privacidad', terms_sections: 'Secciones' },
  zh: { privacyFooter: '隐私政策', terms_sections: '章节' },
  fr: {
    privacyFooter: 'Politique de Confidentialité',
    terms_sections: 'Sections',
    privacy_s6_table_h1: 'Service',
  },
  de: { privacyFooter: 'Datenschutzerklärung', terms_sections: 'Abschnitte' },
  ja: { privacyFooter: 'プライバシーポリシー', terms_sections: 'セクション' },
  ko: { privacyFooter: '개인정보 보호정책', terms_sections: '섹션' },
  hi: { privacyFooter: 'गोपनीयता नीति', terms_sections: 'अनुभाग' },
  it: {
    privacyFooter: 'Informativa sulla Privacy',
    terms_sections: 'Sezioni',
    terms_s6_title: 'Privacy',
    privacy_s11_p2_link: 'Schema NDB (violazioni notificabili dei dati)',
    privacy_s12_p1_link: 'Schema NDB',
  },
  pt: { privacyFooter: 'Política de Privacidade', terms_sections: 'Seções' },
  ru: { privacyFooter: 'Политика конфиденциальности', terms_sections: 'Разделы' },
  tr: { privacyFooter: 'Gizlilik Politikası', terms_sections: 'Bölümler' },
  bn: { privacyFooter: 'গোপনীয়তা নীতি', terms_sections: 'বিভাগসমূহ' },
  ta: { privacyFooter: 'தனியுரிமை கொள்கை', terms_sections: 'பிரிவுகள்' },
  th: { privacyFooter: 'นโยบายความเป็นส่วนตัว', terms_sections: 'ส่วนต่างๆ' },
  vi: { privacyFooter: 'Chính sách Bảo mật', terms_sections: 'Mục lục' },
  ur: { privacyFooter: 'رازداری کی پالیسی', terms_sections: 'حصے' },
  id: { privacyFooter: 'Kebijakan Privasi', terms_sections: 'Bagian' },
  ms: { privacyFooter: 'Dasar Privasi', terms_sections: 'Bahagian' },
  he: { privacyFooter: 'מדיניות פרטיות', terms_sections: 'סעיפים' },
  da: { privacyFooter: 'Privatlivspolitik', terms_sections: 'Sektioner' },
  sv: { privacyFooter: 'Integritetspolicy', terms_sections: 'Sektioner' },
  no: { privacyFooter: 'Personvernerklæring', terms_sections: 'Seksjoner' },
  fi: { privacyFooter: 'Tietosuojakäytäntö', terms_sections: 'Osiot' },
  nl: { privacyFooter: 'Privacybeleid', terms_sections: 'Secties' },
  pl: { privacyFooter: 'Polityka Prywatności', terms_sections: 'Sekcje' },
  el: { privacyFooter: 'Πολιτική Απορρήτου', terms_sections: 'Ενότητες' },
  ro: { privacyFooter: 'Politica de Confidențialitate', terms_sections: 'Secțiuni' },
  cs: { privacyFooter: 'Zásady ochrany osobních údajů', terms_sections: 'Sekce' },
  hu: { privacyFooter: 'Adatvédelmi irányelvek', terms_sections: 'Szekciók' },
  uk: { privacyFooter: 'Політика конфіденційності', terms_sections: 'Розділи' },
  ne: { privacyFooter: 'गोपनीयता नीति', terms_sections: 'खण्डहरू' },
  si: { privacyFooter: 'පෞද්ගලිකත්ව ප්\u200Dරතිපත්තිය', terms_sections: 'කොටස්' },
};

// Common link text that can stay English or have minimal translation
const LINK_FIXES = {
  fa: { privacy_s12_p1_link: 'طرح نقض داده‌های اعلان‌پذیر (NDB)' },
  hi: { privacy_s12_p1_link: 'अधिसूचनीय डेटा उल्लंघन (NDB) योजना' },
  he: { privacy_s12_p1_link: 'תוכנית NDB (הפרות נתונים הטעונות דיווח)' },
  id: { privacy_s12_p1_link: 'Skema Pelanggaran Data yang Harus Dilaporkan (NDB)' },
  ms: { privacy_s12_p1_link: 'Skim Pelanggaran Data Boleh Dilaporkan (NDB)' },
  ur: { privacy_s12_p1_link: 'قابل اطلاع ڈیٹا کی خلاف ورزی (NDB) اسکیم' },
  vi: { privacy_s12_p1_link: 'Chương trình Vi phạm Dữ liệu Cần Thông báo (NDB)' },
  ta: { privacy_s12_p1_link: 'அறிவிக்கக்கூடிய தரவு மீறல்கள் (NDB) திட்டம்' },
  th: { privacy_s12_p1_link: 'โครงการแจ้งการละเมิดข้อมูล (NDB)' },
  bn: { privacy_s12_p1_link: 'বিজ্ঞপ্তিযোগ্য ডেটা লঙ্ঘন (NDB) স্কিম' },
  ru: { privacy_s12_p1_link: 'Схема уведомления о нарушениях данных (NDB)' },
};

// ── Terms paragraph translations (15 body keys) for Tier 2 locales ──
// These are the locales that already had title translations from earlier patch
// but paragraph/body text remained English.
const TERMS_PARAGRAPHS = {
  bn: {
    terms_s1_p1:
      '{{appName}} অ্যাক্সেস বা ব্যবহার করার মাধ্যমে, আপনি এই সেবার শর্তাবলী মেনে চলতে সম্মত হচ্ছেন। আপনি এই শর্তাবলীতে সম্মত না হলে, অনুগ্রহ করে অ্যাপ্লিকেশনটি ব্যবহার করবেন না।',
    terms_s2_p1:
      '{{appName}} হল একটি ছাত্র উৎপাদনশীলতা অ্যাপ্লিকেশন যা {{uniName}}-এর ছাত্রদের তাদের একাডেমিক সময়সূচী, সময়সীমা এবং ক্যাম্পাস কার্যক্রম পরিচালনা করতে সহায়তা করার জন্য ডিজাইন করা হয়েছে।',
    terms_s3_p1:
      'আপনি আপনার অ্যাকাউন্ট শংসাপত্রের গোপনীয়তা বজায় রাখা এবং আপনার অ্যাকাউন্টের অধীনে সংঘটিত সমস্ত কার্যকলাপের জন্য দায়ী।',
    terms_s4_p1: 'আপনি নিম্নলিখিত কাজ না করতে সম্মত হচ্ছেন:',
    terms_s4_li1: 'কোনো অবৈধ উদ্দেশ্যে সেবা ব্যবহার করা',
    terms_s4_li2: 'সেবার কোনো অংশে অননুমোদিত অ্যাক্সেস পাওয়ার চেষ্টা করা',
    terms_s4_li3: 'সেবা বা সার্ভারে হস্তক্ষেপ বা বিঘ্ন ঘটানো',
    terms_s4_li4: 'আপনার অ্যাকাউন্ট শংসাপত্র অন্যদের সাথে শেয়ার করা',
    terms_s4_li5: 'ক্ষতিকারক বিষয়বস্তু বা কোড আপলোড করা',
    terms_s5_p1:
      'সেবা এবং এর মূল বিষয়বস্তু {{appName}}-এর মালিকানাধীন এবং আন্তর্জাতিক মেধাস্বত্ব আইন দ্বারা সুরক্ষিত।',
    terms_s6_p1: '{{appName}}-এর আপনার ব্যবহার আমাদের গোপনীয়তা নীতি দ্বারা পরিচালিত হয়।',
    terms_s7_p1: "সেবাটি কোনো ধরনের ওয়ারেন্টি ছাড়াই 'যেমন আছে' প্রদান করা হয়।",
    terms_s8_p1:
      'কোনো অবস্থাতেই {{appNameCaps}} আপনার সেবা ব্যবহার থেকে উদ্ভূত কোনো পরোক্ষ ক্ষতির জন্য দায়ী থাকবে না।',
    terms_s9_p1: 'আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার সংরক্ষণ করি।',
    terms_s10_p1:
      'এই সেবার শর্তাবলী সম্পর্কে কোনো প্রশ্ন থাকলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন',
  },
  cs: {
    terms_s1_p1:
      'Přístupem k {{appName}} nebo jeho používáním souhlasíte s těmito Podmínkami služby.',
    terms_s2_p1:
      '{{appName}} je aplikace pro produktivitu studentů navržená pro pomoc studentům {{uniName}} se správou akademických rozvrhů, termínů a aktivit na kampusu.',
    terms_s3_p1:
      'Jste zodpovědní za zachování důvěrnosti přihlašovacích údajů a za všechny aktivity pod vaším účtem.',
    terms_s4_p1: 'Souhlasíte, že nebudete:',
    terms_s4_li1: 'Používat službu k nezákonným účelům',
    terms_s4_li2: 'Pokoušet se o neoprávněný přístup k jakékoli části služby',
    terms_s4_li3: 'Narušovat nebo přerušovat službu nebo servery',
    terms_s4_li4: 'Sdílet přihlašovací údaje s ostatními',
    terms_s4_li5: 'Nahrávat škodlivý obsah nebo kód',
    terms_s5_p1:
      'Služba a její obsah jsou vlastnictvím {{appName}} a jsou chráněny zákony o duševním vlastnictví.',
    terms_s6_p1: 'Používání {{appName}} se řídí také našimi Zásadami ochrany osobních údajů.',
    terms_s7_p1: 'Služba je poskytována "tak, jak je" bez jakýchkoli záruk.',
    terms_s8_p1:
      '{{appNameCaps}} v žádném případě nenese odpovědnost za nepřímé škody vyplývající z vašeho používání služby.',
    terms_s9_p1: 'Vyhrazujeme si právo tyto podmínky kdykoli změnit.',
    terms_s10_p1: 'Máte-li dotazy k těmto Podmínkám služby, kontaktujte nás na',
  },
  da: {
    terms_s1_p1:
      'Ved at tilgå eller bruge {{appName}} accepterer du at være bundet af disse Servicevilkår.',
    terms_s2_p1:
      '{{appName}} er en produktivitetsapp for studerende designet til at hjælpe studerende på {{uniName}} med at administrere deres akademiske skemaer, deadlines og campusaktiviteter.',
    terms_s3_p1:
      'Du er ansvarlig for at opretholde fortroligheden af dine kontologinoplysninger og for alle aktiviteter under din konto.',
    terms_s4_p1: 'Du accepterer ikke at:',
    terms_s4_li1: 'Bruge tjenesten til ulovlige formål',
    terms_s4_li2: 'Forsøge at opnå uautoriseret adgang til nogen del af tjenesten',
    terms_s4_li3: 'Forstyrre eller afbryde tjenesten eller serverne',
    terms_s4_li4: 'Dele dine kontologinoplysninger med andre',
    terms_s4_li5: 'Uploade skadeligt indhold eller kode',
    terms_s5_p1:
      'Tjenesten og dens originale indhold er ejet af {{appName}} og beskyttet af internationale love om intellektuel ejendomsret.',
    terms_s6_p1: 'Din brug af {{appName}} er også underlagt vores Privatlivspolitik.',
    terms_s7_p1: 'Tjenesten leveres "som den er" uden nogen form for garanti.',
    terms_s8_p1:
      'Under ingen omstændigheder er {{appNameCaps}} ansvarlig for indirekte skader som følge af din brug af tjenesten.',
    terms_s9_p1: 'Vi forbeholder os retten til at ændre disse vilkår til enhver tid.',
    terms_s10_p1: 'Har du spørgsmål om disse Servicevilkår, kontakt os venligst på',
  },
  el: {
    terms_s1_p1:
      'Αποκτώντας πρόσβαση ή χρησιμοποιώντας το {{appName}}, συμφωνείτε με αυτούς τους Όρους Χρήσης.',
    terms_s2_p1:
      'Το {{appName}} είναι μια εφαρμογή παραγωγικότητας για φοιτητές σχεδιασμένη για να βοηθά τους φοιτητές του {{uniName}} να διαχειρίζονται τα ακαδημαϊκά τους προγράμματα.',
    terms_s3_p1:
      'Είστε υπεύθυνοι για τη διατήρηση της εμπιστευτικότητας των διαπιστευτηρίων του λογαριασμού σας.',
    terms_s4_p1: 'Συμφωνείτε να μην:',
    terms_s4_li1: 'Χρησιμοποιείτε την υπηρεσία για παράνομους σκοπούς',
    terms_s4_li2: 'Επιχειρείτε μη εξουσιοδοτημένη πρόσβαση σε οποιοδήποτε μέρος της υπηρεσίας',
    terms_s4_li3: 'Παρεμβαίνετε ή διακόπτετε την υπηρεσία ή τους διακομιστές',
    terms_s4_li4: 'Μοιράζεστε τα διαπιστευτήρια λογαριασμού σας',
    terms_s4_li5: 'Ανεβάζετε κακόβουλο περιεχόμενο ή κώδικα',
    terms_s5_p1:
      'Η υπηρεσία ανήκει στο {{appName}} και προστατεύεται από διεθνείς νόμους πνευματικής ιδιοκτησίας.',
    terms_s6_p1: 'Η χρήση του {{appName}} διέπεται επίσης από την Πολιτική Απορρήτου μας.',
    terms_s7_p1: 'Η υπηρεσία παρέχεται "ως έχει" χωρίς καμία εγγύηση.',
    terms_s8_p1:
      'Σε καμία περίπτωση το {{appNameCaps}} δεν ευθύνεται για έμμεσες ζημίες από τη χρήση της υπηρεσίας.',
    terms_s9_p1: 'Διατηρούμε το δικαίωμα τροποποίησης αυτών των όρων ανά πάσα στιγμή.',
    terms_s10_p1: 'Εάν έχετε ερωτήσεις σχετικά με αυτούς τους Όρους, επικοινωνήστε μαζί μας στο',
  },
  fi: {
    terms_s1_p1: 'Käyttämällä {{appName}}-palvelua hyväksyt nämä käyttöehdot.',
    terms_s2_p1:
      '{{appName}} on opiskelijoiden tuottavuussovellus, joka on suunniteltu auttamaan {{uniName}}-yliopiston opiskelijoita hallitsemaan akateemisia aikataulujaan.',
    terms_s3_p1:
      'Olet vastuussa tilitietojesi luottamuksellisuuden ylläpitämisestä ja kaikista tilisi alla tapahtuvista toimista.',
    terms_s4_p1: 'Sitoudut olemaan:',
    terms_s4_li1: 'Käyttämättä palvelua laittomiin tarkoituksiin',
    terms_s4_li2: 'Yrittämättä saada luvatonta pääsyä palvelun osiin',
    terms_s4_li3: 'Häiritsemättä palvelua tai palvelimia',
    terms_s4_li4: 'Jakamasta tilitietojasi muille',
    terms_s4_li5: 'Lataamasta haitallista sisältöä tai koodia',
    terms_s5_p1:
      'Palvelu ja sen alkuperäinen sisältö ovat {{appName}}-palvelun omaisuutta ja suojattuja kansainvälisillä immateriaalioikeuslaeilla.',
    terms_s6_p1: '{{appName}}-palvelun käyttöön sovelletaan myös tietosuojakäytäntöämme.',
    terms_s7_p1: 'Palvelu tarjotaan "sellaisenaan" ilman minkäänlaista takuuta.',
    terms_s8_p1:
      '{{appNameCaps}} ei ole missään tapauksessa vastuussa välillisistä vahingoista, jotka johtuvat palvelun käytöstä.',
    terms_s9_p1: 'Pidätämme oikeuden muuttaa näitä ehtoja milloin tahansa.',
    terms_s10_p1:
      'Jos sinulla on kysyttävää näistä käyttöehdoista, ota meihin yhteyttä osoitteessa',
  },
  he: {
    terms_s1_p1: 'על ידי גישה או שימוש ב-{{appName}}, אתה מסכים לתנאי שימוש אלה.',
    terms_s2_p1:
      '{{appName}} הוא אפליקציית פרודוקטיביות לסטודנטים שנועדה לסייע לסטודנטים ב-{{uniName}} לנהל את לוחות הזמנים האקדמיים שלהם.',
    terms_s3_p1: 'אתה אחראי לשמירת סודיות פרטי החשבון שלך ולכל הפעילויות שמתבצעות תחת החשבון שלך.',
    terms_s4_p1: 'אתה מסכים שלא:',
    terms_s4_li1: 'להשתמש בשירות לכל מטרה בלתי חוקית',
    terms_s4_li2: 'לנסות לקבל גישה לא מורשית לכל חלק מהשירות',
    terms_s4_li3: 'להפריע או לשבש את השירות או השרתים',
    terms_s4_li4: 'לשתף את פרטי החשבון שלך עם אחרים',
    terms_s4_li5: 'להעלות תוכן או קוד זדוני',
    terms_s5_p1:
      'השירות והתוכן המקורי שלו שייכים ל-{{appName}} ומוגנים על ידי חוקי קניין רוחני בינלאומיים.',
    terms_s6_p1: 'השימוש שלך ב-{{appName}} כפוף גם למדיניות הפרטיות שלנו.',
    terms_s7_p1: 'השירות מסופק "כמות שהוא" ללא אחריות מכל סוג.',
    terms_s8_p1:
      'בשום מקרה {{appNameCaps}} לא יישא באחריות לנזקים עקיפים הנובעים מהשימוש שלך בשירות.',
    terms_s9_p1: 'אנו שומרים על הזכות לשנות תנאים אלה בכל עת.',
    terms_s10_p1: 'אם יש לך שאלות לגבי תנאי שימוש אלה, צור קשר איתנו בכתובת',
  },
  hu: {
    terms_s1_p1:
      'A {{appName}} elérésével vagy használatával elfogadja ezeket a Szolgáltatási Feltételeket.',
    terms_s2_p1:
      'A {{appName}} egy hallgatói produktivitási alkalmazás, amely a {{uniName}} hallgatóinak segít tanulmányi ütemtervük kezelésében.',
    terms_s3_p1:
      'Ön felelős fiókja hitelesítő adatainak bizalmas kezeléséért és a fiókja alatt végzett összes tevékenységért.',
    terms_s4_p1: 'Ön vállalja, hogy nem:',
    terms_s4_li1: 'Használja a szolgáltatást törvénytelen célokra',
    terms_s4_li2: 'Próbál jogosulatlan hozzáférést szerezni a szolgáltatás bármely részéhez',
    terms_s4_li3: 'Zavarja vagy megzavarja a szolgáltatást vagy a szervereket',
    terms_s4_li4: 'Megosztja fiókhitelesítő adatait másokkal',
    terms_s4_li5: 'Feltölt rosszindulatú tartalmat vagy kódot',
    terms_s5_p1:
      'A szolgáltatás és eredeti tartalma a {{appName}} tulajdona, amelyet nemzetközi szellemi tulajdonjogi törvények védenek.',
    terms_s6_p1: 'A {{appName}} használatára az Adatvédelmi Irányelvünk is vonatkozik.',
    terms_s7_p1:
      'A szolgáltatás "ahogy van" állapotban, mindenféle garancia nélkül kerül nyújtásra.',
    terms_s8_p1:
      'A {{appNameCaps}} semmilyen körülmények között nem felel a szolgáltatás használatából eredő közvetett károkért.',
    terms_s9_p1: 'Fenntartjuk a jogot ezen feltételek bármikori módosítására.',
    terms_s10_p1:
      'Ha kérdése van ezekkel a Feltételekkel kapcsolatban, kérjük, lépjen kapcsolatba velünk a következő címen',
  },
  id: {
    terms_s1_p1:
      'Dengan mengakses atau menggunakan {{appName}}, Anda setuju untuk terikat oleh Ketentuan Layanan ini.',
    terms_s2_p1:
      '{{appName}} adalah aplikasi produktivitas mahasiswa yang dirancang untuk membantu mahasiswa {{uniName}} mengelola jadwal akademik, tenggat waktu, dan kegiatan kampus mereka.',
    terms_s3_p1:
      'Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda dan untuk semua aktivitas yang terjadi di bawah akun Anda.',
    terms_s4_p1: 'Anda setuju untuk tidak:',
    terms_s4_li1: 'Menggunakan layanan untuk tujuan ilegal apa pun',
    terms_s4_li2: 'Mencoba mendapatkan akses tidak sah ke bagian mana pun dari layanan',
    terms_s4_li3: 'Mengganggu atau mengacaukan layanan atau server',
    terms_s4_li4: 'Membagikan kredensial akun Anda dengan orang lain',
    terms_s4_li5: 'Mengunggah konten atau kode berbahaya',
    terms_s5_p1:
      'Layanan dan konten aslinya dimiliki oleh {{appName}} dan dilindungi oleh hukum kekayaan intelektual internasional.',
    terms_s6_p1: 'Penggunaan Anda atas {{appName}} juga diatur oleh Kebijakan Privasi kami.',
    terms_s7_p1: 'Layanan disediakan "apa adanya" tanpa jaminan apa pun.',
    terms_s8_p1:
      'Dalam keadaan apa pun {{appNameCaps}} tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan oleh Anda.',
    terms_s9_p1: 'Kami berhak untuk mengubah ketentuan ini kapan saja.',
    terms_s10_p1:
      'Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, silakan hubungi kami di',
  },
  ms: {
    terms_s1_p1:
      'Dengan mengakses atau menggunakan {{appName}}, anda bersetuju untuk terikat dengan Terma Perkhidmatan ini.',
    terms_s2_p1:
      '{{appName}} ialah aplikasi produktiviti pelajar yang direka untuk membantu pelajar {{uniName}} mengurus jadual akademik, tarikh akhir dan aktiviti kampus mereka.',
    terms_s3_p1:
      'Anda bertanggungjawab untuk mengekalkan kerahsiaan kelayakan akaun anda dan untuk semua aktiviti yang berlaku di bawah akaun anda.',
    terms_s4_p1: 'Anda bersetuju untuk tidak:',
    terms_s4_li1: 'Menggunakan perkhidmatan untuk sebarang tujuan yang menyalahi undang-undang',
    terms_s4_li2: 'Cuba mendapatkan akses tanpa kebenaran ke mana-mana bahagian perkhidmatan',
    terms_s4_li3: 'Mengganggu atau merosakkan perkhidmatan atau pelayan',
    terms_s4_li4: 'Berkongsi kelayakan akaun anda dengan orang lain',
    terms_s4_li5: 'Memuat naik kandungan atau kod berbahaya',
    terms_s5_p1:
      'Perkhidmatan dan kandungan asalnya dimiliki oleh {{appName}} dan dilindungi oleh undang-undang harta intelek antarabangsa.',
    terms_s6_p1: 'Penggunaan {{appName}} oleh anda juga ditadbir oleh Dasar Privasi kami.',
    terms_s7_p1: 'Perkhidmatan disediakan "seadanya" tanpa sebarang jaminan.',
    terms_s8_p1:
      'Dalam apa jua keadaan {{appNameCaps}} tidak akan bertanggungjawab atas sebarang kerosakan tidak langsung yang timbul daripada penggunaan perkhidmatan oleh anda.',
    terms_s9_p1: 'Kami berhak untuk mengubah terma ini pada bila-bila masa.',
    terms_s10_p1:
      'Jika anda mempunyai sebarang soalan mengenai Terma Perkhidmatan ini, sila hubungi kami di',
  },
  ne: {
    terms_s1_p1:
      '{{appName}} पहुँच वा प्रयोग गरेर, तपाईं यी सेवा सर्तहरू पालना गर्न सहमत हुनुहुन्छ।',
    terms_s2_p1:
      '{{appName}} एक विद्यार्थी उत्पादकता एप्लिकेसन हो जुन {{uniName}} का विद्यार्थीहरूलाई उनीहरूको शैक्षिक तालिका, समयसीमा र क्याम्पस गतिविधिहरू व्यवस्थापन गर्न मद्दत गर्न डिजाइन गरिएको हो।',
    terms_s3_p1:
      'तपाईं आफ्नो खाता प्रमाणपत्रहरूको गोपनीयता कायम राख्न र तपाईंको खाता अन्तर्गत हुने सबै गतिविधिहरूको लागि जिम्मेवार हुनुहुन्छ।',
    terms_s4_p1: 'तपाईं निम्न कार्य नगर्न सहमत हुनुहुन्छ:',
    terms_s4_li1: 'सेवालाई कुनै गैरकानुनी उद्देश्यका लागि प्रयोग गर्ने',
    terms_s4_li2: 'सेवाको कुनै भागमा अनधिकृत पहुँच प्राप्त गर्ने प्रयास गर्ने',
    terms_s4_li3: 'सेवा वा सर्भरहरूमा हस्तक्षेप वा बाधा पुर्‍याउने',
    terms_s4_li4: 'आफ्नो खाता प्रमाणपत्रहरू अरूसँग साझा गर्ने',
    terms_s4_li5: 'हानिकारक सामग्री वा कोड अपलोड गर्ने',
    terms_s5_p1:
      'सेवा र यसको मौलिक सामग्री {{appName}} को स्वामित्वमा छ र अन्तर्राष्ट्रिय बौद्धिक सम्पत्ति कानूनहरूद्वारा सुरक्षित छ।',
    terms_s6_p1: '{{appName}} को तपाईंको प्रयोग हाम्रो गोपनीयता नीतिद्वारा पनि शासित छ।',
    terms_s7_p1: "सेवा कुनै पनि प्रकारको वारेन्टी बिना 'जस्तो छ' प्रदान गरिन्छ।",
    terms_s8_p1:
      'कुनै पनि अवस्थामा {{appNameCaps}} तपाईंको सेवा प्रयोगबाट उत्पन्न कुनै पनि अप्रत्यक्ष क्षतिको लागि उत्तरदायी हुने छैन।',
    terms_s9_p1: 'हामी कुनै पनि समयमा यी सर्तहरू परिवर्तन गर्ने अधिकार सुरक्षित राख्छौं।',
    terms_s10_p1:
      'यदि तपाईंलाई यी सेवा सर्तहरूको बारेमा कुनै प्रश्नहरू छन् भने, कृपया हामीलाई सम्पर्क गर्नुहोस्',
  },
  nl: {
    terms_back_to: 'Terug naar {{appName}}',
    terms_s1_p1:
      'Door toegang te krijgen tot of gebruik te maken van {{appName}}, gaat u akkoord met deze Servicevoorwaarden.',
    terms_s2_p1:
      '{{appName}} is een productiviteitsapp voor studenten, ontworpen om studenten van {{uniName}} te helpen bij het beheren van hun academische roosters, deadlines en campusactiviteiten.',
    terms_s3_p1:
      'U bent verantwoordelijk voor het vertrouwelijk houden van uw accountgegevens en voor alle activiteiten die onder uw account plaatsvinden.',
    terms_s4_p1: 'U stemt ermee in om niet:',
    terms_s4_li1: 'De dienst te gebruiken voor illegale doeleinden',
    terms_s4_li2: 'Ongeautoriseerde toegang te proberen te krijgen tot enig deel van de dienst',
    terms_s4_li3: 'De dienst of servers te verstoren of te onderbreken',
    terms_s4_li4: 'Uw accountgegevens te delen met anderen',
    terms_s4_li5: 'Kwaadaardige inhoud of code te uploaden',
    terms_s5_p1:
      'De dienst en de oorspronkelijke inhoud zijn eigendom van {{appName}} en worden beschermd door internationale wetten op intellectueel eigendom.',
    terms_s6_p1: 'Uw gebruik van {{appName}} valt ook onder ons Privacybeleid.',
    terms_s7_p1: 'De dienst wordt geleverd "zoals deze is" zonder enige garantie.',
    terms_s8_p1:
      'In geen geval is {{appNameCaps}} aansprakelijk voor indirecte schade die voortvloeit uit uw gebruik van de dienst.',
    terms_s9_p1: 'Wij behouden ons het recht voor deze voorwaarden op elk moment te wijzigen.',
    terms_s10_p1:
      'Als u vragen heeft over deze Servicevoorwaarden, neem dan contact met ons op via',
    terms_footer_copy: ' {{year}} {{appName}}. Alle rechten voorbehouden.',
  },
  no: {
    terms_s1_p1: 'Ved å bruke {{appName}} godtar du disse tjenestevilkårene.',
    terms_s2_p1:
      '{{appName}} er en produktivitetsapp for studenter designet for å hjelpe studenter ved {{uniName}} med å administrere sine akademiske timeplaner, frister og campusaktiviteter.',
    terms_s3_p1:
      'Du er ansvarlig for å opprettholde konfidensialiteten til kontoen din og for alle aktiviteter som skjer under kontoen din.',
    terms_s4_p1: 'Du godtar å ikke:',
    terms_s4_li1: 'Bruke tjenesten til ulovlige formål',
    terms_s4_li2: 'Forsøke å få uautorisert tilgang til noen del av tjenesten',
    terms_s4_li3: 'Forstyrre eller avbryte tjenesten eller serverne',
    terms_s4_li4: 'Dele dine kontoopplysninger med andre',
    terms_s4_li5: 'Laste opp skadelig innhold eller kode',
    terms_s5_p1:
      'Tjenesten og dens opprinnelige innhold eies av {{appName}} og er beskyttet av internasjonale immaterialrettslover.',
    terms_s6_p1: 'Din bruk av {{appName}} er også underlagt vår personvernerklæring.',
    terms_s7_p1: 'Tjenesten leveres "som den er" uten noen form for garanti.',
    terms_s8_p1:
      'Under ingen omstendigheter skal {{appNameCaps}} være ansvarlig for indirekte skader som følge av din bruk av tjenesten.',
    terms_s9_p1: 'Vi forbeholder oss retten til å endre disse vilkårene når som helst.',
    terms_s10_p1: 'Har du spørsmål om disse tjenestevilkårene, kontakt oss på',
  },
  pl: {
    terms_s1_p1:
      'Uzyskując dostęp lub korzystając z {{appName}}, zgadzasz się na niniejsze Warunki Korzystania.',
    terms_s2_p1:
      '{{appName}} to aplikacja produktywności dla studentów zaprojektowana, aby pomóc studentom {{uniName}} w zarządzaniu harmonogramami akademickimi, terminami i aktywnościami na kampusie.',
    terms_s3_p1:
      'Jesteś odpowiedzialny za zachowanie poufności danych logowania do konta i za wszystkie działania wykonywane na Twoim koncie.',
    terms_s4_p1: 'Zgadzasz się nie:',
    terms_s4_li1: 'Używać usługi w celach niezgodnych z prawem',
    terms_s4_li2: 'Próbować uzyskać nieautoryzowany dostęp do jakiejkolwiek części usługi',
    terms_s4_li3: 'Zakłócać lub przerywać działanie usługi lub serwerów',
    terms_s4_li4: 'Udostępniać danych logowania innym osobom',
    terms_s4_li5: 'Przesyłać złośliwych treści lub kodu',
    terms_s5_p1:
      'Usługa i jej oryginalna treść są własnością {{appName}} i są chronione międzynarodowymi prawami własności intelektualnej.',
    terms_s6_p1: 'Korzystanie z {{appName}} podlega również naszej Polityce Prywatności.',
    terms_s7_p1: 'Usługa jest dostarczana "tak jak jest" bez jakichkolwiek gwarancji.',
    terms_s8_p1:
      'W żadnym wypadku {{appNameCaps}} nie ponosi odpowiedzialności za pośrednie szkody wynikające z korzystania z usługi.',
    terms_s9_p1: 'Zastrzegamy sobie prawo do zmiany niniejszych warunków w dowolnym momencie.',
    terms_s10_p1:
      'Jeśli masz pytania dotyczące niniejszych Warunków, skontaktuj się z nami pod adresem',
  },
  ro: {
    terms_s1_p1:
      'Prin accesarea sau utilizarea {{appName}}, sunteți de acord cu acești Termeni și Condiții.',
    terms_s2_p1:
      '{{appName}} este o aplicație de productivitate pentru studenți concepută pentru a ajuta studenții de la {{uniName}} să-și gestioneze programele academice, termenele și activitățile de campus.',
    terms_s3_p1:
      'Sunteți responsabil pentru menținerea confidențialității datelor contului și pentru toate activitățile care au loc sub contul dumneavoastră.',
    terms_s4_p1: 'Sunteți de acord să nu:',
    terms_s4_li1: 'Utilizați serviciul în scopuri ilegale',
    terms_s4_li2: 'Încercați să obțineți acces neautorizat la orice parte a serviciului',
    terms_s4_li3: 'Interferați sau perturbați serviciul sau serverele',
    terms_s4_li4: 'Partajați datele contului cu alte persoane',
    terms_s4_li5: 'Încărcați conținut sau cod dăunător',
    terms_s5_p1:
      'Serviciul și conținutul său original sunt proprietatea {{appName}} și sunt protejate de legile internaționale privind proprietatea intelectuală.',
    terms_s6_p1:
      'Utilizarea {{appName}} este guvernată și de Politica noastră de Confidențialitate.',
    terms_s7_p1: 'Serviciul este furnizat "ca atare" fără nicio garanție.',
    terms_s8_p1:
      'În niciun caz {{appNameCaps}} nu va fi răspunzător pentru daune indirecte rezultate din utilizarea serviciului.',
    terms_s9_p1: 'Ne rezervăm dreptul de a modifica acești termeni în orice moment.',
    terms_s10_p1: 'Dacă aveți întrebări despre acești Termeni, contactați-ne la',
  },
  si: {
    terms_s1_p1:
      '{{appName}} වෙත ප\u200Dරවේශ වීමෙන් හෝ භාවිතා කිරීමෙන්, ඔබ මෙම සේවා කොන්දේසිවලට බැඳී සිටීමට එකඟ වේ.',
    terms_s2_p1:
      '{{appName}} යනු {{uniName}} හි සිසුන්ට ඔවුන්ගේ අධ\u200Dයයන කාලසටහන, නියමිත දින සහ කැම්පස් ක\u200Dරියාකාරකම් කළමනාකරණය කිරීමට උදව් කිරීම සඳහා නිර්මාණය කර ඇති ශිෂ\u200Dය ඵලදායිතා යෙදුමකි.',
    terms_s3_p1:
      'ඔබගේ ගිණුම් අක\u200Dරපත\u200Dරවල රහස\u200Dයභාවය පවත\u200Dවා ගැනීම සහ ඔබගේ ගිණුම යටතේ සිදුවන සියලුම ක\u200Dරියාකාරකම් සඳහා ඔබ වගකිව යුතුය.',
    terms_s4_p1: 'ඔබ පහත දේ නොකිරීමට එකඟ වේ:',
    terms_s4_li1: 'නීති විරෝධී අරමුණු සඳහා සේවාව භාවිතා කිරීම',
    terms_s4_li2: 'සේවාවේ කිසිදු කොටසකට අනවසර ප\u200Dරවේශය ලබා ගැනීමට උත\u200Dසාහ කිරීම',
    terms_s4_li3: 'සේවාව හෝ සේවාදායකයන් බාධා කිරීම හෝ කඩාකප\u200Dපල් කිරීම',
    terms_s4_li4: 'ඔබගේ ගිණුම් අක\u200Dරපත\u200Dර අන් අය සමඟ බෙදා ගැනීම',
    terms_s4_li5: 'අනිෂ\u200Dට අන්තර්ගතය හෝ කේතය උඩුගත කිරීම',
    terms_s5_p1:
      'සේවාව සහ එහි මුල් අන්තර්ගතය {{appName}} සතු වන අතර ජාත\u200Dයන\u200Dතර බුද\u200Dධිමය දේපළ නීති මගින් ආරක\u200Dෂිත වේ.',
    terms_s6_p1:
      '{{appName}} භාවිතය අපගේ පෞද\u200Dගලිකත\u200Dව ප\u200Dරතිපත\u200Dතිය මගින්ද පාලනය වේ.',
    terms_s7_p1: "සේවාව කිසිදු ආකාරයක වගකීමක් නොමැතිව 'පවතින ආකාරයට' සපයනු ලැබේ.",
    terms_s8_p1:
      'කිසිදු අවස\u200Dථාවක {{appNameCaps}} ඔබගේ සේවා භාවිතයෙන් ඇතිවන වක\u200Dර හානි සඳහා වගකිව යුතු නොවේ.',
    terms_s9_p1: 'අපි ඕනෑම වේලාවක මෙම කොන්දේසි වෙනස\u200D කිරීමේ අයිතිය රඳවා ගනිමු.',
    terms_s10_p1:
      'මෙම සේවා කොන්දේසි පිළිබඳ ප\u200Dරශ\u200Dන තිබේ නම්, කරුණාකර අප හා සම\u200Dබන\u200Dධ වන්න',
  },
  sv: {
    terms_s1_p1: 'Genom att använda {{appName}} godkänner du dessa Användarvillkor.',
    terms_s2_p1:
      '{{appName}} är en produktivitetsapp för studenter designad för att hjälpa studenter vid {{uniName}} att hantera sina akademiska scheman, deadlines och campusaktiviteter.',
    terms_s3_p1:
      'Du ansvarar för att upprätthålla sekretessen för dina kontouppgifter och för alla aktiviteter som sker under ditt konto.',
    terms_s4_p1: 'Du samtycker till att inte:',
    terms_s4_li1: 'Använda tjänsten för olagliga ändamål',
    terms_s4_li2: 'Försöka få obehörig åtkomst till någon del av tjänsten',
    terms_s4_li3: 'Störa eller avbryta tjänsten eller servrarna',
    terms_s4_li4: 'Dela dina kontouppgifter med andra',
    terms_s4_li5: 'Ladda upp skadligt innehåll eller kod',
    terms_s5_p1:
      'Tjänsten och dess originalinnehåll ägs av {{appName}} och skyddas av internationella immaterialrättslagar.',
    terms_s6_p1: 'Din användning av {{appName}} regleras också av vår Integritetspolicy.',
    terms_s7_p1: 'Tjänsten tillhandahålls "i befintligt skick" utan några garantier.',
    terms_s8_p1:
      'Under inga omständigheter ska {{appNameCaps}} hållas ansvarigt för indirekta skador till följd av din användning av tjänsten.',
    terms_s9_p1: 'Vi förbehåller oss rätten att ändra dessa villkor när som helst.',
    terms_s10_p1: 'Om du har frågor om dessa Användarvillkor, kontakta oss på',
  },
  ta: {
    terms_s1_p1:
      '{{appName}} ஐ அணுகுவதன் மூலம் அல்லது பயன்படுத்துவதன் மூலம், இந்த சேவை விதிமுறைகளுக்கு கட்டுப்பட ஒப்புக்கொள்கிறீர்கள்.',
    terms_s2_p1:
      '{{appName}} என்பது {{uniName}} மாணவர்களுக்கு அவர்களின் கல்வி அட்டவணைகள், காலக்கெடுக்கள் மற்றும் வளாக நடவடிக்கைகளை நிர்வகிக்க உதவ வடிவமைக்கப்பட்ட மாணவர் உற்பத்தித்திறன் பயன்பாடாகும்.',
    terms_s3_p1:
      'உங்கள் கணக்கு சான்றுகளின் ரகசியத்தன்மையை பராமரிப்பதற்கும் உங்கள் கணக்கின் கீழ் நிகழும் அனைத்து நடவடிக்கைகளுக்கும் நீங்கள் பொறுப்பு.',
    terms_s4_p1: 'நீங்கள் பின்வருவனவற்றை செய்ய மாட்டீர்கள் என ஒப்புக்கொள்கிறீர்கள்:',
    terms_s4_li1: 'சட்டவிரோத நோக்கங்களுக்காக சேவையைப் பயன்படுத்துவது',
    terms_s4_li2: 'சேவையின் எந்தப் பகுதிக்கும் அங்கீகரிக்கப்படாத அணுகலைப் பெற முயற்சிப்பது',
    terms_s4_li3: 'சேவை அல்லது சேவையகங்களை இடையூறு செய்வது அல்லது தடுப்பது',
    terms_s4_li4: 'உங்கள் கணக்கு சான்றுகளை மற்றவர்களுடன் பகிர்வது',
    terms_s4_li5: 'தீங்கு விளைவிக்கும் உள்ளடக்கம் அல்லது குறியீட்டை பதிவேற்றுவது',
    terms_s5_p1:
      'சேவை மற்றும் அதன் அசல் உள்ளடக்கம் {{appName}} க்கு சொந்தமானது மற்றும் சர்வதேச அறிவுசார் சொத்து சட்டங்களால் பாதுகாக்கப்படுகிறது.',
    terms_s6_p1:
      '{{appName}} இன் உங்கள் பயன்பாடு எங்கள் தனியுரிமை கொள்கையாலும் நிர்வகிக்கப்படுகிறது.',
    terms_s7_p1: "சேவை எந்தவிதமான உத்தரவாதமும் இல்லாமல் 'உள்ளது போல' வழங்கப்படுகிறது.",
    terms_s8_p1:
      'எந்தச் சூழ்நிலையிலும் {{appNameCaps}} உங்கள் சேவைப் பயன்பாட்டிலிருந்து எழும் மறைமுக சேதங்களுக்கு பொறுப்பேற்காது.',
    terms_s9_p1: 'இந்த விதிமுறைகளை எந்த நேரத்திலும் மாற்றும் உரிமையை நாங்கள் வைத்திருக்கிறோம்.',
    terms_s10_p1:
      'இந்த சேவை விதிமுறைகள் பற்றி ஏதேனும் கேள்விகள் இருந்தால், எங்களை தொடர்பு கொள்ளவும்',
  },
  th: {
    terms_s1_p1:
      'การเข้าถึงหรือใช้งาน {{appName}} แสดงว่าคุณตกลงที่จะผูกพันตามข้อกำหนดการใช้บริการเหล่านี้',
    terms_s2_p1:
      '{{appName}} คือแอปพลิเคชันเพิ่มผลผลิตสำหรับนักศึกษาที่ออกแบบมาเพื่อช่วยนักศึกษา {{uniName}} จัดการตารางเรียน กำหนดส่ง และกิจกรรมในมหาวิทยาลัย',
    terms_s3_p1:
      'คุณมีหน้าที่รักษาความลับของข้อมูลบัญชีและรับผิดชอบต่อกิจกรรมทั้งหมดภายใต้บัญชีของคุณ',
    terms_s4_p1: 'คุณตกลงที่จะไม่:',
    terms_s4_li1: 'ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย',
    terms_s4_li2: 'พยายามเข้าถึงส่วนใดของบริการโดยไม่ได้รับอนุญาต',
    terms_s4_li3: 'รบกวนหรือขัดขวางบริการหรือเซิร์ฟเวอร์',
    terms_s4_li4: 'แบ่งปันข้อมูลบัญชีกับผู้อื่น',
    terms_s4_li5: 'อัปโหลดเนื้อหาหรือโค้ดที่เป็นอันตราย',
    terms_s5_p1:
      'บริการและเนื้อหาต้นฉบับเป็นของ {{appName}} และได้รับการคุ้มครองโดยกฎหมายทรัพย์สินทางปัญญาระหว่างประเทศ',
    terms_s6_p1: 'การใช้งาน {{appName}} ของคุณยังอยู่ภายใต้นโยบายความเป็นส่วนตัวของเรา',
    terms_s7_p1: 'บริการนี้ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ',
    terms_s8_p1:
      'ไม่ว่าในกรณีใด {{appNameCaps}} จะไม่รับผิดชอบต่อความเสียหายทางอ้อมที่เกิดจากการใช้บริการของคุณ',
    terms_s9_p1: 'เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา',
    terms_s10_p1: 'หากคุณมีคำถามเกี่ยวกับข้อกำหนดการใช้บริการเหล่านี้ กรุณาติดต่อเราที่',
  },
  uk: {
    terms_s1_p1:
      'Отримуючи доступ або використовуючи {{appName}}, ви погоджуєтесь з цими Умовами використання.',
    terms_s2_p1:
      '{{appName}} — це додаток для продуктивності студентів, розроблений для допомоги студентам {{uniName}} в управлінні навчальними розкладами, дедлайнами та кампусними активностями.',
    terms_s3_p1:
      'Ви несете відповідальність за збереження конфіденційності облікових даних та за всі дії, що здійснюються під вашим обліковим записом.',
    terms_s4_p1: "Ви зобов'язуєтесь не:",
    terms_s4_li1: 'Використовувати сервіс в незаконних цілях',
    terms_s4_li2: 'Намагатися отримати несанкціонований доступ до будь-якої частини сервісу',
    terms_s4_li3: 'Порушувати або перешкоджати роботі сервісу або серверів',
    terms_s4_li4: 'Ділитися обліковими даними з іншими',
    terms_s4_li5: 'Завантажувати шкідливий контент або код',
    terms_s5_p1:
      'Сервіс та його оригінальний контент належать {{appName}} і захищені міжнародними законами про інтелектуальну власність.',
    terms_s6_p1:
      'Ваше використання {{appName}} також регулюється нашою Політикою конфіденційності.',
    terms_s7_p1: 'Сервіс надається "як є" без будь-яких гарантій.',
    terms_s8_p1:
      'За жодних обставин {{appNameCaps}} не несе відповідальності за непрямі збитки, що виникли внаслідок використання вами сервісу.',
    terms_s9_p1: 'Ми залишаємо за собою право змінювати ці умови в будь-який час.',
    terms_s10_p1: 'Якщо у вас є запитання щодо цих Умов використання, зверніться до нас за адресою',
  },
  ur: {
    terms_s1_p1:
      '{{appName}} تک رسائی حاصل کرنے یا اسے استعمال کرنے سے، آپ ان سروس کی شرائط سے متفق ہوتے ہیں۔',
    terms_s2_p1:
      '{{appName}} ایک طالب علم پروڈکٹیوٹی ایپلیکیشن ہے جو {{uniName}} کے طلباء کو ان کے تعلیمی نظام الاوقات، مقررہ تاریخوں اور کیمپس سرگرمیوں کے انتظام میں مدد کے لیے ڈیزائن کی گئی ہے۔',
    terms_s3_p1:
      'آپ اپنے اکاؤنٹ کی اسناد کی رازداری برقرار رکھنے اور اپنے اکاؤنٹ کے تحت ہونے والی تمام سرگرمیوں کے ذمہ دار ہیں۔',
    terms_s4_p1: 'آپ درج ذیل نہ کرنے پر رضامند ہیں:',
    terms_s4_li1: 'کسی بھی غیر قانونی مقصد کے لیے سروس استعمال کرنا',
    terms_s4_li2: 'سروس کے کسی بھی حصے تک غیر مجاز رسائی حاصل کرنے کی کوشش کرنا',
    terms_s4_li3: 'سروس یا سرورز میں خلل ڈالنا',
    terms_s4_li4: 'اپنے اکاؤنٹ کی اسناد دوسروں کے ساتھ شیئر کرنا',
    terms_s4_li5: 'نقصان دہ مواد یا کوڈ اپ لوڈ کرنا',
    terms_s5_p1:
      'سروس اور اس کا اصل مواد {{appName}} کی ملکیت ہے اور بین الاقوامی دانشورانہ ملکیت کے قوانین سے محفوظ ہے۔',
    terms_s6_p1: '{{appName}} کا آپ کا استعمال ہماری رازداری کی پالیسی سے بھی چلایا جاتا ہے۔',
    terms_s7_p1: "سروس کسی بھی قسم کی ضمانت کے بغیر 'جیسی ہے' فراہم کی جاتی ہے۔",
    terms_s8_p1:
      'کسی بھی صورت میں {{appNameCaps}} آپ کے سروس کے استعمال سے پیدا ہونے والے کسی بھی بالواسطہ نقصانات کا ذمہ دار نہیں ہوگا۔',
    terms_s9_p1: 'ہم کسی بھی وقت ان شرائط میں ترمیم کرنے کا حق محفوظ رکھتے ہیں۔',
    terms_s10_p1:
      'اگر آپ کو ان سروس کی شرائط کے بارے میں کوئی سوالات ہیں، تو براہ کرم ہم سے رابطہ کریں',
  },
  vi: {
    terms_s1_p1:
      'Bằng việc truy cập hoặc sử dụng {{appName}}, bạn đồng ý tuân theo các Điều khoản Dịch vụ này.',
    terms_s2_p1:
      '{{appName}} là ứng dụng năng suất dành cho sinh viên được thiết kế để giúp sinh viên {{uniName}} quản lý lịch học, hạn nộp bài và hoạt động trường.',
    terms_s3_p1:
      'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập tài khoản và tất cả hoạt động diễn ra dưới tài khoản của bạn.',
    terms_s4_p1: 'Bạn đồng ý không:',
    terms_s4_li1: 'Sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp nào',
    terms_s4_li2: 'Cố gắng truy cập trái phép vào bất kỳ phần nào của dịch vụ',
    terms_s4_li3: 'Can thiệp hoặc làm gián đoạn dịch vụ hoặc máy chủ',
    terms_s4_li4: 'Chia sẻ thông tin đăng nhập tài khoản với người khác',
    terms_s4_li5: 'Tải lên nội dung hoặc mã độc hại',
    terms_s5_p1:
      'Dịch vụ và nội dung gốc của nó thuộc sở hữu của {{appName}} và được bảo vệ bởi luật sở hữu trí tuệ quốc tế.',
    terms_s6_p1:
      'Việc sử dụng {{appName}} của bạn cũng được điều chỉnh bởi Chính sách Bảo mật của chúng tôi.',
    terms_s7_p1: 'Dịch vụ được cung cấp "nguyên trạng" mà không có bất kỳ bảo đảm nào.',
    terms_s8_p1:
      'Trong mọi trường hợp {{appNameCaps}} sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp nào phát sinh từ việc sử dụng dịch vụ của bạn.',
    terms_s9_p1: 'Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào.',
    terms_s10_p1:
      'Nếu bạn có câu hỏi về các Điều khoản Dịch vụ này, vui lòng liên hệ chúng tôi tại',
  },
};

// ── Apply patches ──────────────────────────────────

function patchLocale(locale, patches) {
  const filePath = path.join(LOCALES_DIR, locale, 'translations.json');
  if (!fs.existsSync(filePath)) {
    console.warn('  skip ' + locale + ': no file');
    return false;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let changed = false;
  for (const [key, value] of Object.entries(patches)) {
    // Only overwrite if key is missing, empty, or still identical to English
    if (!data[key] || data[key] === '' || data[key] === en[key]) {
      data[key] = value;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

let updated = 0;

// 1. Universal small keys
for (const [locale, patches] of Object.entries(UNIVERSAL)) {
  if (patchLocale(locale, patches)) {
    updated++;
    console.log('  ✅ ' + locale + ': universal keys');
  }
}

// 2. Link fixes
for (const [locale, patches] of Object.entries(LINK_FIXES)) {
  if (patchLocale(locale, patches)) {
    updated++;
    console.log('  ✅ ' + locale + ': link fixes');
  }
}

// 3. Terms paragraph translations
for (const [locale, patches] of Object.entries(TERMS_PARAGRAPHS)) {
  if (patchLocale(locale, patches)) {
    updated++;
    console.log('  ✅ ' + locale + ': terms paragraphs');
  }
}

console.log('\nDone. Updated ' + updated + ' locale batches.');
console.log('Run node tools/validate-legal-translations.cjs to verify.\n');
