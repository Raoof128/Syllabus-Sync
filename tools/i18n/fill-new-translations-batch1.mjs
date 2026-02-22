import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

const BATCH_1 = {
  ar: {
    settings_about: "حول",
    security: "الأمان",
    linkExpiredOrInvalid: "الرابط منتهي الصلاحية أو غير صالح",
    requestNewResetLink: "طلب رابط جديد لإعادة التعيين",
    verifyingRequest: "جاري التحقق من طلبك...",
    redirecting: "جاري إعادة التوجيه...",
    loadingContentPleaseWait: "جاري تحميل المحتوى، يرجى الانتظار",
    youAreOfflineDesc:
      "يتطلب Syllabus Sync اتصالاً بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.",
    errorProfileLoad:
      "تعذر تحميل إعدادات ملفك الشخصي. تم تسجيل ذلك لفريق الهندسة لدينا.",
    passkeysBiometricLogin: "مفاتيح المرور وتسجيل الدخول البيومتري",
    passkeySigninDesc:
      "سجل دخولك بأمان باستخدام بصمة الإصبع أو التعرف على الوجه أو مفتاح الأمان بجهازك.",
    registeredDevicesAndKeys: "الأجهزة والمفاتيح المسجلة",
    addKey: "إضافة مفتاح",
    announcements: "الإعلانات",
    thisWeek: "هذا الأسبوع",
    totalEvents: "إجمالي الأحداث",
    freeFood: "طعام مجاني",
    eventsOverview: "نظرة عامة على الأحداث الجارية في الحرم الجامعي",
    importantUpdates: "تحديثات وأخبار هامة من الجامعة",
    filterByCategoryDesc: "انقر على الفئات أدناه لتصفية الأحداث حسب النوع",
    strength_veryWeak: "ضعيفة جداً",
    strength_weak: "ضعيفة",
    strength_fair: "متوسطة",
    strength_strong: "قوية",
    strength_veryStrong: "قوية جداً",
  },
  zh: {
    settings_about: "关于",
    security: "安全",
    linkExpiredOrInvalid: "链接已过期或无效",
    requestNewResetLink: "请求新的重置链接",
    verifyingRequest: "正在验证您的请求...",
    redirecting: "正在重定向...",
    loadingContentPleaseWait: "正在加载内容，请稍候",
    youAreOfflineDesc:
      "Syllabus Sync 需要互联网连接。请检查您的网络连接并重试。",
    errorProfileLoad:
      "无法加载您的个人资料设置。此问题已报告给我们的工程团队。",
    passkeysBiometricLogin: "通行密钥与生物识别登录",
    passkeySigninDesc: "使用设备的指纹、面部识别或安全密钥安全登录。",
    registeredDevicesAndKeys: "已注册的设备与密钥",
    addKey: "添加密钥",
    announcements: "公告",
    thisWeek: "本周",
    totalEvents: "活动总数",
    freeFood: "免费食物",
    eventsOverview: "校园内发生的活动概览",
    importantUpdates: "来自大学的重要更新和新闻",
    filterByCategoryDesc: "点击下方类别按类型过滤活动",
    strength_veryWeak: "非常弱",
    strength_weak: "弱",
    strength_fair: "一般",
    strength_strong: "强",
    strength_veryStrong: "非常强",
  },
  es: {
    settings_about: "Acerca de",
    security: "Seguridad",
    linkExpiredOrInvalid: "Enlace caducado o no válido",
    requestNewResetLink: "Solicitar nuevo enlace de restablecimiento",
    verifyingRequest: "Verificando su solicitud...",
    redirecting: "Redirigiendo...",
    loadingContentPleaseWait: "Cargando contenido, por favor espere",
    youAreOfflineDesc:
      "Syllabus Sync requiere una conexión a Internet. Por favor, compruebe su conexión e inténtelo de nuevo.",
    errorProfileLoad:
      "No hemos podido cargar la configuración de su perfil. Esto ha sido registrado para nuestro equipo de ingeniería.",
    passkeysBiometricLogin: "Llaves de acceso y acceso biométrico",
    passkeySigninDesc:
      "Inicie sesión de forma segura utilizando la huella digital, el reconocimiento facial o una llave de seguridad de su dispositivo.",
    registeredDevicesAndKeys: "Dispositivos y llaves registrados",
    addKey: "Añadir llave",
    announcements: "Anuncios",
    thisWeek: "Esta semana",
    totalEvents: "Eventos totales",
    freeFood: "Comida gratis",
    eventsOverview: "Resumen de los eventos que ocurren en el campus",
    importantUpdates:
      "Actualizaciones y noticias importantes de la universidad",
    filterByCategoryDesc:
      "Haga clic en las categorías de abajo para filtrar eventos por tipo",
    strength_veryWeak: "Muy débil",
    strength_weak: "Débil",
    strength_fair: "Aceptable",
    strength_strong: "Fuerte",
    strength_veryStrong: "Muy fuerte",
  },
  fr: {
    settings_about: "À propos",
    security: "Sécurité",
    linkExpiredOrInvalid: "Lien expiré ou invalide",
    requestNewResetLink: "Demander un nouveau lien de réinitialisation",
    verifyingRequest: "Vérification de votre demande...",
    redirecting: "Redirection...",
    loadingContentPleaseWait: "Chargement du contenu, veuillez patienter",
    youAreOfflineDesc:
      "Syllabus Sync nécessite une connexion Internet. Veuillez vérifier votre connexion et réessayer.",
    errorProfileLoad:
      "Nous n'avons pas pu charger les paramètres de votre profil. Cela a été signalé à notre équipe d'ingénierie.",
    passkeysBiometricLogin: "Clés d'accès et connexion biométrique",
    passkeySigninDesc:
      "Connectez-vous en toute sécurité en utilisant l'empreinte digitale, la reconnaissance faciale ou une clé de sécurité de votre appareil.",
    registeredDevicesAndKeys: "Appareils et clés enregistrés",
    addKey: "Ajouter une clé",
    announcements: "Annonces",
    thisWeek: "Cette semaine",
    totalEvents: "Total des événements",
    freeFood: "Nourriture gratuite",
    eventsOverview: "Aperçu des événements se déroulant sur le campus",
    importantUpdates: "Mises à jour et nouvelles importantes de l'université",
    filterByCategoryDesc:
      "Cliquez sur les catégories ci-dessous pour filtrer les événements par type",
    strength_veryWeak: "Très faible",
    strength_weak: "Faible",
    strength_fair: "Moyen",
    strength_strong: "Fort",
    strength_veryStrong: "Très fort",
  },
  hi: {
    settings_about: "बारे में",
    security: "सुरक्षा",
    linkExpiredOrInvalid: "लिंक समाप्त हो गया या अमान्य है",
    requestNewResetLink: "नया रीसेट लिंक अनुरोध करें",
    verifyingRequest: "आपके अनुरोध की पुष्टि की जा रही है...",
    redirecting: "रीडायरेक्ट किया जा रहा है...",
    loadingContentPleaseWait: "सामग्री लोड हो रही है, कृपया प्रतीक्षा करें",
    youAreOfflineDesc:
      "Syllabus Sync के लिए इंटरनेट कनेक्शन आवश्यक है। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
    errorProfileLoad:
      "हम आपकी प्रोफ़ाइल सेटिंग्स लोड नहीं कर सके। इसे हमारी इंजीनियरिंग टीम के लिए लॉग कर दिया गया है।",
    passkeysBiometricLogin: "पासकी और बायोमेट्रिक लॉगिन",
    passkeySigninDesc:
      "अपने डिवाइस के फिंगरप्रिंट, चेहरा पहचान या सुरक्षा कुंजी का उपयोग करके सुरक्षित रूप से साइन इन करें।",
    registeredDevicesAndKeys: "पंजीकृत डिवाइस और कुंजियाँ",
    addKey: "कुंजी जोड़ें",
    announcements: "घोषणाएं",
    thisWeek: "इस सप्ताह",
    totalEvents: "कुल कार्यक्रम",
    freeFood: "मुफ्त भोजन",
    eventsOverview: "कैंपस में होने वाले कार्यक्रमों का अवलोकन",
    importantUpdates: "विश्वविद्यालय से महत्वपूर्ण अपडेट और समाचार",
    filterByCategoryDesc:
      "प्रकार के आधार पर कार्यक्रमों को फ़िल्टर करने के लिए नीचे दी गई श्रेणियों पर क्लिक करें",
    strength_veryWeak: "बहुत कमजोर",
    strength_weak: "कमजोर",
    strength_fair: "ठीक-ठाक",
    strength_strong: "मजबूत",
    strength_veryStrong: "बहुत मजबूत",
  },
  ru: {
    settings_about: "О приложении",
    security: "Безопасность",
    linkExpiredOrInvalid: "Ссылка истекла или недействительна",
    requestNewResetLink: "Запросить новую ссылку для сброса",
    verifyingRequest: "Проверка вашего запроса...",
    redirecting: "Перенаправление...",
    loadingContentPleaseWait: "Загрузка контента, пожалуйста, подождите",
    youAreOfflineDesc:
      "Syllabus Sync требуется подключение к интернету. Пожалуйста, проверьте соединение и попробуйте снова.",
    errorProfileLoad:
      "Не удалось загрузить настройки вашего профиля. Информация об этом была передана нашей инженерной команде.",
    passkeysBiometricLogin: "Ключи доступа и биометрический вход",
    passkeySigninDesc:
      "Безопасный вход с помощью отпечатка пальца, распознавания лица или ключа безопасности вашего устройства.",
    registeredDevicesAndKeys: "Зарегистрированные устройства и ключи",
    addKey: "Добавить ключ",
    announcements: "Объявления",
    thisWeek: "На этой неделе",
    totalEvents: "Всего событий",
    freeFood: "Бесплатная еда",
    eventsOverview: "Обзор событий в кампусе",
    importantUpdates: "Важные обновления и новости университета",
    filterByCategoryDesc:
      "Нажмите на категории ниже, чтобы отфильтровать события по типу",
    strength_veryWeak: "Очень слабый",
    strength_weak: "Слабый",
    strength_fair: "Средний",
    strength_strong: "Надежный",
    strength_veryStrong: "Очень надежный",
  },
  ja: {
    settings_about: "このアプリについて",
    security: "セキュリティ",
    linkExpiredOrInvalid: "リンクの期限が切れているか無効です",
    requestNewResetLink: "新しいリセットリンクをリクエストする",
    verifyingRequest: "リクエストを検証中...",
    redirecting: "リダイレクト中...",
    loadingContentPleaseWait: "コンテンツを読み込み中、しばらくお待ちください",
    youAreOfflineDesc:
      "Syllabus Syncにはインターネット接続が必要です。接続を確認して再試行してください。",
    errorProfileLoad:
      "プロファイル設定を読み込めませんでした。この問題はエンジニアリングチームに報告されました。",
    passkeysBiometricLogin: "パスキーと生体認証ログイン",
    passkeySigninDesc:
      "デバイスの指紋、顔認証、またはセキュリティキーを使用して安全にサインインします。",
    registeredDevicesAndKeys: "登録済みのデバイスとキー",
    addKey: "キーを追加",
    announcements: "お知らせ",
    thisWeek: "今週",
    totalEvents: "合計イベント数",
    freeFood: "無料の食事",
    eventsOverview: "学内で開催されるイベントの概要",
    importantUpdates: "大学からの重要な更新とお知らせ",
    filterByCategoryDesc:
      "下のカテゴリをクリックしてイベントをタイプ別にフィルタリングします",
    strength_veryWeak: "非常に弱い",
    strength_weak: "弱い",
    strength_fair: "普通",
    strength_strong: "強い",
    strength_veryStrong: "非常に強い",
  },
  ko: {
    settings_about: "정보",
    security: "보안",
    linkExpiredOrInvalid: "링크가 만료되었거나 유효하지 않습니다",
    requestNewResetLink: "새 비밀번호 재설정 링크 요청",
    verifyingRequest: "요청 확인 중...",
    redirecting: "리디렉션 중...",
    loadingContentPleaseWait:
      "콘텐츠를 불러오는 중입니다. 잠시만 기다려 주세요",
    youAreOfflineDesc:
      "Syllabus Sync를 사용하려면 인터넷 연결이 필요합니다. 연결을 확인하고 다시 시도하세요.",
    errorProfileLoad:
      "프로필 설정을 불러오지 못했습니다. 이 문제는 엔지니어링 팀에 보고되었습니다.",
    passkeysBiometricLogin: "패스키 및 생체 인식 로그인",
    passkeySigninDesc:
      "기기의 지문, 얼굴 인식 또는 보안 키를 사용하여 안전하게 로그인하세요.",
    registeredDevicesAndKeys: "등록된 기기 및 키",
    addKey: "키 추가",
    announcements: "공지사항",
    thisWeek: "이번 주",
    totalEvents: "총 이벤트",
    freeFood: "무료 급식",
    eventsOverview: "캠퍼스 내 이벤트 개요",
    importantUpdates: "대학의 주요 업데이트 및 뉴스",
    filterByCategoryDesc:
      "아래 카테고리를 클릭하여 유형별로 이벤트를 필터링하세요",
    strength_veryWeak: "매우 약함",
    strength_weak: "약함",
    strength_fair: "보통",
    strength_strong: "강함",
    strength_veryStrong: "매우 강함",
  },
  de: {
    settings_about: "Über",
    security: "Sicherheit",
    linkExpiredOrInvalid: "Link abgelaufen oder ungültig",
    requestNewResetLink: "Neuen Reset-Link anfordern",
    verifyingRequest: "Anfrage wird überprüft...",
    redirecting: "Weiterleitung...",
    loadingContentPleaseWait: "Inhalt wird geladen, bitte warten",
    youAreOfflineDesc:
      "Syllabus Sync erfordert eine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
    errorProfileLoad:
      "Ihre Profileinstellungen konnten nicht geladen werden. Dies wurde an unser Technikteam gemeldet.",
    passkeysBiometricLogin: "Passkeys & biometrische Anmeldung",
    passkeySigninDesc:
      "Melden Sie sich sicher mit dem Fingerabdruck, der Gesichtserkennung oder einem Sicherheitsschlüssel Ihres Geräts an.",
    registeredDevicesAndKeys: "Registrierte Geräte & Schlüssel",
    addKey: "Schlüssel hinzufügen",
    announcements: "Ankündigungen",
    thisWeek: "Diese Woche",
    totalEvents: "Events insgesamt",
    freeFood: "Kostenloses Essen",
    eventsOverview: "Übersicht über Veranstaltungen auf dem Campus",
    importantUpdates: "Wichtige Updates und Neuigkeiten der Universität",
    filterByCategoryDesc:
      "Klicken Sie auf die untenstehenden Kategorien, um Events nach Typ zu filtern",
    strength_veryWeak: "Sehr schwach",
    strength_weak: "Schwach",
    strength_fair: "Mittel",
    strength_strong: "Stark",
    strength_veryStrong: "Sehr stark",
  },
  it: {
    settings_about: "Informazioni",
    security: "Sicurezza",
    linkExpiredOrInvalid: "Link scaduto o non valido",
    requestNewResetLink: "Richiedi un nuovo link di ripristino",
    verifyingRequest: "Verifica della richiesta in corso...",
    redirecting: "Reindirizzamento...",
    loadingContentPleaseWait: "Caricamento dei contenuti, attendere prego",
    youAreOfflineDesc:
      "Syllabus Sync richiede una connessione a Internet. Controlla la tua connessione e riprova.",
    errorProfileLoad:
      "Impossibile caricare le impostazioni del profilo. L'errore è stato segnalato al nostro team tecnico.",
    passkeysBiometricLogin: "Passkey e accesso biometrico",
    passkeySigninDesc:
      "Accedi in modo sicuro utilizzando l'impronta digitale, il riconoscimento facciale o una chiave di sicurezza del dispositivo.",
    registeredDevicesAndKeys: "Dispositivi e chiavi registrati",
    addKey: "Aggiungi chiave",
    announcements: "Annunci",
    thisWeek: "Questa settimana",
    totalEvents: "Eventi totali",
    freeFood: "Cibo gratis",
    eventsOverview: "Panoramica degli eventi nel campus",
    importantUpdates: "Aggiornamenti importanti e notizie dall'università",
    filterByCategoryDesc:
      "Clicca sulle categorie sottostanti per filtrare gli eventi per tipo",
    strength_veryWeak: "Molto debole",
    strength_weak: "Debole",
    strength_fair: "Discreta",
    strength_strong: "Forte",
    strength_veryStrong: "Molto forte",
  },
  pt: {
    settings_about: "Sobre",
    security: "Segurança",
    linkExpiredOrInvalid: "Link expirado ou inválido",
    requestNewResetLink: "Solicitar novo link de redefinição",
    verifyingRequest: "A verificar o seu pedido...",
    redirecting: "A redirecionar...",
    loadingContentPleaseWait: "A carregar conteúdo, por favor aguarde",
    youAreOfflineDesc:
      "O Syllabus Sync requer uma ligação à Internet. Verifique a sua ligação e tente novamente.",
    errorProfileLoad:
      "Não foi possível carregar as definições do seu perfil. Isto foi reportado à nossa equipa de engenharia.",
    passkeysBiometricLogin: "Passkeys e login biométrico",
    passkeySigninDesc:
      "Inicie sessão de forma segura utilizando a impressão digital, o reconhecimento facial ou uma chave de segurança do seu dispositivo.",
    registeredDevicesAndKeys: "Dispositivos e chaves registados",
    addKey: "Adicionar chave",
    announcements: "Anúncios",
    thisWeek: "Esta semana",
    totalEvents: "Total de eventos",
    freeFood: "Comida grátis",
    eventsOverview: "Visão geral dos eventos no campus",
    importantUpdates: "Atualizações importantes e notícias da universidade",
    filterByCategoryDesc:
      "Clique nas categorias abaixo para filtrar os eventos por tipo",
    strength_veryWeak: "Muito fraca",
    strength_weak: "Fraca",
    strength_fair: "Razoável",
    strength_strong: "Forte",
    strength_veryStrong: "Muito forte",
  },
};

async function main() {
  for (const locale of Object.keys(BATCH_1)) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, "utf8");
    const json = JSON.parse(content);

    const translations = BATCH_1[locale];
    for (const [key, value] of Object.entries(translations)) {
      json[key] = value;
    }

    await fs.writeFile(localeFilePath, JSON.stringify(json, null, 2));
    console.log(`Updated Batch 1 translations for ${locale}`);
  }
}

main().catch(console.error);
