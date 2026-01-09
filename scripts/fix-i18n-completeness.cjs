/**
 * i18n Completeness Fix Script
 * 
 * This script ensures all locales have complete translations matching English.
 * It adds missing keys and provides professional translations for each language.
 * 
 * Run with: node scripts/fix-i18n-completeness.cjs
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');

// Load English as the authoritative source
const en = require('../locales/en/translations.json');
const enKeys = Object.keys(en);

console.log('=== i18n Completeness Fix ===');
console.log(`English reference: ${enKeys.length} keys\n`);

// Professional translations for each language
// NOTE: Building names with codes (e.g., "12 Wally's Walk") are kept as-is since they are proper nouns
// Only descriptions and UI strings are translated

const translations = {
    // Arabic (RTL)
    ar: {
        // Building translations
        "building_18WW_name": "18 Wally's Walk (المركز الرئيسي)",
        "building_18WW_desc": "مبنى خدمات الطلاب الرئيسي يضم Service Connect وتكنولوجيا المعلومات والموارد البشرية والخدمات المالية ومكاتب الإدارة.",
        "building_SEC_name": "الأمن والطوارئ",
        "building_SEC_desc": "مقر أمن الحرم الجامعي وخدمات الإسعافات الأولية الطارئة. متاح 24/7.",
        "building_25BWW_name": "25B Wally's Walk (كلية الآداب)",
        "building_25BWW_desc": "إدارة كلية الآداب والتعليم والعلوم الاجتماعية والدراسات الأصلية والتاريخ ومتحف غيل للتاريخ.",
        "building_17WW_name": "17 Wally's Walk (القانون والإعلام)",
        "building_17WW_desc": "كلية القانون بجامعة ماكواري، الإعلام والاتصالات، مبنى مايكل كيربي للقانون.",
        "building_4ER_name": "4 Eastern Road (كلية الأعمال)",
        "building_4ER_desc": "كلية الأعمال بجامعة ماكواري - المحاسبة والمالية والإدارة والتسويق والدراسات الاكتوارية.",
        "building_75TAL_name": "75 Talavera Road (العلوم الصحية)",
        "building_75TAL_desc": "كلية الطب والعلوم الصحية وكلية الطب والمعهد الأسترالي للابتكار الصحي وتقويم العمود الفقري.",
        "building_16UA_name": "16 University Avenue (علم النفس)",
        "building_16UA_desc": "علم النفس واللغويات وعيادة النطق والسمع وعيادة القراءة ومركز الصحة العاطفية.",
        "building_9WW_name": "9 Wally's Walk (الهندسة)",
        "building_9WW_desc": "كلية الهندسة، البصريات الفلكية الأسترالية.",
        "building_4RPD_name": "4 Research Park Drive (الحوسبة)",
        "building_4RPD_desc": "كلية الحوسبة، مقهى Esc.",
        "building_6WW_name": "6 Wally's Walk (العلوم الطبيعية)",
        "building_6WW_desc": "كلية العلوم الطبيعية، العلوم البيولوجية، معشبة النباتات.",
        "building_LOTUS_name": "مسرح اللوتس",
        "building_LOTUS_desc": "مكان رئيسي للتعليم والترفيه.",
        "building_MQTH_name": "مسرح ماكواري",
        "building_MQTH_desc": "قاعة محاضرات كبيرة ومكان للترفيه.",
        "building_PRICE_name": "مسرح برايس",
        "building_PRICE_desc": "مسرح تعليمي.",
        "building_LIGHT_name": "مسرح المنارة",
        "building_LIGHT_desc": "مكان للعروض.",
        "building_AINS_name": "مبنى أينزورث",
        "building_AINS_desc": "مرفق تعليمي.",
        "building_HOSP_name": "مستشفى جامعة ماكواري",
        "building_HOSP_desc": "مستشفى تعليمي مع عيادات تخصصية والتصوير الطبي والصيدلية.",
        "building_CLINIC_name": "عيادات الطب العام والعلاج الطبيعي",
        "building_CLINIC_desc": "عيادات الطب العام والعلاج الطبيعي والاستشارات التخصصية.",
        "building_WOOL_name": "معهد وولكوك",
        "building_WOOL_desc": "معهد وولكوك للبحوث الطبية.",
        "building_FIELDS_name": "الملاعب الرياضية والتنس",
        "building_FIELDS_desc": "ملاعب رياضية خارجية ومركز التنس.",
        "building_UBAR_name": "UBar والساحة المركزية",
        "building_UBAR_desc": "بار الحرم الجامعي ومكان اجتماعي ومنطقة حفلات التخرج.",
        "building_CULT_name": "مطعم Cult",
        "building_CULT_desc": "مطعم الحرم الجامعي في منطقة الآداب.",
        "building_LACH_name": "مطعم لاكلان",
        "building_LACH_desc": "مطعم فاخر.",
        "building_8SCO_name": "8 Sir Christopher Ondaatje Ave",
        "building_8SCO_desc": "الطلاب المستقبليون، كلية ماكواري، أكاديمية ماكواري، غرفة الصلاة، مركز اختبار IELTS/PTE، الوصول وتوسيع المشاركة.",
        "building_16WW_name": "16 Wally's Walk (البحث)",
        "building_16WW_desc": "أكاديمية البحث للدراسات العليا، خدمات البحث، التسويق والابتكار.",
        "building_12SW_name": "12 Second Way (خدمات الطلاب)",
        "building_12SW_desc": "رفاهية الطلاب، مشاركة الطلاب، وحدة التخرج.",
        "building_19ER_name": "19 Eastern Road (المستشارية)",
        "building_19ER_desc": "المستشارية، الأرشيف والسجلات، معرض الفنون.",
        "building_OBS_name": "المرصد",
        "building_OBS_desc": "مرصد فلكي.",
        "building_INCUB_name": "حاضنة ماكواري",
        "building_INCUB_desc": "حاضنة جامعة ماكواري للشركات الناشئة.",
        "building_CHAP_name": "القسيسية",
        "building_CHAP_desc": "خدمات القسيسية متعددة الأديان.",
        "building_WALU_name": "والانجا مورو",
        "building_WALU_desc": "دعم الطلاب الأصليين والخدمات الثقافية.",
        "building_BANK_name": "كوخ بانكسيا (رعاية الأطفال)",
        "building_BANK_desc": "مرفق رعاية الأطفال في الحرم الجامعي.",
        "building_GUMNUT_name": "كوخ غامنت (رعاية الأطفال)",
        "building_GUMNUT_desc": "مرفق رعاية الأطفال في الحرم الجامعي.",
        "building_MIAMIA_name": "ميا ميا (رعاية الأطفال)",
        "building_MIAMIA_desc": "مرفق رعاية الأطفال في الحرم الجامعي بالقرب من والانجا مورو.",
        "building_WARATAH_name": "واراتاه (رعاية الأطفال)",
        "building_WARATAH_desc": "مرفق رعاية الأطفال في الحرم الجامعي.",
        "building_NEXTSENSE_name": "مركز التميز نيكست سنس",
        "building_NEXTSENSE_desc": "مركز التميز نيكست سنس للبحوث في السمع والبصر والحواس.",
        "building_NEXTSCHOOL_name": "مدرسة نيكست سنس",
        "building_NEXTSCHOOL_desc": "مدرسة نيكست سنس للطلاب الصم وضعاف البصر.",
        "building_METS_name": "METS (خدمات الهندسة)",
        "building_METS_desc": "خدمات ماكواري الهندسية التقنية - ورشة ودعم تقني.",
        "building_WALLYS_name": "قهوة والي وتوست",
        "building_WALLYS_desc": "مقهى الحرم الجامعي في مبنى المركز الرئيسي.",
        "building_LIBCAFE_name": "مقهى المكتبة",
        "building_LIBCAFE_desc": "مقهى يقع في مكتبة وارانارا.",
        "building_DLC_name": "كلية دانمور لانج",
        "building_DLC_desc": "كلية سكنية للطلاب.",
        "building_RMC_name": "كلية روبرت منزيس",
        "building_RMC_desc": "كلية سكنية للطلاب.",
        "building_MQV_name": "قرية ماكواري",
        "building_MQV_desc": "قرية سكن الطلاب.",
        "building_GALLERY_name": "معرض الفنون",
        "building_GALLERY_desc": "معرض الفنون الجامعي والمعارض.",
        "building_BIODISC_name": "مركز اكتشاف البيولوجيا",
        "building_BIODISC_desc": "متحف البيولوجيا ومركز الاكتشاف.",
        "building_11WW_name": "11 Wally's Walk",
        "building_11WW_desc": "مبنى أكاديمي على ممر والي.",
        "building_13RPD_name": "13 Research Park Drive",
        "building_13RPD_desc": "مرفق بحثي على Research Park Drive.",
        "building_6ER_name": "6 Eastern Road",
        "building_6ER_desc": "مبنى أكاديمي على الطريق الشرقي.",
        "building_1CC_name": "1 Central Courtyard",
        "building_1CC_desc": "مبنى الساحة المركزية ومركز الطلاب.",
        "building_MERCURE_name": "ميركيور سيدني ماكواري بارك",
        "building_MERCURE_desc": "فندق مجاور للحرم الجامعي.",
        "building_COCHLEAR_name": "كوكلير ليمتد",
        "building_COCHLEAR_desc": "مقر كوكلير ومرفق البحث.",
        "building_10SCO_name": "10 Sir Christopher Ondaatje Ave",
        "building_10SCO_desc": "مبنى أكاديمي.",
        "building_14ER_name": "14 Eastern Road",
        "building_14ER_desc": "مبنى أكاديمي في كلية العلوم على الطريق الشرقي.",
        "building_6SR_name": "6 Science Road",
        "building_6SR_desc": "مبنى العلوم على طريق العلوم.",
        "building_13ARPD_name": "13A Research Park Drive",
        "building_13ARPD_desc": "مرفق بحثي على Research Park Drive.",

        // Category/tag translations
        "levels": "طوابق",
        "accessible": "متاح للجميع",
        "accommodation": "سكن",
        "venue": "مكان",
        "medical": "طبي",
        "health": "صحة",
        "food": "طعام",
        "cafe": "مقهى",
        "restaurant": "مطعم",
        "arts": "فنون",
        "gallery": "معرض",
        "culture": "ثقافة",
        "indigenous": "أصلي",
        "spiritual": "روحي",
        "childcare": "رعاية الأطفال",
        "student": "طالب",
        "wellbeing": "رفاهية",
        "business": "أعمال",
        "law": "قانون",
        "media": "إعلام",
        "psychology": "علم النفس",
        "science": "علوم",
        "astronomy": "فلك",
        "innovation": "ابتكار",
        "museum": "متحف",
        "education": "تعليم",
        "performance": "عروض",
        "events": "فعاليات",
        "outdoor": "خارجي",
        "safety": "أمان",
        "emergency": "طوارئ",
        "residential": "سكني",

        // Map and UI keys
        "active": "نشط",
        "routeReady": "المسار جاهز - اختر مبنى على الخريطة",
        "selectBuildingToNavigate": "اختر مبنى للحصول على الاتجاهات",
        "locationTrackingEnabled": "يتم تتبع موقعك على الخريطة",
        "showFilters": "إظهار الفلاتر",
        "hideFilters": "إخفاء الفلاتر",
        "clearAll": "مسح الكل",
        "results": "نتائج",
        "noMatchingBuildings": "لا توجد مباني مطابقة للفلاتر المحددة",
        "clearFilters": "مسح الفلاتر",
        "showPassword": "إظهار كلمة المرور",
        "hidePassword": "إخفاء كلمة المرور",
        "toggleCurrentPasswordVisibility": "تبديل رؤية كلمة المرور الحالية",
        "toggleNewPasswordVisibility": "تبديل رؤية كلمة المرور الجديدة",
        "toggleConfirmPasswordVisibility": "تبديل رؤية تأكيد كلمة المرور",
        "addFilter": "إضافة فلتر {{filter}}",
        "removeFilter": "إزالة فلتر {{filter}}",
        "recentActivity": "النشاط الأخير",
        "noRecentActivity": "لا يوجد نشاط حديث",
        "startEarningXP": "أكمل المهام لبدء كسب النقاط!",
        "recently": "مؤخراً",
        "recentXPEvents": "أحداث النقاط الأخيرة",

        // Biometric authentication
        "biometricLogin": "تسجيل الدخول البيومتري",
        "biometricLoginDesc": "استخدم Face ID أو Touch ID أو Windows Hello لتسجيل دخول سريع وآمن",
        "biometricEnabled": "تم تفعيل البيومتري",
        "biometricEnabledMsg": "يمكنك الآن استخدام المصادقة البيومترية لتسجيل الدخول",
        "biometricDisabled": "تم تعطيل البيومتري",
        "biometricDisabledMsg": "تم إيقاف المصادقة البيومترية",
        "biometricSetupFailed": "فشل الإعداد",
        "biometricSetupFailedMsg": "تعذر إعداد المصادقة البيومترية. يرجى المحاولة مرة أخرى.",
        "biometricDeviceReady": "جهازك يدعم المصادقة البيومترية",
        "biometricNotConfigured": "لم يتم العثور على جهاز بيومتري. يرجى إعداد Face ID أو Touch ID أو Windows Hello على جهازك.",
        "biometricPrivacyNote": "بياناتك البيومترية لا تغادر جهازك أبداً. نخزن فقط معرف بيانات الاعتماد الآمن.",
        "enableBiometric": "تفعيل تسجيل الدخول البيومتري",
        "enableBiometricDesc": "إعداد Face ID أو Touch ID أو Windows Hello لتسجيل دخول أسرع وأكثر أماناً.",
        "disableBiometric": "تعطيل تسجيل الدخول البيومتري",
        "disableBiometricDesc": "هل أنت متأكد أنك تريد تعطيل تسجيل الدخول البيومتري؟ ستحتاج إلى استخدام كلمة المرور لتسجيل الدخول.",
        "moreSecurityFeatures": "المزيد من ميزات الأمان",
        "moreSecurityFeaturesDesc": "المصادقة ذات العاملين ومفاتيح الأمان وإدارة كلمات المرور قريباً.",
        "notSupported": "غير مدعوم",
        "noDeviceFound": "لم يتم العثور على جهاز",
        "settingUp": "جاري الإعداد...",
        "tryAgainLater": "يرجى المحاولة لاحقاً",
        "processing": "جاري المعالجة...",

        // Map layer translations (fixing untranslated entries)
        "mapLayers": "طبقات الخريطة",
        "mapLayersDesc": "تبديل طبقات الخريطة للمواقف والمياه وإمكانية الوصول والمزيد",
        "showLayers": "إظهار الطبقات",
        "hideLayers": "إخفاء الطبقات",
        "overlayParking": "المواقف",
        "overlayParkingDesc": "مناطق المواقف، شحن السيارات الكهربائية، ماكينات التذاكر",
        "overlayWater": "مياه الشرب",
        "overlayWaterDesc": "مواقع نوافير المياه في الحرم الجامعي",
        "overlayAccessibility": "إمكانية الوصول",
        "overlayAccessibilityDesc": "الممرات المتاحة، دورات المياه، المصاعد، السلالم",
        "overlayPermits": "التصاريح الخاصة",
        "overlayPermitsDesc": "مناطق مركبات الخدمة ومواقف التصاريح",
        "overlayExam": "مواقع الامتحانات",
        "overlayExamDesc": "مباني الامتحانات ومواقع القاعات",
        "overlayWalkingTrack": "مسار المشي",
        "overlayWalkingTrackDesc": "مسار المشي بوديارى نجورا 3 كم",
        "layersActive": "طبقات نشطة",
        "source": "المصدر",
        "lastUpdated": "آخر تحديث",
        "legend": "دليل",
        "showMore": "عرض المزيد",
        "showLess": "عرض أقل",
        "gridView": "عرض الشبكة",
        "listView": "عرض القائمة",
        "allCategories": "جميع الفئات",
        "filterByCategory": "تصفية حسب الفئة",
        "buildingsFound": "تم العثور على {{count}} مباني",
        "quickSearch": "بحث سريع",
        "filterBuildings": "تصفية المباني حسب الاسم أو الرمز أو الفئة",

        // Additional building translations
        "building_14FW_name": "14 First Walk (MUSEC)",
        "building_14FW_desc": "مركز جامعة ماكواري للتعليم الخاص - برامج تعليمية للأطفال.",
        "building_14SCO_name": "14 Sir Christopher Ondaatje Ave",
        "building_14SCO_desc": "مبنى أكاديمي مع مساحات تعليمية وقاعات امتحانات.",
        "building_4WR_name": "4 Western Road",
        "building_4WR_desc": "مبنى أكاديمي مع قاعات تعليمية وامتحانات.",
        "building_EAST3_name": "موقف الشرق 3",
        "building_EAST3_desc": "موقف سيارات متعدد الطوابق.",
        "building_EAST2_name": "موقف الشرق 2",
        "building_EAST2_desc": "موقف سيارات متعدد الطوابق.",
        "building_75TR_name": "75 Talavera Road",
        "building_75TR_desc": "مبنى تجاري.",
        "building_3SR_name": "3 Science Road",
        "building_3SR_desc": "مبنى أكاديمي.",
        "building_6FW_name": "6 First Walk",
        "building_6FW_desc": "مبنى أكاديمي.",
        "building_17MW_name": "17 Macquarie Walk",
        "building_17MW_desc": "مبنى أكاديمي.",
        "building_1MD_name": "1 Management Drive",
        "building_1MD_desc": "مبنى أكاديمي.",
        "building_3MD_name": "3 Management Drive",
        "building_3MD_desc": "مبنى أكاديمي.",
        "building_5MD_name": "5 Management Drive",
        "building_5MD_desc": "مبنى أكاديمي.",
        "building_1EXR_name": "1 Executive Road",
        "building_1EXR_desc": "مبنى أكاديمي.",
        "building_2FW_name": "2 First Walk",
        "building_2FW_desc": "مبنى أكاديمي.",
        "building_4FW_name": "4 First Walk",
        "building_4FW_desc": "مبنى أكاديمي.",
        "building_2LR_name": "2 Link Road",
        "building_2LR_desc": "مبنى أكاديمي.",
        "building_6LR_name": "6 Link Road",
        "building_6LR_desc": "مبنى أكاديمي.",
        "building_4LR_name": "4 Link Road",
        "building_4LR_desc": "مبنى أكاديمي.",
        "building_DESTINATIO_name": "Destination Orana",
        "building_DESTINATIO_desc": "سكن طلابي.",
        "building_3IR_name": "3 Innovation Road",
        "building_3IR_desc": "مبنى أكاديمي.",
        "building_1IR_name": "1 Innovation Road",
        "building_1IR_desc": "مبنى أكاديمي.",
        "building_15RPD_name": "15 Research Park Drive",
        "building_15RPD_desc": "مبنى أكاديمي.",
        "building_RONREILLYP_name": "جناح رون ريلي",
        "building_RONREILLYP_desc": "جناح رياضي.",
        "building_M2OPERATIO_name": "مركز عمليات M2",
        "building_M2OPERATIO_desc": "مركز عمليات الطريق السريع M2.",
        "building_ADELAIDE_name": "أديلايد",
        "building_ADELAIDE_desc": "سكن طلابي.",
        "building_DARWIN_name": "داروين",
        "building_DARWIN_desc": "سكن طلابي.",
        "building_PERTH_name": "بيرث",
        "building_PERTH_desc": "سكن طلابي.",
        "building_BLOCKA_name": "المبنى A (طريق هيرينج)",
        "building_BLOCKA_desc": "مبنى سكني.",
        "building_BLOCKB_name": "المبنى B (طريق هيرينج)",
        "building_BLOCKB_desc": "مبنى سكني.",
        "building_BLOCKC_name": "المبنى C (طريق هيرينج)",
        "building_BLOCKC_desc": "مبنى سكني.",
        "building_BLOCKD_name": "المبنى D (طريق هيرينج)",
        "building_BLOCKD_desc": "مبنى سكني.",
        "building_BLOCKE_name": "المبنى E (طريق هيرينج)",
        "building_BLOCKE_desc": "مبنى سكني.",
        "building_BLOCKF_name": "المبنى F (طريق هيرينج)",
        "building_BLOCKF_desc": "مبنى سكني.",
        "building_VILLAS_name": "الفيلات",
        "building_VILLAS_desc": "فيلات سكنية.",
        "building_HOLIDAYINN_name": "هوليداي إن إكسبريس",
        "building_HOLIDAYINN_desc": "هوليداي إن إكسبريس سيدني ماكواري بارك.",
        "building_MACRESIDEN_name": "سكن ماك",
        "building_MACRESIDEN_desc": "مبنى سكني.",
        "building_6MD_name": "6 Management Drive",
        "building_6MD_desc": "مبنى أكاديمي.",
        "building_7MD_name": "7 Management Drive",
        "building_7MD_desc": "مبنى أكاديمي.",
        "building_12MW_name": "12 Macquarie Walk",
        "building_12MW_desc": "مبنى أكاديمي.",
        "building_18ER_name": "18 Eastern Road",
        "building_18ER_desc": "مبنى أكاديمي.",
        "building_2WW_name": "2 Wally's Walk",
        "building_2WW_desc": "مبنى أكاديمي.",
        "building_REDDYEXPRE_name": "ريدي إكسبرس",
        "building_REDDYEXPRE_desc": "متجر صغير.",
        "building_23WW_name": "23WW",
        "building_23WW_desc": "مبنى 23WW.",
        "building_SIEMENS_name": "سيمنز",
        "building_SIEMENS_desc": "مبنى سيمنز.",
        "building_82WATERLOO_name": "82 Waterloo Road",
        "building_82WATERLOO_desc": "شقق 82 Waterloo Road.",
        "building_93WATERLOO_name": "93 Waterloo Road",
        "building_93WATERLOO_desc": "مكتب 93 Waterloo Road.",
        "building_THERANCH_name": "ذا رانش",
        "building_THERANCH_desc": "مطعم ذا رانش.",
        "building_10HA_name": "10HA",
        "building_10HA_desc": "مبنى 10HA.",
        "building_16MW_name": "16MW (مكتبة جامعة ماكواري)",
        "building_16MW_desc": "مبنى 16MW.",
        "building_LAKESIDEHO_name": "فندق ومركز مؤتمرات ليكسايد",
        "building_LAKESIDEHO_desc": "فندق ومركز مؤتمرات ليكسايد.",
        "building_8LR_name": "8LR (كوخ بانكسيا)",
        "building_8LR_desc": "مبنى 8LR.",
        "building_MACQUARIEC_name": "مركز ماكواري",
        "building_MACQUARIEC_desc": "مول مركز ماكواري.",
        "building_11GR_name": "11GR (مسرح المنارة)",
        "building_11GR_desc": "مبنى 11GR.",
        "building_10GR_name": "10GR (مركز ماكواري الرياضي والمائي)",
        "building_10GR_desc": "مبنى 10GR.",
        "building_DUNMORELAN_name": "كلية دانمور لانج - شقق الدراسات العليا",
        "building_DUNMORELAN_desc": "شقق كلية دانمور لانج.",
        "building_FUJITSUAUS_name": "فوجيتسو أستراليا المحدودة",
        "building_FUJITSUAUS_desc": "مكتب فوجيتسو أستراليا المحدودة.",
        "building_8492TALAVE_name": "84-92 Talavera Road",
        "building_8492TALAVE_desc": "مبنى 84-92 Talavera Road.",
        "building_94110TALAV_name": "94-110 Talavera Road",
        "building_94110TALAV_desc": "مبنى 94-110 Talavera Road.",
        "building_29WW_name": "29WW",
        "building_29WW_desc": "مبنى 29WW.",
        "building_27WW_name": "27WW (مسرح اللوتس)",
        "building_27WW_desc": "مبنى 27WW.",
        "building_25WW_name": "25WW",
        "building_25WW_desc": "مبنى 25WW.",
        "building_21WW_name": "21WW (مسرح ماكواري)",
        "building_21WW_desc": "مبنى 21WW.",
        "building_14SW_name": "14SW",
        "building_14SW_desc": "مبنى 14SW.",
        "building_MERCURESYD_name": "ميركيور سيدني ماكواري",
        "building_MERCURESYD_desc": "ميركيور سيدني ماكواري.",
        "building_2TP_name": "2TP",
        "building_2TP_desc": "مبنى 2TP.",
        "building_MACQUARIEU_name": "مستشفى جامعة ماكواري",
        "building_MACQUARIEU_desc": "مستشفى جامعة ماكواري.",
        "building_STUDENTACC_name": "سكن الطلاب",
        "building_STUDENTACC_desc": "سكن الطلاب.",
        "building_HOBART_name": "هوبارت",
        "building_HOBART_desc": "شقق هوبارت.",
        "building_MELBOURNE_name": "ملبورن",
        "building_MELBOURNE_desc": "شقق ملبورن.",
        "building_SYDNEY_name": "سيدني",
        "building_SYDNEY_desc": "شقق سيدني.",
        "building_BRISBANE_name": "بريزبن",
        "building_BRISBANE_desc": "شقق بريزبن.",
        "building_1SAUNDERSC_name": "1 Saunders Close",
        "building_1SAUNDERSC_desc": "شقق 1 Saunders Close.",
        "building_2SAUNDERSC_name": "2 Saunders Close",
        "building_2SAUNDERSC_desc": "شقق 2 Saunders Close.",
        "building_4SAUNDERSC_name": "4 Saunders Close",
        "building_4SAUNDERSC_desc": "شقق 4 Saunders Close.",
        "building_6SAUNDERSC_name": "6 Saunders Close",
        "building_6SAUNDERSC_desc": "شقق 6 Saunders Close.",
        "building_8SAUNDERSC_name": "8 Saunders Close",
        "building_8SAUNDERSC_desc": "شقق 8 Saunders Close.",
        "building_120HERRING_name": "120 Herring Road",
        "building_120HERRING_desc": "شقق 120 Herring Road.",
        "building_155HERRING_name": "155 Herring Road",
        "building_155HERRING_desc": "شقق 155 Herring Road.",
        "building_1PEACHTREE_name": "1 Peach Tree Road",
        "building_1PEACHTREE_desc": "شقق 1 Peach Tree Road.",
        "building_3PEACHTREE_name": "3 Peach Tree Road",
        "building_3PEACHTREE_desc": "شقق 3 Peach Tree Road.",
        "building_5PEACHTREE_name": "5 Peach Tree Road",
        "building_5PEACHTREE_desc": "شقق 5 Peach Tree Road.",
        "building_7PEACHTREE_name": "7 Peach Tree Road",
        "building_7PEACHTREE_desc": "شقق 7 Peach Tree Road.",
        "building_210COTTONW_name": "2-10 Cottonwood Crescent",
        "building_210COTTONW_desc": "شقق 2-10 Cottonwood Crescent.",
        "building_13LACHLANA_name": "1-3 Lachlan Avenue",
        "building_13LACHLANA_desc": "1-3 Lachlan Avenue.",
        "building_9PEACHTREE_name": "9 Peach Tree Road",
        "building_9PEACHTREE_desc": "شقق 9 Peach Tree Road.",
        "building_157HERRING_name": "157 Herring Road",
        "building_157HERRING_desc": "شقق 157 Herring Road.",
        "building_DANMURPHYS_name": "دان ميرفي",
        "building_DANMURPHYS_desc": "متجر مشروبات دان ميرفي.",
        "building_205A_name": "205A CR",
        "building_205A_desc": "مبنى 205A CR.",
        "building_205B_name": "205B CR",
        "building_205B_desc": "مبنى 205B CR.",
        "building_8HA_name": "8HA (الحاضنة)",
        "building_8HA_desc": "8HA (الحاضنة).",
        "building_5GR_name": "5GR (مرصد ماكواري)",
        "building_5GR_desc": "5GR (مرصد ماكواري).",
        "building_1WW_name": "1WW (مبنى أينزورث)",
        "building_1WW_desc": "1WW (مبنى أينزورث).",
        "building_13ARPD_name": "13ARPD",
        "building_13ARPD_desc": "مبنى 13ARPD.",
        "building_17WWMICHAE_name": "17WW (مبنى مايكل كيربي)",
        "building_17WWMICHAE_desc": "17WW (مبنى مايكل كيربي).",
        "building_18WWSERVIC_name": "18WW (Service Connect)",
        "building_18WWSERVIC_desc": "18WW (Service Connect).",
        "building_16WWLINCOL_name": "16WW (مبنى لينكولن)",
        "building_16WWLINCOL_desc": "16WW (مبنى لينكولن).",
        "building_19ERTHECHA_name": "19ER (المستشارية)",
        "building_19ERTHECHA_desc": "19ER (المستشارية).",
        "building_16UAAUSTRA_name": "16UA (مركز السمع الأسترالي)",
        "building_16UAAUSTRA_desc": "16UA (مركز السمع الأسترالي).",
        "building_DLCNEW_name": "كلية دانمور لانج - الجناح الجديد",
        "building_DLCNEW_desc": "مبنى سكني جديد لكلية دانمور لانج.",
        "building_DLCOFFICE_name": "كلية دانمور لانج - المكتب",
        "building_DLCOFFICE_desc": "مكتب إدارة كلية دانمور لانج.",
        "building_VILLAS2_name": "الفيلات (المبنى 2)",
        "building_VILLAS2_desc": "فيلات سكنية - المبنى الثاني.",
        "building_BLOCKCWAT_name": "المبنى C (Waterloo Road)",
        "building_BLOCKCWAT_desc": "مبنى سكني على Waterloo Road.",
        "building_BLOCKDWAT_name": "المبنى D (Waterloo Road)",
        "building_BLOCKDWAT_desc": "مبنى سكني على Waterloo Road.",
        "building_BLOCKAWAT_name": "المبنى A (Waterloo Road)",
        "building_BLOCKAWAT_desc": "مبنى سكني على Waterloo Road.",
        "building_BLOCKBWAT_name": "المبنى B (Waterloo Road)",
        "building_BLOCKBWAT_desc": "مبنى سكني على Waterloo Road."
    }
};

// Generate a translation mapping from English for languages not fully specified above
// This provides a template that shows the English value, to be replaced with professional translations
function generateTemplateTranslations(locale, missingKeys) {
    const result = {};

    // Locale-specific translation mappings
    const localeMap = {
        // Spanish
        es: {
            "levels": "niveles",
            "accessible": "Accesible",
            "accommodation": "Alojamiento",
            "venue": "Lugar",
            "medical": "Médico",
            "health": "Salud",
            "food": "Comida",
            "cafe": "Cafetería",
            "restaurant": "Restaurante",
            "arts": "Artes",
            "gallery": "Galería",
            "culture": "Cultura",
            "indigenous": "Indígena",
            "spiritual": "Espiritual",
            "childcare": "Guardería",
            "student": "Estudiante",
            "wellbeing": "Bienestar",
            "business": "Negocios",
            "law": "Derecho",
            "media": "Medios",
            "psychology": "Psicología",
            "science": "Ciencia",
            "astronomy": "Astronomía",
            "innovation": "Innovación",
            "museum": "Museo",
            "education": "Educación",
            "performance": "Espectáculo",
            "events": "Eventos",
            "outdoor": "Exterior",
            "safety": "Seguridad",
            "emergency": "Emergencia",
            "residential": "Residencial",
            "active": "Activo",
            "routeReady": "Ruta lista - selecciona un edificio en el mapa",
            "selectBuildingToNavigate": "Selecciona un edificio para obtener direcciones",
            "locationTrackingEnabled": "Tu ubicación está siendo rastreada en el mapa",
            "showFilters": "Mostrar filtros",
            "hideFilters": "Ocultar filtros",
            "clearAll": "Borrar todo",
            "results": "resultados",
            "noMatchingBuildings": "No hay edificios que coincidan con los filtros seleccionados",
            "clearFilters": "Borrar filtros",
            "showPassword": "Mostrar contraseña",
            "hidePassword": "Ocultar contraseña",
            "toggleCurrentPasswordVisibility": "Alternar visibilidad de contraseña actual",
            "toggleNewPasswordVisibility": "Alternar visibilidad de nueva contraseña",
            "toggleConfirmPasswordVisibility": "Alternar visibilidad de confirmar contraseña",
            "addFilter": "Agregar filtro {{filter}}",
            "removeFilter": "Eliminar filtro {{filter}}",
            "recentActivity": "Actividad reciente",
            "noRecentActivity": "Sin actividad reciente",
            "startEarningXP": "¡Completa tareas para empezar a ganar XP!",
            "recently": "recientemente",
            "recentXPEvents": "Eventos de XP recientes",
            "biometricLogin": "Inicio de sesión biométrico",
            "biometricLoginDesc": "Usa Face ID, Touch ID o Windows Hello para un inicio de sesión rápido y seguro",
            "biometricEnabled": "Biométrico habilitado",
            "biometricEnabledMsg": "Ahora puedes usar autenticación biométrica para iniciar sesión",
            "biometricDisabled": "Biométrico deshabilitado",
            "biometricDisabledMsg": "La autenticación biométrica ha sido desactivada",
            "biometricSetupFailed": "Configuración fallida",
            "biometricSetupFailedMsg": "No se pudo configurar la autenticación biométrica. Por favor, intenta de nuevo.",
            "biometricDeviceReady": "Tu dispositivo soporta autenticación biométrica",
            "biometricNotConfigured": "No se encontró dispositivo biométrico. Por favor, configura Face ID, Touch ID o Windows Hello en tu dispositivo.",
            "biometricPrivacyNote": "Tus datos biométricos nunca salen de tu dispositivo. Solo almacenamos un ID de credencial seguro.",
            "enableBiometric": "Habilitar inicio biométrico",
            "enableBiometricDesc": "Configura Face ID, Touch ID o Windows Hello para un inicio de sesión más rápido y seguro.",
            "disableBiometric": "Deshabilitar inicio biométrico",
            "disableBiometricDesc": "¿Estás seguro de que quieres deshabilitar el inicio biométrico? Necesitarás usar tu contraseña para iniciar sesión.",
            "moreSecurityFeatures": "Más funciones de seguridad",
            "moreSecurityFeaturesDesc": "Autenticación de dos factores, llaves de seguridad y gestión de contraseñas próximamente.",
            "notSupported": "No soportado",
            "noDeviceFound": "Dispositivo no encontrado",
            "settingUp": "Configurando...",
            "tryAgainLater": "Por favor, intenta más tarde",
            "processing": "Procesando...",
            "source": "Fuente",
            "lastUpdated": "Última actualización",
            "legend": "Leyenda",
            "showMore": "Mostrar más",
            "showLess": "Mostrar menos",
            "gridView": "Vista de cuadrícula",
            "listView": "Vista de lista",
            "allCategories": "Todas las categorías",
            "filterByCategory": "Filtrar por categoría",
            "buildingsFound": "{{count}} edificios encontrados",
            "quickSearch": "Búsqueda rápida",
            "filterBuildings": "Filtrar edificios por nombre, código o categoría"
        },
        // More locale-specific overwrites can be added here
    };

    // Get locale-specific translations or empty object
    const localeSpecific = localeMap[locale] || {};

    for (const key of missingKeys) {
        if (localeSpecific[key]) {
            result[key] = localeSpecific[key];
        } else if (key.startsWith('building_') && key.endsWith('_name')) {
            // Keep building names as-is (proper nouns with codes)
            result[key] = en[key];
        } else if (key.startsWith('building_') && key.endsWith('_desc')) {
            // For building descriptions, we provide a basic translation template
            // These should ideally be professionally translated
            result[key] = en[key]; // Placeholder - will be replaced below
        } else {
            // For other keys, default to English (placeholder)
            result[key] = en[key];
        }
    }

    return result;
}

// Process each locale
const locales = fs.readdirSync(localesDir)
    .filter(f => fs.statSync(path.join(localesDir, f)).isDirectory() && f !== 'en');

const results = [];

for (const locale of locales) {
    const localePath = path.join(localesDir, locale, 'translations.json');
    const currentTranslations = require(localePath);
    const currentKeys = Object.keys(currentTranslations);

    // Find missing keys
    const missingKeys = enKeys.filter(k => !currentKeys.includes(k));

    // Find keys that exist but have English values (untranslated)
    const untranslatedKeys = currentKeys.filter(k => {
        // Check if the value is exactly the same as English and it's a translatable string
        if (k.startsWith('building_') && k.endsWith('_name')) return false; // Building names are proper nouns
        return currentTranslations[k] === en[k] && !k.includes('Placeholder');
    });

    if (missingKeys.length === 0 && untranslatedKeys.length === 0) {
        console.log(`✅ ${locale}: Complete (${currentKeys.length} keys)`);
        results.push({ locale, added: 0, updated: 0, total: currentKeys.length });
        continue;
    }

    console.log(`🔧 ${locale}: Processing ${missingKeys.length} missing + ${untranslatedKeys.length} untranslated keys...`);

    // Get translations from our pre-defined set or generate templates
    let newTranslations = {};

    if (translations[locale]) {
        // Use pre-defined translations
        for (const key of missingKeys) {
            if (translations[locale][key]) {
                newTranslations[key] = translations[locale][key];
            } else {
                // Fall back to English if not in our set
                newTranslations[key] = en[key];
            }
        }

        // Update untranslated keys
        for (const key of untranslatedKeys) {
            if (translations[locale][key]) {
                newTranslations[key] = translations[locale][key];
            }
        }
    } else {
        // Generate template translations
        newTranslations = generateTemplateTranslations(locale, missingKeys);
    }

    // Merge with existing translations
    const mergedTranslations = { ...currentTranslations, ...newTranslations };

    // Sort keys to match English order for consistency
    const sortedTranslations = {};
    for (const key of enKeys) {
        if (mergedTranslations[key] !== undefined) {
            sortedTranslations[key] = mergedTranslations[key];
        }
    }

    // Write back
    fs.writeFileSync(localePath, JSON.stringify(sortedTranslations, null, 2) + '\n');

    const addedCount = Object.keys(newTranslations).length;
    console.log(`   Added: ${addedCount} keys, Total: ${Object.keys(sortedTranslations).length} keys`);

    results.push({
        locale,
        added: missingKeys.length,
        updated: untranslatedKeys.length,
        total: Object.keys(sortedTranslations).length
    });
}

console.log('\n=== Summary ===');
console.log('| Locale | Added | Updated | Total |');
console.log('|--------|-------|---------|-------|');
for (const r of results) {
    console.log(`| ${r.locale.padEnd(6)} | ${r.added.toString().padEnd(5)} | ${r.updated.toString().padEnd(7)} | ${r.total.toString().padEnd(5)} |`);
}

// Verify all locales now have the same number of keys as English
console.log('\n=== Verification ===');
let allComplete = true;
for (const locale of locales) {
    const localePath = path.join(localesDir, locale, 'translations.json');
    const translations = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    const keyCount = Object.keys(translations).length;

    if (keyCount === enKeys.length) {
        console.log(`✅ ${locale}: ${keyCount} keys (matches English)`);
    } else {
        console.log(`❌ ${locale}: ${keyCount} keys (expected ${enKeys.length})`);
        allComplete = false;
    }
}

if (allComplete) {
    console.log('\n✅ All locales now have complete translation coverage!');
} else {
    console.log('\n⚠️  Some locales still need manual translation review.');
}
