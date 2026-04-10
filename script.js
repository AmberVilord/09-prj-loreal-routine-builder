/* Get the main elements we need from the page */
const categoryFilter = document.getElementById("categoryFilter");
const productSearchInput = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedBtn = document.getElementById("clearSelected");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const languageToggleBtn = document.getElementById("languageToggle");
const rtlLanguageSelect = document.getElementById("rtlLanguageSelect");
const rtlLanguageLabel = document.getElementById("rtlLanguageLabel");

/* Send AI requests through your Cloudflare Worker (same origin proxy path) */
const WORKER_ENDPOINT = "/api/chat";

/* Store all products after we fetch them from products.json */
let allProducts = [];
let currentLanguage = "en";

/* Map language codes to full names so we can instruct the AI which language to reply in */
const LANGUAGE_NAMES = {
  en: "English",
  ar: "Arabic",
  he: "Hebrew",
  fa: "Persian (Farsi)",
  ur: "Urdu",
  ps: "Pashto",
  sd: "Sindhi",
  ug: "Uyghur",
  yi: "Yiddish",
  dv: "Divehi",
  ckb: "Kurdish (Sorani)",
};

/* Return the full language name for the current UI language */
function getCurrentLanguageName() {
  return LANGUAGE_NAMES[currentLanguage] || "English";
}

/* Store selected product ids so we can add/remove them easily */
const selectedProductIds = new Set();
const STORAGE_KEY = "loreal-selected-products";

/* Keep the full conversation history so the AI remembers context */
const conversationHistory = [];
const RTL_LANGUAGES = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "ps",
  "sd",
  "ug",
  "yi",
  "dv",
  "ckb",
]);

