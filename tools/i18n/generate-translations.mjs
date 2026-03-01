/**
 * Translation Generator
 *
 * Generates translations for all untranslated keys across all locales.
 * Building names (building_*) are kept in English as proper nouns.
 * Uses a translation dictionary approach for accuracy.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en', 'translations.json'), 'utf8'));
const enKeys = Object.keys(en);

// Keys that should NOT be translated (proper nouns, technical strings)
const SKIP_TRANSLATION = (key) => {
  if (key.startsWith('building_')) return true;
  // Very short strings that are universal (e.g. "GPS", "OK", "MQ")
  if (en[key].length <= 2) return true;
  return false;
};

// Common translation dictionaries for each locale
// These cover the most frequent UI patterns
const TRANSLATIONS = {
  ar: {
    todoList: 'قائمة المهام',
    todos: 'قائمة المهام',
    addTodo: 'إضافة مهمة',
    noTodos: 'لا توجد مهام',
    addTodosInCalendar: 'أضف المهام في تبويب التقويم',
    todosSection: 'قسم المهام',
    myEvents: 'فعالياتي',
    noEventsYet: 'لا توجد فعاليات بعد',
    addEventsInCalendar: 'أضف الفعاليات في تبويب التقويم',
    today: 'اليوم',
    backToToday: 'العودة إلى اليوم',
    completedToday: 'مكتمل اليوم',
    noCompletedToday: 'لم يكتمل شيء بعد',
    completeTasksHint: 'أكمل المهام لتراها هنا',
    addTodoPlaceholder: 'أضف مهمة جديدة...',
    priorityHigh: 'عالية',
    priorityMedium: 'متوسطة',
    priorityLow: 'منخفضة',
    noTodosYet: 'لا توجد مهام بعد',
    noTodosYetDesc: 'أضف أول مهمة أعلاه للبدء!',
    pendingTasks: 'قيد الانتظار',
    allTasksComplete: 'تم إكمال جميع المهام!',
    deleteTodoConfirm: 'حذف المهمة؟',
    deleteTodoConfirmDesc: 'لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد أنك تريد حذف هذه المهمة؟',
    editTodo: 'تعديل المهمة',
    taskTitle: 'عنوان المهمة',
    enterTaskTitle: 'أدخل عنوان المهمة...',
    selectDueDate: 'اختر تاريخ الاستحقاق',
    selectDueTime: 'اختر وقت الاستحقاق',
    clearDueDate: 'مسح تاريخ الاستحقاق',
    dueDateTime: 'تاريخ ووقت الاستحقاق',
    dueToday: 'مستحق اليوم',
    clear: 'مسح',
    status: 'الحالة',
    date: 'التاريخ',
    location: 'الموقع',
    navigation: 'التنقل',
    loading: 'جارٍ التحميل...',
    save: 'حفظ',
    share: 'مشاركة',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    search: 'بحث',
    filter: 'تصفية',
    view: 'عرض',
    home: 'الرئيسية',
    calendar: 'التقويم',
    feed: 'الفعاليات',
    map: 'خريطة الحرم',
    settings: 'الإعدادات',
    manageProfiles: 'إدارة الملف الشخصي',
    places: 'الأماكن',
    directions: 'الاتجاهات',
    backToMap: 'العودة إلى الخريطة',
    googleMaps: 'خرائط جوجل',
    openInGoogleMaps: 'فتح في خرائط جوجل',
    navigateOnCampus: 'التنقل في خريطة الحرم',
    navigateToGoogleMaps: 'الانتقال إلى خرائط جوجل',
    mapViewToggle: 'تبديل عرض الخريطة',
    navigateToMQ: 'الانتقال إلى جامعة ماكواري',
    googleMapsIframeLabel: 'خرائط جوجل تعرض حرم جامعة ماكواري',
    directionsIframeLabel: 'الاتجاهات إلى جامعة ماكواري',
    failedToStartSetup: 'فشل بدء الإعداد. يرجى المحاولة مرة أخرى.',
    verificationFailedCheckCode: 'فشل التحقق. يرجى التحقق من الرمز.',
    invalidCodeTryAgain: 'رمز غير صالح. يرجى المحاولة مرة أخرى.',
    twoFactorEnabled: 'تم تفعيل المصادقة الثنائية!',
    networkErrorCheckConnection: 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
    failedToDisable2FA: 'فشل تعطيل المصادقة الثنائية',
    twoFactorDisabled: 'تم تعطيل المصادقة الثنائية.',
    authenticatorAppsList: 'Google Authenticator أو Authy أو Microsoft Authenticator',
    totpSecurityNote:
      'لأسباب أمنية، يعمل رمزك المكون من 6 أرقام كتوقيع رياضي نشط يتجدد كل 30 ثانية. بمجرد استخدامه، يصبح غير صالح نهائيًا لمنع هجمات الإعادة.',
    typeCodeManually: 'اكتب هذا الرمز في تطبيقك لربطه يدويًا.',
    passkeysNotSupported: 'مفاتيح المرور غير مدعومة على هذا الجهاز.',
    invalidCode: 'رمز غير صالح',
    failedToDisableSms2FA: 'فشل تعطيل مصادقة الرسائل القصيرة',
    sectionError: 'خطأ في القسم',
    errorInSection: 'خطأ في {{section}}',
    sectionErrorMessage:
      'حدث خطأ أثناء تحميل هذا القسم. يمكنك المحاولة مرة أخرى أو التحقق من الإعدادات الأخرى.',
    unitNotFoundHint: 'لا تجد وحدتك؟ أدخل الرمز والاسم يدويًا أدناه.',
    clickToChangeLocation: '(انقر لتغيير الموقع)',
  },
  es: {
    navigation: 'Navegación',
    googleMaps: 'Google Maps',
    mapViewToggle: 'Cambiar vista del mapa',
    navigateToMQ: 'Navegar a la Universidad Macquarie',
    googleMapsIframeLabel: 'Google Maps mostrando el campus de la Universidad Macquarie',
    directionsIframeLabel: 'Direcciones a la Universidad Macquarie',
    failedToStartSetup: 'Error al iniciar la configuración. Inténtalo de nuevo.',
    verificationFailedCheckCode: 'La verificación falló. Comprueba tu código.',
    invalidCodeTryAgain: 'Código no válido. Inténtalo de nuevo.',
    twoFactorEnabled: '¡Autenticación de dos factores activada!',
    networkErrorCheckConnection: 'Error de red. Comprueba tu conexión e inténtalo de nuevo.',
    failedToDisable2FA: 'Error al desactivar la autenticación de dos factores',
    twoFactorDisabled: 'Autenticación de dos factores desactivada.',
    authenticatorAppsList: 'Google Authenticator, Authy o Microsoft Authenticator',
    totpSecurityNote:
      'Por seguridad, tu código de 6 dígitos actúa como una firma matemática activa que se renueva cada 30 segundos. Una vez usado, queda permanentemente invalidado para prevenir ataques de repetición.',
    typeCodeManually: 'Escribe este código en tu aplicación para vincularlo manualmente.',
    passkeysNotSupported: 'Las claves de acceso no son compatibles con este dispositivo.',
    invalidCode: 'Código no válido',
    failedToDisableSms2FA: 'Error al desactivar la autenticación SMS',
    sectionError: 'Error de sección',
    errorInSection: 'Error en {{section}}',
    sectionErrorMessage:
      'Algo salió mal al cargar esta sección. Puedes intentarlo de nuevo o revisar otros ajustes.',
    unitNotFoundHint: '¿No encuentras tu asignatura? Ingresa el código y nombre manualmente abajo.',
    clickToChangeLocation: '(haz clic para cambiar la ubicación)',
  },
  fr: {
    noEventsYet: 'Aucun événement pour le moment',
    clear: 'Effacer',
    date: 'Date',
    navigation: 'Navigation',
    googleMaps: 'Google Maps',
    mapViewToggle: 'Changer la vue de la carte',
    navigateToMQ: "Naviguer vers l'Université Macquarie",
    googleMapsIframeLabel: "Google Maps montrant le campus de l'Université Macquarie",
    directionsIframeLabel: "Itinéraire vers l'Université Macquarie",
    failedToStartSetup: 'Échec du démarrage de la configuration. Veuillez réessayer.',
    verificationFailedCheckCode: 'La vérification a échoué. Veuillez vérifier votre code.',
    invalidCodeTryAgain: 'Code invalide. Veuillez réessayer.',
    twoFactorEnabled: 'Authentification à deux facteurs activée !',
    networkErrorCheckConnection: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
    failedToDisable2FA: "Échec de la désactivation de l'authentification à deux facteurs",
    twoFactorDisabled: 'Authentification à deux facteurs désactivée.',
    authenticatorAppsList: 'Google Authenticator, Authy ou Microsoft Authenticator',
    totpSecurityNote:
      'Pour des raisons de sécurité, votre code à 6 chiffres fonctionne comme une signature mathématique active qui se renouvelle toutes les 30 secondes. Une fois utilisé, il est définitivement invalidé pour prévenir les attaques par rejeu.',
    typeCodeManually: 'Saisissez ce code dans votre application pour le lier manuellement.',
    passkeysNotSupported: "Les clés d'accès ne sont pas prises en charge sur cet appareil.",
    invalidCode: 'Code invalide',
    failedToDisableSms2FA: "Échec de la désactivation de l'authentification SMS",
    sectionError: 'Erreur de section',
    errorInSection: 'Erreur dans {{section}}',
    sectionErrorMessage:
      'Une erreur est survenue lors du chargement de cette section. Vous pouvez réessayer ou vérifier les autres paramètres.',
    unitNotFoundHint:
      'Vous ne trouvez pas votre unité ? Entrez le code et le nom manuellement ci-dessous.',
    clickToChangeLocation: '(cliquez pour changer de lieu)',
  },
  zh: {
    navigation: '导航',
    googleMaps: '谷歌地图',
    mapViewToggle: '切换地图视图',
    navigateToMQ: '导航至麦考瑞大学',
    googleMapsIframeLabel: '显示麦考瑞大学校园的谷歌地图',
    directionsIframeLabel: '前往麦考瑞大学的路线',
    failedToStartSetup: '启动设置失败。请重试。',
    verificationFailedCheckCode: '验证失败。请检查您的代码。',
    invalidCodeTryAgain: '代码无效。请重试。',
    twoFactorEnabled: '双重身份验证已启用！',
    networkErrorCheckConnection: '网络错误。请检查您的网络连接后重试。',
    failedToDisable2FA: '禁用双重身份验证失败',
    twoFactorDisabled: '双重身份验证已禁用。',
    authenticatorAppsList: 'Google Authenticator、Authy 或 Microsoft Authenticator',
    totpSecurityNote:
      '为了安全起见，您的6位代码充当每30秒刷新一次的动态数学签名。一旦使用，它将永久失效以防止重放攻击。',
    typeCodeManually: '将此代码输入您的应用以手动关联。',
    passkeysNotSupported: '此设备不支持通行密钥。',
    invalidCode: '代码无效',
    failedToDisableSms2FA: '禁用短信双重身份验证失败',
    sectionError: '分区错误',
    errorInSection: '{{section}}中的错误',
    sectionErrorMessage: '加载此部分时出错。您可以重试或检查其他设置。',
    unitNotFoundHint: '找不到您的课程？请在下方手动输入代码和名称。',
    clickToChangeLocation: '（点击更改位置）',
  },
  ja: {
    noEventsYet: 'イベントはまだありません',
    navigation: 'ナビゲーション',
    googleMaps: 'Google マップ',
    mapViewToggle: '地図表示を切り替え',
    navigateToMQ: 'マッコーリー大学へナビゲート',
    googleMapsIframeLabel: 'マッコーリー大学キャンパスを表示するGoogle マップ',
    directionsIframeLabel: 'マッコーリー大学への道順',
    failedToStartSetup: 'セットアップの開始に失敗しました。もう一度お試しください。',
    verificationFailedCheckCode: '検証に失敗しました。コードを確認してください。',
    invalidCodeTryAgain: '無効なコードです。もう一度お試しください。',
    twoFactorEnabled: '二要素認証が有効になりました！',
    networkErrorCheckConnection: 'ネットワークエラー。接続を確認してもう一度お試しください。',
    failedToDisable2FA: '二要素認証の無効化に失敗しました',
    twoFactorDisabled: '二要素認証が無効になりました。',
    authenticatorAppsList: 'Google Authenticator、Authy、またはMicrosoft Authenticator',
    totpSecurityNote:
      'セキュリティのため、6桁のコードは30秒ごとに更新されるアクティブな数学的署名として機能します。一度使用されると、リプレイ攻撃を防ぐために永久に無効化されます。',
    typeCodeManually: 'このコードをアプリに入力して手動でリンクしてください。',
    passkeysNotSupported: 'このデバイスではパスキーがサポートされていません。',
    invalidCode: '無効なコード',
    failedToDisableSms2FA: 'SMS二要素認証の無効化に失敗しました',
    sectionError: 'セクションエラー',
    errorInSection: '{{section}}でエラー',
    sectionErrorMessage:
      'このセクションの読み込み中にエラーが発生しました。再試行するか、他の設定を確認してください。',
    unitNotFoundHint: 'ユニットが見つかりませんか？以下にコードと名前を手動で入力してください。',
    clickToChangeLocation: '（クリックして場所を変更）',
  },
  ko: {
    noEventsYet: '아직 이벤트가 없습니다',
    navigation: '내비게이션',
    googleMaps: 'Google 지도',
    mapViewToggle: '지도 보기 전환',
    navigateToMQ: '맥쿼리 대학교로 이동',
    failedToStartSetup: '설정 시작에 실패했습니다. 다시 시도해 주세요.',
    verificationFailedCheckCode: '인증에 실패했습니다. 코드를 확인해 주세요.',
    invalidCodeTryAgain: '잘못된 코드입니다. 다시 시도해 주세요.',
    twoFactorEnabled: '2단계 인증이 활성화되었습니다!',
    networkErrorCheckConnection: '네트워크 오류. 연결을 확인하고 다시 시도해 주세요.',
    failedToDisable2FA: '2단계 인증 비활성화에 실패했습니다',
    twoFactorDisabled: '2단계 인증이 비활성화되었습니다.',
    authenticatorAppsList: 'Google Authenticator, Authy 또는 Microsoft Authenticator',
    totpSecurityNote:
      '보안을 위해 6자리 코드는 30초마다 갱신되는 능동적 수학 서명 역할을 합니다. 사용 후에는 재사용 공격을 방지하기 위해 영구적으로 무효화됩니다.',
    typeCodeManually: '이 코드를 앱에 입력하여 수동으로 연결하세요.',
    passkeysNotSupported: '이 기기에서는 패스키가 지원되지 않습니다.',
    invalidCode: '잘못된 코드',
    failedToDisableSms2FA: 'SMS 2단계 인증 비활성화에 실패했습니다',
    sectionError: '섹션 오류',
    errorInSection: '{{section}}에서 오류',
    sectionErrorMessage:
      '이 섹션을 로드하는 중에 오류가 발생했습니다. 다시 시도하거나 다른 설정을 확인해 주세요.',
    unitNotFoundHint: '과목을 찾을 수 없나요? 아래에 코드와 이름을 직접 입력하세요.',
    clickToChangeLocation: '(위치를 변경하려면 클릭)',
  },
  ru: {
    noEventsYet: 'Пока нет событий',
    navigation: 'Навигация',
    googleMaps: 'Google Карты',
    mapViewToggle: 'Переключить вид карты',
    navigateToMQ: 'Перейти к Университету Маккуори',
    failedToStartSetup: 'Не удалось начать настройку. Попробуйте снова.',
    verificationFailedCheckCode: 'Проверка не прошла. Проверьте код.',
    invalidCodeTryAgain: 'Неверный код. Попробуйте снова.',
    twoFactorEnabled: 'Двухфакторная аутентификация включена!',
    networkErrorCheckConnection: 'Ошибка сети. Проверьте подключение и попробуйте снова.',
    failedToDisable2FA: 'Не удалось отключить двухфакторную аутентификацию',
    twoFactorDisabled: 'Двухфакторная аутентификация отключена.',
    authenticatorAppsList: 'Google Authenticator, Authy или Microsoft Authenticator',
    totpSecurityNote:
      'В целях безопасности ваш 6-значный код работает как активная математическая подпись, обновляющаяся каждые 30 секунд. После использования он становится навсегда недействительным для предотвращения атак повторного воспроизведения.',
    typeCodeManually: 'Введите этот код в приложение для привязки вручную.',
    passkeysNotSupported: 'Ключи доступа не поддерживаются на этом устройстве.',
    invalidCode: 'Неверный код',
    failedToDisableSms2FA: 'Не удалось отключить SMS аутентификацию',
    sectionError: 'Ошибка раздела',
    errorInSection: 'Ошибка в {{section}}',
    sectionErrorMessage:
      'При загрузке этого раздела произошла ошибка. Вы можете попробовать снова или проверить другие настройки.',
    unitNotFoundHint: 'Не можете найти свою дисциплину? Введите код и название вручную ниже.',
    clickToChangeLocation: '(нажмите для изменения местоположения)',
  },
  de: {
    failedToStartSetup: 'Einrichtung konnte nicht gestartet werden. Bitte versuche es erneut.',
    verificationFailedCheckCode: 'Verifizierung fehlgeschlagen. Bitte überprüfe deinen Code.',
    invalidCodeTryAgain: 'Ungültiger Code. Bitte versuche es erneut.',
    twoFactorEnabled: 'Zwei-Faktor-Authentifizierung aktiviert!',
    networkErrorCheckConnection:
      'Netzwerkfehler. Bitte überprüfe deine Verbindung und versuche es erneut.',
    failedToDisable2FA: 'Zwei-Faktor-Authentifizierung konnte nicht deaktiviert werden',
    twoFactorDisabled: 'Zwei-Faktor-Authentifizierung deaktiviert.',
    authenticatorAppsList: 'Google Authenticator, Authy oder Microsoft Authenticator',
    totpSecurityNote:
      'Aus Sicherheitsgründen fungiert dein 6-stelliger Code als aktive mathematische Signatur, die sich alle 30 Sekunden erneuert. Nach einmaliger Verwendung wird er dauerhaft ungültig, um Replay-Angriffe zu verhindern.',
    typeCodeManually: 'Gib diesen Code in deine App ein, um die Verknüpfung manuell herzustellen.',
    passkeysNotSupported: 'Passkeys werden auf diesem Gerät nicht unterstützt.',
    invalidCode: 'Ungültiger Code',
    failedToDisableSms2FA: 'SMS-Zwei-Faktor-Authentifizierung konnte nicht deaktiviert werden',
    sectionError: 'Bereichsfehler',
    errorInSection: 'Fehler in {{section}}',
    sectionErrorMessage:
      'Beim Laden dieses Bereichs ist ein Fehler aufgetreten. Du kannst es erneut versuchen oder andere Einstellungen überprüfen.',
    unitNotFoundHint: 'Dein Fach nicht gefunden? Gib den Code und Namen unten manuell ein.',
    clickToChangeLocation: '(klicken zum Ändern des Standorts)',
  },
  hi: {
    failedToStartSetup: 'सेटअप शुरू करने में विफल। कृपया पुनः प्रयास करें।',
    verificationFailedCheckCode: 'सत्यापन विफल। कृपया अपना कोड जांचें।',
    invalidCodeTryAgain: 'अमान्य कोड। कृपया पुनः प्रयास करें।',
    twoFactorEnabled: 'दो-कारक प्रमाणीकरण सक्षम!',
    networkErrorCheckConnection: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',
    failedToDisable2FA: 'दो-कारक प्रमाणीकरण अक्षम करने में विफल',
    twoFactorDisabled: 'दो-कारक प्रमाणीकरण अक्षम।',
    authenticatorAppsList: 'Google Authenticator, Authy, या Microsoft Authenticator',
    totpSecurityNote:
      'सुरक्षा के लिए, आपका 6-अंकीय कोड एक सक्रिय गणितीय हस्ताक्षर के रूप में कार्य करता है जो हर 30 सेकंड में ताज़ा होता है। एक बार उपयोग करने के बाद, यह रीप्ले हमलों को रोकने के लिए स्थायी रूप से अमान्य हो जाता है।',
    typeCodeManually: 'इसे मैन्युअल रूप से लिंक करने के लिए यह कोड अपने ऐप में टाइप करें।',
    passkeysNotSupported: 'इस डिवाइस पर पासकी समर्थित नहीं है।',
    invalidCode: 'अमान्य कोड',
    failedToDisableSms2FA: 'SMS दो-कारक प्रमाणीकरण अक्षम करने में विफल',
    sectionError: 'अनुभाग त्रुटि',
    errorInSection: '{{section}} में त्रुटि',
    sectionErrorMessage:
      'इस अनुभाग को लोड करते समय कुछ गलत हो गया। आप पुनः प्रयास कर सकते हैं या अन्य सेटिंग्स जांच सकते हैं।',
    unitNotFoundHint: 'अपनी इकाई नहीं मिल रही? नीचे कोड और नाम मैन्युअल रूप से दर्ज करें।',
    clickToChangeLocation: '(स्थान बदलने के लिए क्लिक करें)',
  },
  it: {
    failedToStartSetup: 'Impossibile avviare la configurazione. Riprova.',
    verificationFailedCheckCode: 'Verifica fallita. Controlla il tuo codice.',
    invalidCodeTryAgain: 'Codice non valido. Riprova.',
    twoFactorEnabled: 'Autenticazione a due fattori attivata!',
    networkErrorCheckConnection: 'Errore di rete. Controlla la connessione e riprova.',
    failedToDisable2FA: "Impossibile disattivare l'autenticazione a due fattori",
    twoFactorDisabled: 'Autenticazione a due fattori disattivata.',
    authenticatorAppsList: 'Google Authenticator, Authy o Microsoft Authenticator',
    totpSecurityNote:
      'Per sicurezza, il tuo codice a 6 cifre funziona come una firma matematica attiva che si rinnova ogni 30 secondi. Una volta utilizzato, viene permanentemente invalidato per prevenire attacchi di riproduzione.',
    typeCodeManually: 'Digita questo codice nella tua app per collegarlo manualmente.',
    passkeysNotSupported: 'Le passkey non sono supportate su questo dispositivo.',
    invalidCode: 'Codice non valido',
    failedToDisableSms2FA: "Impossibile disattivare l'autenticazione SMS",
    sectionError: 'Errore della sezione',
    errorInSection: 'Errore in {{section}}',
    sectionErrorMessage:
      'Si è verificato un errore durante il caricamento di questa sezione. Puoi riprovare o controllare altre impostazioni.',
    unitNotFoundHint:
      'Non trovi la tua materia? Inserisci il codice e il nome manualmente qui sotto.',
    clickToChangeLocation: '(clicca per cambiare posizione)',
  },
  pt: {
    failedToStartSetup: 'Falha ao iniciar a configuração. Tente novamente.',
    verificationFailedCheckCode: 'A verificação falhou. Verifique o seu código.',
    invalidCodeTryAgain: 'Código inválido. Tente novamente.',
    twoFactorEnabled: 'Autenticação de dois fatores ativada!',
    networkErrorCheckConnection: 'Erro de rede. Verifique a sua conexão e tente novamente.',
    failedToDisable2FA: 'Falha ao desativar a autenticação de dois fatores',
    twoFactorDisabled: 'Autenticação de dois fatores desativada.',
    authenticatorAppsList: 'Google Authenticator, Authy ou Microsoft Authenticator',
    totpSecurityNote:
      'Por segurança, o seu código de 6 dígitos funciona como uma assinatura matemática ativa que se renova a cada 30 segundos. Uma vez utilizado, torna-se permanentemente inválido para prevenir ataques de repetição.',
    typeCodeManually: 'Digite este código no seu aplicativo para vinculá-lo manualmente.',
    passkeysNotSupported: 'As chaves de acesso não são suportadas neste dispositivo.',
    invalidCode: 'Código inválido',
    failedToDisableSms2FA: 'Falha ao desativar a autenticação SMS',
    sectionError: 'Erro da seção',
    errorInSection: 'Erro em {{section}}',
    sectionErrorMessage:
      'Algo deu errado ao carregar esta seção. Você pode tentar novamente ou verificar outras configurações.',
    unitNotFoundHint: 'Não encontra a sua disciplina? Insira o código e o nome manualmente abaixo.',
    clickToChangeLocation: '(clique para alterar a localização)',
  },
  tr: {
    failedToStartSetup: 'Kurulum başlatılamadı. Lütfen tekrar deneyin.',
    verificationFailedCheckCode: 'Doğrulama başarısız. Lütfen kodunuzu kontrol edin.',
    invalidCodeTryAgain: 'Geçersiz kod. Lütfen tekrar deneyin.',
    twoFactorEnabled: 'İki faktörlü kimlik doğrulama etkinleştirildi!',
    networkErrorCheckConnection: 'Ağ hatası. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
    failedToDisable2FA: 'İki faktörlü kimlik doğrulama devre dışı bırakılamadı',
    twoFactorDisabled: 'İki faktörlü kimlik doğrulama devre dışı bırakıldı.',
    authenticatorAppsList: 'Google Authenticator, Authy veya Microsoft Authenticator',
    totpSecurityNote:
      'Güvenlik için 6 haneli kodunuz her 30 saniyede yenilenen aktif bir matematiksel imza görevi görür. Bir kez kullanıldığında, tekrar saldırılarını önlemek için kalıcı olarak geçersiz kılınır.',
    typeCodeManually: 'Manuel bağlantı için bu kodu uygulamanıza girin.',
    passkeysNotSupported: 'Bu cihazda geçiş anahtarları desteklenmiyor.',
    invalidCode: 'Geçersiz kod',
    failedToDisableSms2FA: 'SMS iki faktörlü kimlik doğrulama devre dışı bırakılamadı',
    sectionError: 'Bölüm Hatası',
    errorInSection: '{{section}} bölümünde hata',
    sectionErrorMessage:
      'Bu bölüm yüklenirken bir hata oluştu. Tekrar deneyebilir veya diğer ayarları kontrol edebilirsiniz.',
    unitNotFoundHint: 'Dersinizi bulamıyor musunuz? Kodu ve adı aşağıya manuel olarak girin.',
    clickToChangeLocation: '(konum değiştirmek için tıklayın)',
  },
};

// Apply translations for the new 18 keys to all locales that have dictionaries
function applyNewKeyTranslations() {
  const newKeys = [
    'failedToStartSetup',
    'verificationFailedCheckCode',
    'invalidCodeTryAgain',
    'twoFactorEnabled',
    'networkErrorCheckConnection',
    'failedToDisable2FA',
    'twoFactorDisabled',
    'authenticatorAppsList',
    'totpSecurityNote',
    'typeCodeManually',
    'passkeysNotSupported',
    'invalidCode',
    'failedToDisableSms2FA',
    'sectionError',
    'errorInSection',
    'sectionErrorMessage',
    'unitNotFoundHint',
    'clickToChangeLocation',
  ];

  const locales = fs
    .readdirSync(LOCALES_DIR)
    .filter((d) => d !== 'en' && fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

  let totalApplied = 0;

  for (const locale of locales) {
    const locPath = path.join(LOCALES_DIR, locale, 'translations.json');
    const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    const dict = TRANSLATIONS[locale];

    if (!dict) continue;

    let applied = 0;
    for (const key of Object.keys(dict)) {
      // Only apply if the current value is identical to English (untranslated)
      if (loc[key] === en[key] || !loc[key]) {
        loc[key] = dict[key];
        applied++;
      }
    }

    if (applied > 0) {
      fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8');
      console.log(`${locale}: ${applied} translations applied`);
      totalApplied += applied;
    }
  }

  console.log(`\nTotal: ${totalApplied} translations applied`);
}

applyNewKeyTranslations();
