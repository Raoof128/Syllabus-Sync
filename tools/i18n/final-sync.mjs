import fs from 'node:fs/promises';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const BASE_LOCALE = 'en';
const TRANSLATION_FILE = 'translations.json';

const FINAL_TRANSLATIONS = {
  ar: {
    examToday: "الامتحان كان اليوم", ago_one: "منذ يوم واحد", ago_other: "منذ {{count}} أيام", startingSoon: "سيبدأ قريباً", inHours_one: "خلال ساعة واحدة", inHours_other: "خلال {{count}} ساعات", tomorrow: "غداً", inDays_one: "خلال يوم واحد", inDays_other: "خلال {{count}} أيام", examPassed: "انتهى الامتحان", examLocation: "موقع الامتحان"
  },
  zh: {
    examToday: "考试就在今天", ago_one: "1 天前", ago_other: "{{count}} 天前", startingSoon: "即将开始", inHours_one: "1 小时后", inHours_other: "{{count}} 小时后", tomorrow: "明天", inDays_one: "1 天后", inDays_other: "{{count}} 天后", examPassed: "考试已结束", examLocation: "考试地点"
  },
  es: {
    examToday: "El examen fue hoy", ago_one: "hace 1 día", ago_other: "hace {{count}} días", startingSoon: "Empieza pronto", inHours_one: "en 1 hora", inHours_other: "en {{count}} horas", tomorrow: "Mañana", inDays_one: "en 1 día", inDays_other: "en {{count}} días", examPassed: "Examen pasado", examLocation: "Ubicación del examen"
  },
  fr: {
    examToday: "L'examen était aujourd'hui", ago_one: "il y a 1 jour", ago_other: "il y a {{count}} jours", startingSoon: "Commence bientôt", inHours_one: "dans 1 heure", inHours_other: "dans {{count}} heures", tomorrow: "Demain", inDays_one: "dans 1 jour", inDays_other: "dans {{count}} jours", examPassed: "Examen passé", examLocation: "Lieu de l'examen"
  },
  ru: {
    examToday: "Экзамен был сегодня", ago_one: "1 день назад", ago_other: "{{count}} дн. назад", startingSoon: "Скоро начнется", inHours_one: "через 1 час", inHours_other: "через {{count}} ч.", tomorrow: "Завтра", inDays_one: "через 1 день", inDays_other: "через {{count}} дн.", examPassed: "Экзамен прошел", examLocation: "Место проведения экзамена"
  }
};

async function main() {
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE);
  const baseContent = await fs.readFile(baseFilePath, 'utf8');
  const baseJson = JSON.parse(baseContent);

  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);

  for (const locale of locales) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, 'utf8');
    const json = JSON.parse(content);

    let changed = false;
    const newJson = {};
    
    for (const key of Object.keys(baseJson)) {
      if (json[key] === undefined) {
        newJson[key] = baseJson[key];
        changed = true;
      } else {
        newJson[key] = json[key];
      }
    }
    
    // Apply final specific translations
    if (FINAL_TRANSLATIONS[locale]) {
      for (const [key, value] of Object.entries(FINAL_TRANSLATIONS[locale])) {
        newJson[key] = value;
        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(localeFilePath, JSON.stringify(newJson, null, 2));
      console.log(`Final sync for ${locale}`);
    }
  }
}

main();