/* Basic UI translations for supported languages */
const translations = {
  en: {
    documentTitle: "L'Oreal | Smart Routine & Product Advisor",
    languageToggle: "Right to Left Languages",
    chooseLanguageLabel: "Choose language",
    rtlLanguageAria: "Choose a right to left language",
    rtlOptionDefault: "Select an RTL language",
    rtlOptionEnglish: "Back to English (LTR)",
    siteTitle: "Smart Routine & Product Advisor",
    siteSubtitle: "~ your personal beauty ritual ~",
    quickLinkBeautyMagazine: "Beauty Magazine",
    quickLinkMakeup: "Makeup",
    quickLinkSkinCare: "Skin Care",
    quickLinkHairColor: "Hair Color",
    quickLinkCommitments: "Our Commitments",
    categoryDefault: "Choose a Category",
    categoryCleanser: "Cleansers",
    categoryMoisturizer: "Moisturizers & Treatments",
    categoryHaircare: "Haircare",
    categoryMakeup: "Makeup",
    categoryHairColor: "Hair Color",
    categoryHairStyling: "Hair Styling",
    categoryMensGrooming: "Men's Grooming",
    categorySuncare: "Suncare",
    categoryFragrance: "Fragrance",
    selectedProductsHeading: "Selected Products",
    clearSelected: "Clear Selected",
    generateRoutine: "Generate Routine",
    chatHeading: "Let's Build Your Routine",
    userInputLabel: "Message",
    sendLabel: "Send",
    userInputPlaceholder: "Ask me about products or routines...",
    footerCopyright: "© 2025 L'Oreal. All rights reserved.",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Use",
    footerContact: "Contact",
    chooseCategoryMessage: "Choose a category to view matching products.",
    noProductsMatched: "No products matched that category.",
    noProductsSelected: "No products selected yet.",
    showDescription: "Show description",
    hideDescription: "Hide description",
    removeProductAria: "Remove {name}",
    selectAtLeastOne: "Select at least one product first.",
    generateRoutineFor: "Generate a routine for: {products}",
    routineLoading: "Building your personalized routine...",
    chatLoading: "Thinking...",
    starterMessage:
      "Choose a category, select products, then generate your routine.",
  },
  ar: {
    documentTitle: "لوريال | مستشار الروتين والمنتجات الذكي",
    languageToggle: "لغات من اليمين إلى اليسار",
    chooseLanguageLabel: "اختر اللغة",
    rtlLanguageAria: "اختر لغة من اليمين إلى اليسار",
    rtlOptionDefault: "اختر لغة من اليمين إلى اليسار",
    rtlOptionEnglish: "العودة إلى الإنجليزية (من اليسار إلى اليمين)",
    siteTitle: "مستشار الروتين والمنتجات الذكي",
    siteSubtitle: "~ طقس الجمال الشخصي الخاص بك ~",
    quickLinkBeautyMagazine: "مجلة الجمال",
    quickLinkMakeup: "مكياج",
    quickLinkSkinCare: "العناية بالبشرة",
    quickLinkHairColor: "صبغة الشعر",
    quickLinkCommitments: "التزاماتنا",
    categoryDefault: "اختر فئة",
    categoryCleanser: "منظفات",
    categoryMoisturizer: "مرطبات وعلاجات",
    categoryHaircare: "العناية بالشعر",
    categoryMakeup: "مكياج",
    categoryHairColor: "صبغة الشعر",
    categoryHairStyling: "تصفيف الشعر",
    categoryMensGrooming: "العناية بالرجال",
    categorySuncare: "العناية بالشمس",
    categoryFragrance: "عطور",
    selectedProductsHeading: "المنتجات المختارة",
    clearSelected: "مسح المختار",
    generateRoutine: "إنشاء الروتين",
    chatHeading: "لننشئ روتينك",
    userInputLabel: "رسالة",
    sendLabel: "إرسال",
    userInputPlaceholder: "اسألني عن المنتجات أو الروتين...",
    footerCopyright: "© 2025 لوريال. جميع الحقوق محفوظة.",
    footerPrivacy: "سياسة الخصوصية",
    footerTerms: "شروط الاستخدام",
    footerContact: "اتصل بنا",
    chooseCategoryMessage: "اختر فئة لعرض المنتجات المطابقة.",
    noProductsMatched: "لا توجد منتجات مطابقة لهذه الفئة.",
    noProductsSelected: "لا توجد منتجات مختارة بعد.",
    showDescription: "إظهار الوصف",
    hideDescription: "إخفاء الوصف",
    removeProductAria: "إزالة {name}",
    selectAtLeastOne: "اختر منتجاً واحداً على الأقل أولاً.",
    generateRoutineFor: "أنشئ روتيناً لـ: {products}",
    routinePlaceholder:
      "نص تجريبي: اربط هذا الزر بمنشئ الروتين بالذكاء الاصطناعي.",
    chatPlaceholder: "نص تجريبي: اربط هذا النموذج بمنطق المحادثة لديك.",
    starterMessage: "اختر فئة وحدد المنتجات ثم واصل بناء هذا المشروع.",
  },
  he: {
    documentTitle: "לוריאל | יועץ חכם לשגרה ומוצרים",
    languageToggle: "שפות מימין לשמאל",
    chooseLanguageLabel: "בחר שפה",
    rtlLanguageAria: "בחר שפה מימין לשמאל",
    rtlOptionDefault: "בחר שפת RTL",
    rtlOptionEnglish: "חזרה לאנגלית (משמאל לימין)",
    siteTitle: "יועץ חכם לשגרה ומוצרים",
    siteSubtitle: "~ טקס היופי האישי שלך ~",
    quickLinkBeautyMagazine: "מגזין יופי",
    quickLinkMakeup: "איפור",
    quickLinkSkinCare: "טיפוח עור",
    quickLinkHairColor: "צבע לשיער",
    quickLinkCommitments: "המחויבויות שלנו",
    categoryDefault: "בחר קטגוריה",
    categoryCleanser: "תכשירי ניקוי",
    categoryMoisturizer: "לחות וטיפולים",
    categoryHaircare: "טיפוח שיער",
    categoryMakeup: "איפור",
    categoryHairColor: "צבע לשיער",
    categoryHairStyling: "עיצוב שיער",
    categoryMensGrooming: "טיפוח לגברים",
    categorySuncare: "הגנה מהשמש",
    categoryFragrance: "בשמים",
    selectedProductsHeading: "מוצרים נבחרים",
    clearSelected: "נקה בחירות",
    generateRoutine: "צור שגרה",
    chatHeading: "בואו נבנה את השגרה שלך",
    userInputLabel: "הודעה",
    sendLabel: "שלח",
    userInputPlaceholder: "שאלו אותי על מוצרים או שגרות...",
    footerCopyright: "© 2025 לוריאל. כל הזכויות שמורות.",
    footerPrivacy: "מדיניות פרטיות",
    footerTerms: "תנאי שימוש",
    footerContact: "יצירת קשר",
    chooseCategoryMessage: "בחר קטגוריה כדי לראות מוצרים מתאימים.",
    noProductsMatched: "לא נמצאו מוצרים בקטגוריה הזו.",
    noProductsSelected: "עדיין לא נבחרו מוצרים.",
    showDescription: "הצג תיאור",
    hideDescription: "הסתר תיאור",
    removeProductAria: "הסר את {name}",
    selectAtLeastOne: "בחר לפחות מוצר אחד קודם.",
    generateRoutineFor: "צור שגרה עבור: {products}",
    routinePlaceholder: "טקסט זמני: חבר את הכפתור למחולל שגרה מבוסס AI.",
    chatPlaceholder: "טקסט זמני: חבר את הטופס ללוגיקת השיחה שלך.",
    starterMessage: "בחר קטגוריה, בחר מוצרים והמשך לבנות את הפרויקט.",
  },
  fa: {
    documentTitle: "لورآل | مشاور هوشمند روتین و محصول",
    languageToggle: "زبان های راست به چپ",
    chooseLanguageLabel: "انتخاب زبان",
    rtlLanguageAria: "یک زبان راست به چپ انتخاب کنید",
    rtlOptionDefault: "یک زبان راست به چپ انتخاب کنید",
    rtlOptionEnglish: "بازگشت به انگلیسی (چپ به راست)",
    siteTitle: "مشاور هوشمند روتین و محصول",
    siteSubtitle: "~ آیین زیبایی شخصی شما ~",
    quickLinkBeautyMagazine: "مجله زیبایی",
    quickLinkMakeup: "آرایش",
    quickLinkSkinCare: "مراقبت از پوست",
    quickLinkHairColor: "رنگ مو",
    quickLinkCommitments: "تعهدات ما",
    categoryDefault: "یک دسته انتخاب کنید",
    categoryCleanser: "پاک کننده ها",
    categoryMoisturizer: "مرطوب کننده و درمان",
    categoryHaircare: "مراقبت از مو",
    categoryMakeup: "آرایش",
    categoryHairColor: "رنگ مو",
    categoryHairStyling: "حالت دهی مو",
    categoryMensGrooming: "آراستگی آقایان",
    categorySuncare: "مراقبت در برابر آفتاب",
    categoryFragrance: "عطر",
    selectedProductsHeading: "محصولات انتخاب شده",
    clearSelected: "پاک کردن انتخاب ها",
    generateRoutine: "تولید روتین",
    chatHeading: "بیایید روتین شما را بسازیم",
    userInputLabel: "پیام",
    sendLabel: "ارسال",
    userInputPlaceholder: "درباره محصولات یا روتین بپرسید...",
    footerCopyright: "© 2025 لورآل. تمام حقوق محفوظ است.",
    footerPrivacy: "حریم خصوصی",
    footerTerms: "شرایط استفاده",
    footerContact: "تماس",
    chooseCategoryMessage: "برای دیدن محصولات مرتبط یک دسته انتخاب کنید.",
    noProductsMatched: "محصولی برای این دسته پیدا نشد.",
    noProductsSelected: "هنوز محصولی انتخاب نشده است.",
    showDescription: "نمایش توضیحات",
    hideDescription: "پنهان کردن توضیحات",
    removeProductAria: "حذف {name}",
    selectAtLeastOne: "ابتدا حداقل یک محصول انتخاب کنید.",
    generateRoutineFor: "یک روتین برای این موارد بساز: {products}",
    routinePlaceholder:
      "متن نمونه: این دکمه را به سازنده روتین هوش مصنوعی وصل کنید.",
    chatPlaceholder: "متن نمونه: این فرم را به منطق گفتگوی خود وصل کنید.",
    starterMessage:
      "یک دسته انتخاب کنید، محصولات را انتخاب کنید و پروژه را ادامه دهید.",
  },
  ur: {
    documentTitle: "لورئیل | اسمارٹ روٹین اور پروڈکٹ ایڈوائزر",
    languageToggle: "دائیں سے بائیں زبانیں",
    chooseLanguageLabel: "زبان منتخب کریں",
    rtlLanguageAria: "دائیں سے بائیں زبان منتخب کریں",
    rtlOptionDefault: "ایک RTL زبان منتخب کریں",
    rtlOptionEnglish: "انگریزی پر واپس جائیں (LTR)",
    siteTitle: "اسمارٹ روٹین اور پروڈکٹ ایڈوائزر",
    siteSubtitle: "~ آپ کا ذاتی بیوٹی روٹین ~",
    quickLinkBeautyMagazine: "بیوٹی میگزین",
    quickLinkMakeup: "میک اپ",
    quickLinkSkinCare: "اسکن کیئر",
    quickLinkHairColor: "بالوں کا رنگ",
    quickLinkCommitments: "ہماری وابستگیاں",
    categoryDefault: "ایک زمرہ منتخب کریں",
    categoryCleanser: "کلینزر",
    categoryMoisturizer: "موئسچرائزر اور ٹریٹمنٹس",
    categoryHaircare: "بالوں کی دیکھ بھال",
    categoryMakeup: "میک اپ",
    categoryHairColor: "بالوں کا رنگ",
    categoryHairStyling: "بالوں کی اسٹائلنگ",
    categoryMensGrooming: "مردوں کی گرومنگ",
    categorySuncare: "سن کیئر",
    categoryFragrance: "خوشبو",
    selectedProductsHeading: "منتخب مصنوعات",
    clearSelected: "منتخب صاف کریں",
    generateRoutine: "روٹین بنائیں",
    chatHeading: "آئیے آپ کا روٹین بنائیں",
    userInputLabel: "پیغام",
    sendLabel: "بھیجیں",
    userInputPlaceholder: "مصنوعات یا روٹین کے بارے میں پوچھیں...",
    footerCopyright: "© 2025 لورئیل۔ جملہ حقوق محفوظ ہیں۔",
    footerPrivacy: "پرائیویسی پالیسی",
    footerTerms: "استعمال کی شرائط",
    footerContact: "رابطہ",
    chooseCategoryMessage: "مطابق مصنوعات دیکھنے کے لئے ایک زمرہ منتخب کریں۔",
    noProductsMatched: "اس زمرے سے کوئی مصنوعات نہیں ملیں۔",
    noProductsSelected: "ابھی تک کوئی مصنوعات منتخب نہیں کی گئیں۔",
    showDescription: "تفصیل دکھائیں",
    hideDescription: "تفصیل چھپائیں",
    removeProductAria: "{name} ہٹائیں",
    selectAtLeastOne: "پہلے کم از کم ایک مصنوع منتخب کریں۔",
    generateRoutineFor: "اس کے لئے روٹین بنائیں: {products}",
    routinePlaceholder: "عارضی متن: اس بٹن کو AI روٹین بلڈر سے جوڑیں۔",
    chatPlaceholder: "عارضی متن: اس فارم کو اپنی گفتگو کی منطق سے جوڑیں۔",
    starterMessage:
      "ایک زمرہ منتخب کریں، مصنوعات منتخب کریں، اور منصوبہ جاری رکھیں۔",
  },
  ps: {
    languageToggle: "له ښي نه کيڼو ژبې",
    siteTitle: "هوښیار د روټین او محصول مشاور",
    categoryDefault: "یوه کټګوري وټاکئ",
    categoryCleanser: "پاکوونکي",
    categoryMoisturizer: "مرطوب کوونکي او درملنه",
    categoryHaircare: "د ویښتو پاملرنه",
    categoryMakeup: "میک اپ",
    categoryHairColor: "د ویښتو رنګ",
    categoryHairStyling: "د ویښتو سټایل",
    categoryMensGrooming: "د نارینه وو سنبالښت",
    categorySuncare: "د لمر پاملرنه",
    categoryFragrance: "عطر",
    selectedProductsHeading: "ټاکل شوي محصولات",
    clearSelected: "ټاکنې پاکې کړئ",
    generateRoutine: "روټین جوړ کړئ",
    chatHeading: "راځئ ستاسو روټین جوړ کړو",
    userInputPlaceholder: "د محصولاتو یا روټین په اړه پوښتنه وکړئ...",
    footerPrivacy: "د محرمیت تګلاره",
    footerTerms: "د کارونې شرطونه",
    footerContact: "اړیکه",
    chooseCategoryMessage: "د اړوندو محصولاتو لپاره یوه کټګوري وټاکئ.",
    noProductsMatched: "دې کټګورۍ ته برابر محصولات ونه موندل شول.",
    noProductsSelected: "لا تراوسه کوم محصولات نه دي ټاکل شوي.",
    showDescription: "تشریح ښکاره کړئ",
    hideDescription: "تشریح پټه کړئ",
    removeProductAria: "{name} لرې کړئ",
    selectAtLeastOne: "لومړی لږ تر لږه یو محصول وټاکئ.",
    generateRoutineFor: "د دې لپاره روټین جوړ کړئ: {products}",
    routinePlaceholder: "لنډمهاله متن: دا تڼۍ خپل AI روټین جوړونکي سره ونښلوئ.",
    chatPlaceholder: "لنډمهاله متن: دا فورم د خپل چټ منطق سره ونښلوئ.",
    starterMessage:
      "یو کټګوري وټاکئ، محصولات وټاکئ، او پروژه نوره هم پرمخ یوسئ.",
  },
  sd: {
    languageToggle: "ساڄي کان کاٻي ٻوليون",
    siteTitle: "سمارٽ روٽين ۽ پراڊڪٽ صلاحڪار",
    categoryDefault: "هڪ زمرو چونڊيو",
    categoryCleanser: "صاف ڪندڙ",
    categoryMoisturizer: "موئسچرائزر ۽ علاج",
    categoryHaircare: "وارن جي سنڀال",
    categoryMakeup: "ميڪ اپ",
    categoryHairColor: "وارن جو رنگ",
    categoryHairStyling: "وارن جي اسٽائلنگ",
    categoryMensGrooming: "مردن جي گرومنگ",
    categorySuncare: "سن ڪيئر",
    categoryFragrance: "خوشبو",
    selectedProductsHeading: "چونڊيل پراڊڪٽس",
    clearSelected: "چونڊ صاف ڪريو",
    generateRoutine: "روٽين ٺاهيو",
    chatHeading: "اچو ته توهان جو روٽين ٺاهيون",
    userInputPlaceholder: "پراڊڪٽس يا روٽين بابت پڇو...",
    footerPrivacy: "پرائيويسي پاليسي",
    footerTerms: "استعمال جا شرط",
    footerContact: "رابطو",
    chooseCategoryMessage: "مناسب پراڊڪٽس ڏسڻ لاءِ هڪ زمرو چونڊيو.",
    noProductsMatched: "هن زمري سان ڪابه پراڊڪٽ نه ملي.",
    noProductsSelected: "اڃا ڪا به پراڊڪٽ چونڊي نه وئي آهي.",
    showDescription: "وضاحت ڏيکاريو",
    hideDescription: "وضاحت لڪايو",
    removeProductAria: "{name} هٽايو",
    selectAtLeastOne: "پهريان گهٽ ۾ گهٽ هڪ پراڊڪٽ چونڊيو.",
    generateRoutineFor: "هن لاءِ روٽين ٺاهيو: {products}",
    routinePlaceholder: "عارضي متن: هن بٽڻ کي پنهنجي AI روٽين بلڊر سان ڳنڍيو.",
    chatPlaceholder: "عارضي متن: هن فارم کي پنهنجي چيٽ لاجڪ سان ڳنڍيو.",
    starterMessage: "هڪ زمرو چونڊيو، پراڊڪٽس چونڊيو، ۽ منصوبي کي جاري رکو.",
  },
  ug: {
    languageToggle: "ئوڭدىن سولغا تىللار",
    siteTitle: "ئەقىللىق كۈندىلىك ۋە مەھسۇلات يېتەكچىسى",
    categoryDefault: "بىر تۈرنى تاللاڭ",
    categoryCleanser: "تازىلاش مەھسۇلاتلىرى",
    categoryMoisturizer: "نەملىك ۋە داۋالاش",
    categoryHaircare: "چاچ پەرۋىشى",
    categoryMakeup: "گىرىم",
    categoryHairColor: "چاچ بويىقى",
    categoryHairStyling: "چاچ ئۇسلۇبى",
    categoryMensGrooming: "ئەرلەر پەرۋىشى",
    categorySuncare: "قۇياش پەرۋىشى",
    categoryFragrance: "خۇش پۇراق",
    selectedProductsHeading: "تاللانغان مەھسۇلاتلار",
    clearSelected: "تاللانغاننى تازىلا",
    generateRoutine: "كۈندىلىك ياساش",
    chatHeading: "كۈندىلىكىڭىزنى بىرلىكتە قۇرايلى",
    userInputPlaceholder: "مەھسۇلات ياكى كۈندىلىك ھەققىدە سوراڭ...",
    footerPrivacy: "مەخپىيەتلىك سىياسىتى",
    footerTerms: "ئىشلىتىش شەرتلىرى",
    footerContact: "ئالاقىلىشىش",
    chooseCategoryMessage: "ماس مەھسۇلاتلارنى كۆرۈش ئۈچۈن بىر تۈرنى تاللاڭ.",
    noProductsMatched: "بۇ تۈرگە ماس مەھسۇلات تېپىلمىدى.",
    noProductsSelected: "تېخىچە مەھسۇلات تاللانمىدى.",
    showDescription: "چۈشەندۈرۈشنى كۆرسەت",
    hideDescription: "چۈشەندۈرۈشنى يوشۇر",
    removeProductAria: "{name} نى ئۆچۈر",
    selectAtLeastOne: "ئالدى بىلەن كەم دېگەندە بىر مەھسۇلات تاللاڭ.",
    generateRoutineFor: "بۇلار ئۈچۈن كۈندىلىك ياساڭ: {products}",
    routinePlaceholder:
      "ۋاقىتلىق تېكىست: بۇ كۇنۇپكىنى AI كۈندىلىك ياسىغۇچقا ئۇلاڭ.",
    chatPlaceholder: "ۋاقىتلىق تېكىست: بۇ جەدۋەلنى سۆھبەت لوگىكىڭىزغا ئۇلاڭ.",
    starterMessage: "بىر تۈر تاللاڭ، مەھسۇلات تاللاڭ، ۋە تۈرنى داۋاملاشتۇرۇڭ.",
  },
  yi: {
    languageToggle: "שפראכן פון רעכט צו לינקס",
    siteTitle: "קלוגער רוטין און פראדוקט ראטגעבער",
    categoryDefault: "קלייבט א קאטעגאריע",
    categoryCleanser: "רייניקערס",
    categoryMoisturizer: "מויסטשערייזערס און טריטמענטן",
    categoryHaircare: "האר-זארג",
    categoryMakeup: "מייקאפ",
    categoryHairColor: "האר קאליר",
    categoryHairStyling: "האר סטיילינג",
    categoryMensGrooming: "מענער גרומינג",
    categorySuncare: "זון-זארג",
    categoryFragrance: "רייח",
    selectedProductsHeading: "אויסגעקליבענע פראדוקטן",
    clearSelected: "רייניג אויסוואלן",
    generateRoutine: "בוי רוטין",
    chatHeading: "לאמיר בויען אייער רוטין",
    userInputPlaceholder: "פרעגט וועגן פראדוקטן אדער רוטינען...",
    footerPrivacy: "פריוואטקייט פאליסי",
    footerTerms: "נוצונגס תנאים",
    footerContact: "קאנטאקט",
    chooseCategoryMessage: "קלייבט א קאטעגאריע צו זען פאסיגע פראדוקטן.",
    noProductsMatched: "קיין פראדוקטן האבן נישט געמאכט א מאטש.",
    noProductsSelected: "נאך קיין פראדוקטן נישט אויסגעקליבן.",
    showDescription: "ווייז באשרייבונג",
    hideDescription: "באהאלט באשרייבונג",
    removeProductAria: "נעם אוועק {name}",
    selectAtLeastOne: "קלייבט קודם כאטש איין פראדוקט.",
    generateRoutineFor: "בוי א רוטין פאר: {products}",
    routinePlaceholder:
      "פלאצהאלטער: פארבינדט דעם קנעפל צו אייער AI רוטין בילדער.",
    chatPlaceholder: "פלאצהאלטער: פארבינדט דעם פארם צו אייער שמועס-לאגיק.",
    starterMessage:
      "קלייבט א קאטעגאריע, קלייבט פראדוקטן, און בויט ווייטער דעם פראיעקט.",
  },
  dv: {
    languageToggle: "ކަނާތުން ވާ ބަސްތައް",
    siteTitle: "ސްމާޓް ރޫޓީން އަދި ޕްރޮޑަކްޓް އެޑްވައިޒަރ",
    categoryDefault: "އެއް ކެޓަގަރީ ޚިޔާރު ކުރޭ",
    categoryCleanser: "ސާފުކުރާ މަސައްކަތް",
    categoryMoisturizer: "މޮއިސްޗަރައިޒަރ އަދި ބަލަހައްޓާ",
    categoryHaircare: "ކެހި ކެއަރ",
    categoryMakeup: "މޭކްއަޕް",
    categoryHairColor: "ކެހި ކަލަރ",
    categoryHairStyling: "ކެހި ސްޓައިލިންގ",
    categoryMensGrooming: "މެންސް ގްރޫމިންގ",
    categorySuncare: "ސަން ކެއަރ",
    categoryFragrance: "ފްރެގްރަންސް",
    selectedProductsHeading: "ހޮވާފައިވާ ޕްރޮޑަކްޓްތައް",
    clearSelected: "ހޮވާފައިވާ ފޮހެލާ",
    generateRoutine: "ރޫޓީން ހެދުން",
    chatHeading: "ތިޔަ ރޫޓީން ބިލްޑް ކުރާނެ",
    userInputPlaceholder: "ޕްރޮޑަކްޓް ނުވަތަ ރޫޓީން ބެހޭ ސުވާލު...",
    footerPrivacy: "ޕްރައިވެސީ ޕޮލިސީ",
    footerTerms: "ބޭނުން ކުރުމުގެ ޝަރުތުތައް",
    footerContact: "ގުޅޭ",
    chooseCategoryMessage: "މެޗް ވާ ޕްރޮޑަކްޓްތައް ބަލާނެ ކެޓަގަރީ ހޮވާ.",
    noProductsMatched: "މި ކެޓަގަރީއާ މެޗް ވާ ޕްރޮޑަކްޓް ނެތް.",
    noProductsSelected: "އަދި ޕްރޮޑަކްޓް ހޮވާފައެއް ނުވޭ.",
    showDescription: "ތަފްޞީލު ދައްކާ",
    hideDescription: "ތަފްޞީލު ފޮރުވާ",
    removeProductAria: "{name} ނަގާ",
    selectAtLeastOne: "ފުރަތަމަ މަދުވެގެން 1 ޕްރޮޑަކްޓް ހޮވާ.",
    generateRoutineFor: "މިއަށް ރޫޓީން ހެދޭ: {products}",
    routinePlaceholder: "ވަގުތީ ލިޔުމެއް: މި ބަޓަން AI ރޫޓީން ބިލްޑަރާ ގުޅާ.",
    chatPlaceholder: "ވަގުތީ ލިޔުމެއް: މި ފޯމް ޗެޓް ލޮޖިކާ ގުޅާ.",
    starterMessage:
      "ކެޓަގަރީ ހޮވާ، ޕްރޮޑަކްޓް ހޮވާ، އަދި ޕްރޮޖެކްޓް ދެމިހުރިހާ.",
  },
  ckb: {
    languageToggle: "زمانەکانی ڕاست بۆ چەپ",
    siteTitle: "ڕاوێژکاری زیرەکی ڕوتین و بەرهەم",
    categoryDefault: "پۆلێک هەڵبژێرە",
    categoryCleanser: "پاککەرەوەکان",
    categoryMoisturizer: "موویستەرایزەر و چارەسەر",
    categoryHaircare: "چاودێری قژ",
    categoryMakeup: "مەیکەپ",
    categoryHairColor: "ڕەنگی قژ",
    categoryHairStyling: "شێوەدان بە قژ",
    categoryMensGrooming: "چاودێری پیاوان",
    categorySuncare: "چاودێری خۆر",
    categoryFragrance: "بۆن",
    selectedProductsHeading: "بەرهەمە هەڵبژێردراوەکان",
    clearSelected: "پاککردنەوەی هەڵبژاردن",
    generateRoutine: "دروستکردنی ڕوتین",
    chatHeading: "با ڕوتینی تۆ دروست بکەین",
    userInputPlaceholder: "پرسیار لەسەر بەرهەم یان ڕوتین بکە...",
    footerPrivacy: "سیاسەتی تایبەتمەندی",
    footerTerms: "مەرجەکانی بەکارهێنان",
    footerContact: "پەیوەندی",
    chooseCategoryMessage: "پۆلێک هەڵبژێرە بۆ بینینی بەرهەمە گونجاوەکان.",
    noProductsMatched: "هیچ بەرهەمێک بەم پۆلە ناگونجێت.",
    noProductsSelected: "هێشتا هیچ بەرهەمێک هەڵنەبژێردراوە.",
    showDescription: "پیشاندانی وەسف",
    hideDescription: "شاردنەوەی وەسف",
    removeProductAria: "سڕینەوەی {name}",
    selectAtLeastOne: "تکایە سەرەتا لانیکەم یەک بەرهەم هەڵبژێرە.",
    generateRoutineFor: "ڕوتین دروست بکە بۆ: {products}",
    routinePlaceholder:
      "دەقی نموونەیی: ئەم دوگمەیە بە دروستکەری AIی ڕوتینەکەتەوە ببەستە.",
    chatPlaceholder: "دەقی نموونەیی: ئەم فۆرمە بە لۆژیکی گفتوگۆکەتەوە ببەستە.",
    starterMessage:
      "پۆلێک هەڵبژێرە، بەرهەمەکان هەڵبژێرە، و پڕۆژەکە بەردەوام بکە.",
  },
};

