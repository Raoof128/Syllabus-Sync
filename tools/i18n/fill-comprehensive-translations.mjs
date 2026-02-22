import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

const COMPREHENSIVE = {
  ar: {
    // Already mostly good, but adding missing pieces
    settings_general: "عام",
    settings_appearance: "المظهر",
    settings_experience: "التجربة",
    settings_about: "حول",
    passwordStrength: "قوة كلمة المرور",
    strongPassword: "كلمة مرور قوية",
    makePasswordStronger: "فكر في جعل كلمة مرورك أقوى",
    requirements: "المتطلبات",
    requirementsMet: "تم استيفاء {{met}}/{{total}} من المتطلبات",
    suggestions: "الاقتراحات",
    minLengthRequirement: "استخدم {{count}} أحرف على الأقل",
    lowercaseLabel: "حرف صغير",
    uppercaseLabel: "حرف كبير",
    numberLabel: "رقم",
    specialCharLabel: "رمز خاص",
  },
  zh: {
    settings_general: "常规",
    settings_appearance: "外观",
    settings_experience: "体验",
    settings_about: "关于",
    passwordStrength: "密码强度",
    strongPassword: "强密码",
    makePasswordStronger: "考虑增强密码强度",
    requirements: "要求",
    requirementsMet: "已满足 {{met}}/{{total}} 项要求",
    suggestions: "建议",
    minLengthRequirement: "至少 {{count}} 个字符",
    lowercaseLabel: "小写字母",
    uppercaseLabel: "大写字母",
    numberLabel: "数字",
    specialCharLabel: "特殊字符",
  },
  es: {
    settings_general: "General",
    settings_appearance: "Apariencia",
    settings_experience: "Experiencia",
    settings_about: "Acerca de",
    passwordStrength: "Fortaleza de la contraseña",
    strongPassword: "Contraseña fuerte",
    makePasswordStronger: "Considere fortalecer su contraseña",
    requirements: "Requisitos",
    requirementsMet: "{{met}}/{{total}} requisitos cumplidos",
    suggestions: "Sugerencias",
    minLengthRequirement: "Use al menos {{count}} caracteres",
    lowercaseLabel: "Letra minúscula",
    uppercaseLabel: "Letra mayúscula",
    numberLabel: "Número",
    specialCharLabel: "Carácter especial",
  },
  fr: {
    settings_general: "Général",
    settings_appearance: "Apparence",
    settings_experience: "Expérience",
    settings_about: "À propos",
    passwordStrength: "Force du mot de passe",
    strongPassword: "Mot de passe fort",
    makePasswordStronger: "Envisagez de renforcer votre mot de passe",
    requirements: "Exigences",
    requirementsMet: "{{met}}/{{total}} exigences satisfaites",
    suggestions: "Suggestions",
    minLengthRequirement: "Utilisez au moins {{count}} caractères",
    lowercaseLabel: "Lettre minuscule",
    uppercaseLabel: "Lettre majuscule",
    numberLabel: "Chiffre",
    specialCharLabel: "Caractère spécial",
  },
  de: {
    settings_general: "Allgemein",
    settings_appearance: "Aussehen",
    settings_experience: "Erfahrung",
    settings_about: "Über",
    passwordStrength: "Passwortstärke",
    strongPassword: "Starkes Passwort",
    makePasswordStronger: "Machen Sie Ihr Passwort stärker",
    requirements: "Anforderungen",
    requirementsMet: "{{met}}/{{total}} Anforderungen erfüllt",
    suggestions: "Vorschläge",
    minLengthRequirement: "Mindestens {{count}} Zeichen",
    lowercaseLabel: "Kleinbuchstabe",
    uppercaseLabel: "Großbuchstabe",
    numberLabel: "Zahl",
    specialCharLabel: "Sonderzeichen",
  },
  it: {
    settings_general: "Generale",
    settings_appearance: "Aspetto",
    settings_experience: "Esperienza",
    settings_about: "Informazioni",
    passwordStrength: "Robustezza password",
    strongPassword: "Password robusta",
    makePasswordStronger: "Rendi la password più robusta",
    requirements: "Requisiti",
    requirementsMet: "{{met}}/{{total}} requisiti soddisfatti",
    suggestions: "Suggerimenti",
    minLengthRequirement: "Almeno {{count}} caratteri",
    lowercaseLabel: "Lettera minuscola",
    uppercaseLabel: "Lettera maiuscola",
    numberLabel: "Numero",
    specialCharLabel: "Carattere speciale",
  },
  pt: {
    settings_general: "Geral",
    settings_appearance: "Aparência",
    settings_experience: "Experiência",
    settings_about: "Sobre",
    passwordStrength: "Força da senha",
    strongPassword: "Senha forte",
    makePasswordStronger: "Torne sua senha mais forte",
    requirements: "Requisitos",
    requirementsMet: "{{met}}/{{total}} requisitos cumpridos",
    suggestions: "Sugestões",
    minLengthRequirement: "Pelo menos {{count}} caracteres",
    lowercaseLabel: "Letra minúscula",
    uppercaseLabel: "Letra maiúscula",
    numberLabel: "Número",
    specialCharLabel: "Caractere especial",
  },
  // Add more as needed...
};

async function main() {
  const locales = Object.keys(COMPREHENSIVE);

  for (const locale of locales) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, "utf8");
    const json = JSON.parse(content);

    const translations = COMPREHENSIVE[locale];
    for (const [key, value] of Object.entries(translations)) {
      json[key] = value;
    }

    await fs.writeFile(localeFilePath, JSON.stringify(json, null, 2));
    console.log(`Updated comprehensive translations for ${locale}`);
  }
}

main().catch(console.error);
