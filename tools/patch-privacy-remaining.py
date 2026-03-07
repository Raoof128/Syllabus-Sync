#!/usr/bin/env python3
"""Add the remaining section title keys + link keys to all 16 privacy patches.
Run: python3 tools/patch-privacy-remaining.py
"""
import json, os

LOCALES_DIR = os.path.join(os.path.dirname(__file__), '..', 'locales')
en = json.load(open(os.path.join(LOCALES_DIR, 'en', 'translations.json')))

# Section titles + links that need translating per locale
EXTRA = {
"cs": {
  "privacy_s3_title": "Jak shromažďujeme osobní údaje",
  "privacy_s4_title": "Proč a jak používáme osobní údaje",
  "privacy_s5_title": "Zpřístupnění osobních údajů",
  "privacy_s6_title": "Zahraniční zpřístupnění a služby třetích stran",
  "privacy_s7_title": "Zabezpečení osobních údajů",
  "privacy_s8_title": "Uchovávání dat",
  "privacy_s9_title": "Soubory cookie a analytika",
  "privacy_s10_title": "Přístup a oprava",
  "privacy_s11_title": "Stížnosti",
  "privacy_s12_title": "Narušení dat (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Vzdělávací kontext",
  "privacy_s14_title": "Změny této politiky",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"da": {
  "privacy_s3_title": "Hvordan vi indsamler personoplysninger",
  "privacy_s4_title": "Hvorfor og hvordan vi bruger personoplysninger",
  "privacy_s5_title": "Videregivelse af personoplysninger",
  "privacy_s6_title": "Videregivelse i udlandet og tredjepartstjenester",
  "privacy_s7_title": "Sikkerhed for personoplysninger",
  "privacy_s8_title": "Opbevaring af data",
  "privacy_s9_title": "Cookies og analyse",
  "privacy_s10_title": "Adgang og rettelse",
  "privacy_s11_title": "Klager",
  "privacy_s12_title": "Databrud (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Uddannelseskontekst",
  "privacy_s14_title": "Ændringer af denne politik",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"de": {
  "privacy_s3_title": "Wie wir personenbezogene Daten erheben",
  "privacy_s4_title": "Warum und wie wir personenbezogene Daten verwenden",
  "privacy_s5_title": "Offenlegung personenbezogener Daten",
  "privacy_s6_title": "Auslandsoffenlegung und Drittanbieterdienste",
  "privacy_s7_title": "Sicherheit personenbezogener Daten",
  "privacy_s8_title": "Datenaufbewahrung",
  "privacy_s9_title": "Cookies und Analysen",
  "privacy_s10_title": "Zugang und Korrektur",
  "privacy_s11_title": "Beschwerden",
  "privacy_s12_title": "Datenpannen (Notifiable Data Breaches Scheme)",
  "privacy_s13_title": "Bildungskontext",
  "privacy_s14_title": "Änderungen dieser Richtlinie",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)"
},
"el": {
  "privacy_s3_title": "Πώς συλλέγουμε προσωπικά δεδομένα",
  "privacy_s4_title": "Γιατί και πώς χρησιμοποιούμε προσωπικά δεδομένα",
  "privacy_s5_title": "Γνωστοποίηση προσωπικών δεδομένων",
  "privacy_s6_title": "Γνωστοποίηση στο εξωτερικό και υπηρεσίες τρίτων",
  "privacy_s7_title": "Ασφάλεια προσωπικών δεδομένων",
  "privacy_s8_title": "Διατήρηση δεδομένων",
  "privacy_s9_title": "Cookies και αναλυτικά",
  "privacy_s10_title": "Πρόσβαση και διόρθωση",
  "privacy_s11_title": "Καταγγελίες",
  "privacy_s12_title": "Παραβιάσεις δεδομένων (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Εκπαιδευτικό πλαίσιο",
  "privacy_s14_title": "Αλλαγές σε αυτήν την πολιτική",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"fi": {
  "privacy_s3_title": "Miten keräämme henkilötietoja",
  "privacy_s4_title": "Miksi ja miten käytämme henkilötietoja",
  "privacy_s5_title": "Henkilötietojen luovuttaminen",
  "privacy_s6_title": "Ulkomainen luovutus ja kolmannen osapuolen palvelut",
  "privacy_s7_title": "Henkilötietojen turvallisuus",
  "privacy_s8_title": "Tietojen säilyttäminen",
  "privacy_s9_title": "Evästeet ja analytiikka",
  "privacy_s10_title": "Pääsy ja korjaus",
  "privacy_s11_title": "Valitukset",
  "privacy_s12_title": "Tietomurrot (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Koulutuskonteksti",
  "privacy_s14_title": "Muutokset tähän käytäntöön",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"hu": {
  "privacy_s3_title": "Hogyan gyűjtjük a személyes adatokat",
  "privacy_s4_title": "Miért és hogyan használjuk a személyes adatokat",
  "privacy_s5_title": "Személyes adatok közlése",
  "privacy_s6_title": "Külföldi közlés és harmadik féltől származó szolgáltatások",
  "privacy_s7_title": "Személyes adatok biztonsága",
  "privacy_s8_title": "Adatmegőrzés",
  "privacy_s9_title": "Sütik és elemzések",
  "privacy_s10_title": "Hozzáférés és javítás",
  "privacy_s11_title": "Panaszok",
  "privacy_s12_title": "Adatszivárgások (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Oktatási kontextus",
  "privacy_s14_title": "A jelen irányelv módosításai",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"ne": {
  "privacy_s3_title": "हामी कसरी व्यक्तिगत जानकारी सङ्कलन गर्छौं",
  "privacy_s4_title": "हामी किन र कसरी व्यक्तिगत जानकारी प्रयोग गर्छौं",
  "privacy_s5_title": "व्यक्तिगत जानकारीको खुलासा",
  "privacy_s6_title": "विदेशी खुलासा र तेस्रो-पक्ष सेवाहरू",
  "privacy_s7_title": "व्यक्तिगत जानकारीको सुरक्षा",
  "privacy_s8_title": "डाटा सञ्चय",
  "privacy_s9_title": "कुकीहरू र विश्लेषण",
  "privacy_s10_title": "पहुँच र सुधार",
  "privacy_s11_title": "गुनासोहरू",
  "privacy_s12_title": "डाटा उल्लङ्घन (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "शैक्षिक सन्दर्भ",
  "privacy_s14_title": "यो नीतिमा परिवर्तनहरू",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"nl": {
  "privacy_s3_title": "Hoe wij persoonsgegevens verzamelen",
  "privacy_s4_title": "Waarom en hoe wij persoonsgegevens gebruiken",
  "privacy_s5_title": "Openbaarmaking van persoonsgegevens",
  "privacy_s6_title": "Buitenlandse openbaarmaking en diensten van derden",
  "privacy_s7_title": "Beveiliging van persoonsgegevens",
  "privacy_s8_title": "Gegevensbewaring",
  "privacy_s9_title": "Cookies en analyses",
  "privacy_s10_title": "Toegang en correctie",
  "privacy_s11_title": "Klachten",
  "privacy_s12_title": "Datalekken (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Onderwijscontext",
  "privacy_s14_title": "Wijzigingen in dit beleid",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"no": {
  "privacy_s3_title": "Hvordan vi samler inn personopplysninger",
  "privacy_s4_title": "Hvorfor og hvordan vi bruker personopplysninger",
  "privacy_s5_title": "Utlevering av personopplysninger",
  "privacy_s6_title": "Utenlandsutlevering og tredjepartstjenester",
  "privacy_s7_title": "Sikkerhet for personopplysninger",
  "privacy_s8_title": "Datalagring",
  "privacy_s9_title": "Informasjonskapsler og analyse",
  "privacy_s10_title": "Tilgang og korrigering",
  "privacy_s11_title": "Klager",
  "privacy_s12_title": "Databrudd (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Utdanningskontekst",
  "privacy_s14_title": "Endringer i denne policyen",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"pl": {
  "privacy_s3_title": "Jak gromadzimy dane osobowe",
  "privacy_s4_title": "Dlaczego i jak wykorzystujemy dane osobowe",
  "privacy_s5_title": "Ujawnianie danych osobowych",
  "privacy_s6_title": "Ujawnianie za granicą i usługi stron trzecich",
  "privacy_s7_title": "Bezpieczeństwo danych osobowych",
  "privacy_s8_title": "Przechowywanie danych",
  "privacy_s9_title": "Pliki cookie i analityka",
  "privacy_s10_title": "Dostęp i korekta",
  "privacy_s11_title": "Skargi",
  "privacy_s12_title": "Naruszenia danych (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Kontekst edukacyjny",
  "privacy_s14_title": "Zmiany w niniejszej polityce",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"pt": {
  "privacy_s3_title": "Como coletamos informações pessoais",
  "privacy_s4_title": "Por que e como usamos informações pessoais",
  "privacy_s5_title": "Divulgação de informações pessoais",
  "privacy_s6_title": "Divulgação no exterior e serviços de terceiros",
  "privacy_s7_title": "Segurança das informações pessoais",
  "privacy_s8_title": "Retenção de dados",
  "privacy_s9_title": "Cookies e análises",
  "privacy_s10_title": "Acesso e correção",
  "privacy_s11_title": "Reclamações",
  "privacy_s12_title": "Violações de dados (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Contexto educacional",
  "privacy_s14_title": "Alterações nesta política",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"ro": {
  "privacy_s3_title": "Cum colectăm informații personale",
  "privacy_s4_title": "De ce și cum folosim informațiile personale",
  "privacy_s5_title": "Divulgarea informațiilor personale",
  "privacy_s6_title": "Divulgare în străinătate și servicii terțe",
  "privacy_s7_title": "Securitatea informațiilor personale",
  "privacy_s8_title": "Păstrarea datelor",
  "privacy_s9_title": "Cookie-uri și analize",
  "privacy_s10_title": "Acces și corectare",
  "privacy_s11_title": "Reclamații",
  "privacy_s12_title": "Încălcări de date (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Context educațional",
  "privacy_s14_title": "Modificări ale acestei politici",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"si": {
  "privacy_s3_title": "අපි පුද්ගලික තොරතුරු එකතු කරන ආකාරය",
  "privacy_s4_title": "අපි පුද්ගලික තොරතුරු භාවිතා කරන්නේ ඇයි සහ කෙසේද",
  "privacy_s5_title": "පුද්ගලික තොරතුරු හෙළි කිරීම",
  "privacy_s6_title": "විදේශ හෙළිදරව් කිරීම සහ තෙවන-පාර්ශවික සේවා",
  "privacy_s7_title": "පුද්ගලික තොරතුරු ආරක්ෂාව",
  "privacy_s8_title": "දත්ත රඳවා ගැනීම",
  "privacy_s9_title": "කුකීස් සහ විශ්ලේෂණ",
  "privacy_s10_title": "ප්‍රවේශය සහ නිවැරදි කිරීම",
  "privacy_s11_title": "පැමිණිලි",
  "privacy_s12_title": "දත්ත කඩවීම් (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "අධ්‍යාපන සන්දර්භය",
  "privacy_s14_title": "මෙම ප්‍රතිපත්තියේ වෙනස්කම්",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"sv": {
  "privacy_s3_title": "Hur vi samlar in personuppgifter",
  "privacy_s4_title": "Varför och hur vi använder personuppgifter",
  "privacy_s5_title": "Utlämnande av personuppgifter",
  "privacy_s6_title": "Utländskt utlämnande och tredjepartstjänster",
  "privacy_s7_title": "Säkerhet för personuppgifter",
  "privacy_s8_title": "Datalagring",
  "privacy_s9_title": "Cookies och analys",
  "privacy_s10_title": "Åtkomst och rättelse",
  "privacy_s11_title": "Klagomål",
  "privacy_s12_title": "Dataintrång (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Utbildningskontext",
  "privacy_s14_title": "Ändringar av denna policy",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
},
"tr": {
  "privacy_s3_title": "Kişisel bilgileri nasıl topluyoruz",
  "privacy_s4_title": "Kişisel bilgileri neden ve nasıl kullanıyoruz",
  "privacy_s5_title": "Kişisel bilgilerin açıklanması",
  "privacy_s6_title": "Yurt dışı açıklama ve üçüncü taraf hizmetler",
  "privacy_s7_title": "Kişisel bilgilerin güvenliği",
  "privacy_s8_title": "Veri saklama",
  "privacy_s9_title": "Çerezler ve analitik",
  "privacy_s10_title": "Erişim ve düzeltme",
  "privacy_s11_title": "Şikayetler",
  "privacy_s12_title": "Veri ihlalleri (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Eğitim bağlamı",
  "privacy_s14_title": "Bu politikadaki değişiklikler",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)"
},
"uk": {
  "privacy_s3_title": "Як ми збираємо особисту інформацію",
  "privacy_s4_title": "Чому і як ми використовуємо особисту інформацію",
  "privacy_s5_title": "Розкриття особистої інформації",
  "privacy_s6_title": "Закордонне розкриття та послуги третіх сторін",
  "privacy_s7_title": "Безпека особистої інформації",
  "privacy_s8_title": "Зберігання даних",
  "privacy_s9_title": "Файли cookie та аналітика",
  "privacy_s10_title": "Доступ та виправлення",
  "privacy_s11_title": "Скарги",
  "privacy_s12_title": "Порушення даних (Notifiable Data Breaches scheme)",
  "privacy_s13_title": "Освітній контекст",
  "privacy_s14_title": "Зміни до цієї політики",
  "privacy_s11_p2_link": "Office of the Australian Information Commissioner (OAIC)",
  "privacy_s12_p1_link": "Notifiable Data Breaches (NDB) scheme"
}
}

total = 0
for locale, patches in EXTRA.items():
    fp = os.path.join(LOCALES_DIR, locale, 'translations.json')
    data = json.load(open(fp))
    n = 0
    for k, v in patches.items():
        if not data.get(k) or data[k] == '' or data[k] == en.get(k):
            data[k] = v
            n += 1
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {locale}: patched {n} remaining keys')
    total += n

print(f'\nDone. Patched {total} additional keys across {len(EXTRA)} locales.')