/* Get translated text with English fallback */
function t(key) {
  const selectedPack = translations[currentLanguage] || translations.en;
  return selectedPack[key] || translations.en[key] || "";
}

/* Insert values into template strings like "Remove {name}" */
function tFormat(key, values = {}) {
  let text = t(key);

  Object.entries(values).forEach(([name, value]) => {
    text = text.replace(`{${name}}`, value);
  });

  return text;
}

/* Show a starting message before a category is chosen */
function showChooseCategoryPlaceholder() {
  productsContainer.innerHTML = `
    <div class="placeholder-message">
      ${t("chooseCategoryMessage")}
    </div>
  `;
}

showChooseCategoryPlaceholder();

/* Add a message to the chat window */
function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return message;
}

/* Extract a useful error message from a failed fetch response */
async function getRequestErrorMessage(response) {
  let details = "";

  try {
    const errorData = await response.json();

    if (typeof errorData?.error === "string") {
      details = errorData.error;
    }

    if (typeof errorData?.details === "string") {
      details = details
        ? `${details} ${errorData.details}`
        : errorData.details;
    }
  } catch {
    details = "";
  }

  if (!details) {
    return `Request failed (${response.status}).`;
  }

  return `Request failed (${response.status}): ${details}`;
}

/* Keep the starter guidance message translated after language changes */
function renderOrUpdateStarterMessage() {
  const existingStarterMessage = chatWindow.querySelector(
    '.chat-message.assistant[data-message-type="starter"]',
  );

  if (existingStarterMessage) {
    existingStarterMessage.textContent = t("starterMessage");
    return;
  }

  const starterMessage = appendMessage("assistant", t("starterMessage"));
  starterMessage.dataset.messageType = "starter";
}

/* Save selected product ids in localStorage so they stay after reload */
function saveSelectedProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedProductIds]));
}

/* Load saved product ids from localStorage */
function loadSavedSelectedProducts() {
  const savedProductIds = localStorage.getItem(STORAGE_KEY);

  if (!savedProductIds) {
    return;
  }

  try {
    const parsedIds = JSON.parse(savedProductIds);

    if (!Array.isArray(parsedIds)) {
      return;
    }

    parsedIds.forEach((productId) => {
      if (typeof productId === "number") {
        selectedProductIds.add(productId);
      }
    });
  } catch (error) {
    console.error("Could not load saved selected products.", error);
  }
}

/* Load product data from the JSON file */
async function loadProducts() {
  if (allProducts.length > 0) {
    return allProducts;
  }

  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Return only the products the user has selected */
function getSelectedProducts() {
  return allProducts.filter((product) => selectedProductIds.has(product.id));
}

/* Update card borders so selected products are clearly marked */
function syncSelectedCardStyles() {
  const cards = productsContainer.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const productId = Number(card.dataset.productId);
    card.classList.toggle("selected", selectedProductIds.has(productId));
  });
}

/* Show selected products above the Generate Routine button */
function renderSelectedProducts() {
  const selectedProducts = getSelectedProducts();

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">${t("noProductsSelected")}</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item">
          <span>${product.name}</span>
          <button
            type="button"
            class="selected-product-remove"
            data-product-id="${product.id}"
            aria-label="${tFormat("removeProductAria", { name: product.name })}"
          >
            ×
          </button>
        </div>
      `,
    )
    .join("");
}

/* Build the product cards for the current filtered products */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        ${t("noProductsMatched")}
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
        <article class="product-card" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <button
              type="button"
              class="details-toggle"
              aria-expanded="false"
              aria-controls="product-description-${product.id}"
            >
              ${t("showDescription")}
            </button>
            <p
              id="product-description-${product.id}"
              class="product-description"
              hidden
            >
              ${product.description}
            </p>
          </div>
        </article>
      `,
    )
    .join("");

  syncSelectedCardStyles();
}

/* Add or remove a product from the selected set */
function toggleProductSelection(productId) {
  if (selectedProductIds.has(productId)) {
    selectedProductIds.delete(productId);
  } else {
    selectedProductIds.add(productId);
  }

  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
}

/* Remove one selected product directly from the selected list */
function removeSelectedProduct(productId) {
  selectedProductIds.delete(productId);
  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
}

/* Apply both the keyword search and category filter at the same time */
async function applyFilters() {
  const products = await loadProducts();
  const keyword = productSearchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  /* Start with all products, then narrow down by active filters */
  let filtered = products;

  if (selectedCategory) {
    filtered = filtered.filter(
      (product) => product.category === selectedCategory,
    );
  }

  if (keyword) {
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword),
    );
  }

  displayProducts(filtered);
}

/* Filter products when the category changes */
categoryFilter.addEventListener("change", () => {
  applyFilters();
});

/* Filter products as the user types in the search box */
productSearchInput.addEventListener("input", () => {
  applyFilters();
});

/* Handle clicks inside the product grid */
productsContainer.addEventListener("click", (event) => {
  const detailsButton = event.target.closest(".details-toggle");

  if (detailsButton) {
    const descriptionId = detailsButton.getAttribute("aria-controls");
    const description = document.getElementById(descriptionId);
    const isExpanded = detailsButton.getAttribute("aria-expanded") === "true";

    detailsButton.setAttribute("aria-expanded", String(!isExpanded));
    detailsButton.textContent = isExpanded
      ? t("showDescription")
      : t("hideDescription");

    if (description) {
      description.hidden = isExpanded;
    }

    return;
  }

  const card = event.target.closest(".product-card");

  if (!card) {
    return;
  }

  const productId = Number(card.dataset.productId);
  toggleProductSelection(productId);
});

/* Handle remove buttons inside the selected products list */
selectedProductsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".selected-product-remove");

  if (!removeButton) {
    return;
  }

  const productId = Number(removeButton.dataset.productId);
  removeSelectedProduct(productId);
});

/* Clear every selected product */
clearSelectedBtn.addEventListener("click", () => {
  selectedProductIds.clear();
  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
});

/* Send the selected products to OpenAI and display the generated routine */
generateRoutineBtn.addEventListener("click", async () => {
  const selectedProducts = getSelectedProducts();

  if (selectedProducts.length === 0) {
    appendMessage("assistant", t("selectAtLeastOne"));
    return;
  }

  /* Build a readable list of product names for the user message */
  const productNames = selectedProducts
    .map((product) => product.name)
    .join(", ");

  appendMessage(
    "user",
    tFormat("generateRoutineFor", { products: productNames }),
  );

  /* Show a loading message while we wait for the API response */
  const loadingMessage = appendMessage("assistant", t("routineLoading"));

  /* Build a JSON summary of each selected product to send to the AI */
  const productDetails = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  /* Call our Cloudflare Worker to generate a personalized routine */
  const routinePrompt = `Please create a personalized beauty routine using these products: ${JSON.stringify(productDetails)}`;

  try {
    const response = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional L'Oréal beauty advisor. When given a list of products, create a clear, step-by-step personalized beauty routine that explains how and when to use each product. You must reply in ${getCurrentLanguageName()}.`,
          },
          {
            role: "user",
            content: routinePrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(await getRequestErrorMessage(response));
    }

    /* Parse the response and display the routine in the chat window */
    const data = await response.json();
    const routineReply = data.choices?.[0]?.message?.content || "I could not generate a routine right now. Please try again.";
    loadingMessage.textContent = routineReply;

    /* Save both sides of this exchange to conversation history */
    conversationHistory.push({
      role: "user",
      content: routinePrompt,
    });
    conversationHistory.push({ role: "assistant", content: routineReply });
  } catch (error) {
    console.error("Routine generation failed.", error);
    loadingMessage.textContent = `I could not generate your routine right now. ${error.message}`;
  }
});

/* Handle follow-up questions in the chat window */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();

  if (!question) {
    return;
  }

  /* Show the user's message and clear the input right away */
  appendMessage("user", question);
  userInput.value = "";

  /* Show a loading message while waiting for the reply */
  const loadingMessage = appendMessage("assistant", t("chatLoading"));

  /* Add the user's question to the history before sending */
  conversationHistory.push({ role: "user", content: question });

  /* Call our Cloudflare Worker so the API key stays server-side */
  try {
    const response = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional L'Oréal beauty advisor with access to current web information. You only answer questions related to the generated routine and topics like skincare, haircare, makeup, and fragrance. If a question is unrelated, politely let the user know you can only help with beauty topics. When you cite sources, include them at the end of your response. You must reply in ${getCurrentLanguageName()}.`,
          },
          /* Spread the full history so the AI has all prior context */
          ...conversationHistory,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(await getRequestErrorMessage(response));
    }

    /* Parse the reply and display it in the chat window */
    const data = await response.json();
    const message = data.choices?.[0]?.message || {};
    const reply = message.content || "I could not generate a reply right now. Please try again.";
    loadingMessage.textContent = reply;

    /* If the AI returned URL citations, display them as clickable links */
    const annotations = message.annotations || [];
    const citations = annotations.filter(
      (annotation) => annotation.type === "url_citation",
    );

    if (citations.length > 0) {
      /* Build a citations section below the reply text */
      const citationsDiv = document.createElement("div");
      citationsDiv.className = "chat-citations";

      const citationsLabel = document.createElement("p");
      citationsLabel.textContent = "Sources:";
      citationsLabel.className = "chat-citations-label";
      citationsDiv.appendChild(citationsLabel);

      citations.forEach((annotation) => {
        const link = document.createElement("a");
        link.href = annotation.url_citation.url;
        link.textContent =
          annotation.url_citation.title || annotation.url_citation.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "chat-citation-link";
        citationsDiv.appendChild(link);
      });

      loadingMessage.appendChild(citationsDiv);
    }

    conversationHistory.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error("Chat request failed.", error);
    loadingMessage.textContent = `I could not reply right now. ${error.message}`;
  }
});

/* Update all static labels when the language changes */
function updateStaticText() {
  const siteTitle = document.getElementById("siteTitle");
  const siteSubtitle = document.getElementById("siteSubtitle");
  const selectedProductsHeading = document.getElementById(
    "selectedProductsHeading",
  );
  const chatHeading = document.getElementById("chatHeading");
  const userInputLabel = document.getElementById("userInputLabel");
  const sendLabel = document.getElementById("sendLabel");
  const footerCopyright = document.getElementById("footerCopyright");
  const footerPrivacy = document.getElementById("footerPrivacy");
  const footerTerms = document.getElementById("footerTerms");
  const footerContact = document.getElementById("footerContact");
  const quickLinkBeautyMagazine = document.getElementById(
    "quickLinkBeautyMagazine",
  );
  const quickLinkMakeup = document.getElementById("quickLinkMakeup");
  const quickLinkSkinCare = document.getElementById("quickLinkSkinCare");
  const quickLinkHairColor = document.getElementById("quickLinkHairColor");
  const quickLinkCommitments = document.getElementById("quickLinkCommitments");
  const rtlOptionDefault = document.getElementById("rtlOptionDefault");
  const rtlOptionEnglish = document.getElementById("rtlOptionEnglish");

  const categoryOptionDefault = document.getElementById(
    "categoryOptionDefault",
  );
  const categoryOptionCleanser = document.getElementById(
    "categoryOptionCleanser",
  );
  const categoryOptionMoisturizer = document.getElementById(
    "categoryOptionMoisturizer",
  );
  const categoryOptionHaircare = document.getElementById(
    "categoryOptionHaircare",
  );
  const categoryOptionMakeup = document.getElementById("categoryOptionMakeup");
  const categoryOptionHairColor = document.getElementById(
    "categoryOptionHairColor",
  );
  const categoryOptionHairStyling = document.getElementById(
    "categoryOptionHairStyling",
  );
  const categoryOptionMensGrooming = document.getElementById(
    "categoryOptionMensGrooming",
  );
  const categoryOptionSuncare = document.getElementById(
    "categoryOptionSuncare",
  );
  const categoryOptionFragrance = document.getElementById(
    "categoryOptionFragrance",
  );

  document.title = t("documentTitle");
  siteTitle.textContent = t("siteTitle");
  siteSubtitle.textContent = t("siteSubtitle");
  languageToggleBtn.textContent = t("languageToggle");
  rtlLanguageLabel.textContent = t("chooseLanguageLabel");
  rtlLanguageSelect.setAttribute("aria-label", t("rtlLanguageAria"));
  rtlOptionDefault.textContent = t("rtlOptionDefault");
  rtlOptionEnglish.textContent = t("rtlOptionEnglish");
  selectedProductsHeading.textContent = t("selectedProductsHeading");
  clearSelectedBtn.textContent = t("clearSelected");
  generateRoutineBtn.innerHTML =
    '<i class="fa-solid fa-wand-magic-sparkles"></i> ' + t("generateRoutine");
  chatHeading.textContent = t("chatHeading");
  userInputLabel.textContent = t("userInputLabel");
  sendLabel.textContent = t("sendLabel");
  userInput.placeholder = t("userInputPlaceholder");
  footerCopyright.textContent = t("footerCopyright");
  footerPrivacy.textContent = t("footerPrivacy");
  footerTerms.textContent = t("footerTerms");
  footerContact.textContent = t("footerContact");
  quickLinkBeautyMagazine.textContent = t("quickLinkBeautyMagazine");
  quickLinkMakeup.textContent = t("quickLinkMakeup");
  quickLinkSkinCare.textContent = t("quickLinkSkinCare");
  quickLinkHairColor.textContent = t("quickLinkHairColor");
  quickLinkCommitments.textContent = t("quickLinkCommitments");

  categoryOptionDefault.textContent = t("categoryDefault");
  categoryOptionCleanser.textContent = t("categoryCleanser");
  categoryOptionMoisturizer.textContent = t("categoryMoisturizer");
  categoryOptionHaircare.textContent = t("categoryHaircare");
  categoryOptionMakeup.textContent = t("categoryMakeup");
  categoryOptionHairColor.textContent = t("categoryHairColor");
  categoryOptionHairStyling.textContent = t("categoryHairStyling");
  categoryOptionMensGrooming.textContent = t("categoryMensGrooming");
  categoryOptionSuncare.textContent = t("categorySuncare");
  categoryOptionFragrance.textContent = t("categoryFragrance");
}

/* Keep product card button labels in sync with selected language */
function updateProductUiText() {
  const detailButtons = productsContainer.querySelectorAll(".details-toggle");

  detailButtons.forEach((button) => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.textContent = isExpanded
      ? t("hideDescription")
      : t("showDescription");
  });
}

/* Apply language and direction to the page */
function applyLanguage(languageCode) {
  const normalizedLanguage = String(languageCode || "en")
    .toLowerCase()
    .split("-")[0];

  currentLanguage = translations[normalizedLanguage]
    ? normalizedLanguage
    : "en";

  const isRtl = RTL_LANGUAGES.has(currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";

  if (rtlLanguageSelect) {
    rtlLanguageSelect.value = isRtl ? currentLanguage : "en";
  }

  updateStaticText();
  renderSelectedProducts();
  updateProductUiText();
  renderOrUpdateStarterMessage();

  if (categoryFilter.value) {
    const filteredProducts = allProducts.filter(
      (product) => product.category === categoryFilter.value,
    );
    displayProducts(filteredProducts);
  } else {
    showChooseCategoryPlaceholder();
  }
}

/* Automatically switch to RTL + translation when browser language is RTL */
function detectAndApplyLanguage() {
  const browserLanguage = (navigator.language || "en")
    .toLowerCase()
    .split("-")[0];

  if (RTL_LANGUAGES.has(browserLanguage)) {
    applyLanguage(browserLanguage);
    return;
  }

  applyLanguage("en");
}

/* Toggle language menu visibility */
languageToggleBtn.addEventListener("click", () => {
  const isHidden = rtlLanguageSelect.classList.toggle("hidden");
  languageToggleBtn.setAttribute("aria-expanded", String(!isHidden));
});

/* Allow manual language changes from the dropdown */
rtlLanguageSelect.addEventListener("change", (event) => {
  applyLanguage(event.target.value);
});

/* Start the page with saved selections and starter content */
async function initializeApp() {
  await loadProducts();
  loadSavedSelectedProducts();
  detectAndApplyLanguage();

  /* Remove any saved ids that no longer exist in products.json */
  const validProductIds = new Set(allProducts.map((product) => product.id));

  [...selectedProductIds].forEach((productId) => {
    if (!validProductIds.has(productId)) {
      selectedProductIds.delete(productId);
    }
  });

  saveSelectedProducts();
  renderSelectedProducts();

  renderOrUpdateStarterMessage();
}

initializeApp();
