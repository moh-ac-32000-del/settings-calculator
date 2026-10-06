import { loadLanguage, type AppLanguage } from './language-store';

type Dictionary = Record<string, string>;

const dictionaries: Record<AppLanguage, Dictionary> = {
  ar: {},
  tr: {
    'الإعدادات الحاسبة': 'Hesap makinesi ayarları',
    'إعدادات الحاسبة': 'Hesap makinesi ayarları',
    'إعداداتك المحلية': 'Yerel ayarlarınız',
    'محفوظ على الجهاز': 'Cihaza kaydedildi',
    'سجل العمليات': 'İşlem kaydı',
    'الأرشيف': 'Arşiv',
    'العمليات': 'İşlemler',
    'الإعدادات': 'Ayarlar',
    'الأعمال': 'Kayıtlar',
    'البحث في الأرشيف': 'Arşivde ara',
    'ابحث باسم العميل أو نوع العمل': 'Müşteri veya iş türü ara',
    'الأقسام المستخدمة': 'Kullanılan bölümler',
    'لا توجد عمليات محفوظة': 'Kayıtlı işlem yok',
    'لا توجد نتائج مطابقة': 'Eşleşen sonuç yok',
    'تعديل العملية': 'İşlemi düzenle',
    'مشاركة واتساب': 'WhatsApp ile paylaş',
    'نوع العمل': 'İş türü',
    'مجموع الأقسام': 'Bölümler toplamı',
    'مصاريف الشحن': 'Nakliye masrafı',
    'مصاريف إضافية': 'Ek masraflar',
    'المجموع النهائي': 'Genel toplam',
    'إجمالي العملية': 'İşlem toplamı',
    'مجموع نتائج الأقسام الحالية + مصاريف الشحن': 'Mevcut bölüm sonuçları + nakliye masrafı',
    'الكمية': 'Miktar',
    'المواد': 'Malzemeler',
    'نتيجة القسم': 'Bölüm sonucu',
    'قسم الحساب': 'Hesap bölümü',
    'اختيار واحد': 'Tek seçim',
    'جمع المختار': 'Seçilenleri topla',
    'اختر مادة واحدة': 'Bir malzeme seçin',
    'محددة من إعدادات القسم': 'Bölüm ayarlarından belirlenir',
    'لا توجد مواد متاحة لهذا القسم حاليًا.': 'Bu bölüm için şu anda malzeme yok.',
    'اضغط لإدخال الرقم': 'Sayı girmek için dokunun',
    'اختر نوع العمل': 'İş türünü seçin',
    'اختر قالبًا للبدء بالحساب.': 'Hesaplamaya başlamak için bir şablon seçin.',
    'ترتيب العمليات': 'İş sıralaması',
    'تخصيص العرض': 'Görünümü özelleştir',
    'رتّب أنواع الأعمال أولًا، ثم افتح أي نوع لترتيب أقسامه.': 'Önce iş türlerini sıralayın, sonra bölümlerini sıralamak için bir tür açın.',
    'ترتيب أنواع الأعمال': 'İş türlerini sırala',
    'ترتيب الأقسام العام': 'Bölümleri sırala',
    'ترتيب الأقسام': 'Bölümleri sırala',
    'حفظ الترتيب': 'Sıralamayı kaydet',
    'السابق': 'Önceki',
    'التالي': 'Sonraki',
    'عمل حر': 'Serbest iş',
    'نوع العمل المحدد': 'Seçili iş türü',
    'إجراءات العملية': 'İşlem işlemleri',
    'العمل الحالي': 'Mevcut iş',
    'تعديل عملية محفوظة': 'Kayıtlı işlemi düzenle',
    'العودة إلى اختيار نوع العمل': 'İş türü seçimine dön',
    'اسم العميل': 'Müşteri adı',
    'مثال: أحمد': 'Örnek: Ahmet',
    'لا توجد أقسام لهذا العمل': 'Bu iş için bölüm yok',
    'جارٍ تجهيز القسم الأول': 'İlk bölüm hazırlanıyor',
    'ستظهر بيانات القسم الحالي هنا.': 'Mevcut bölüm bilgileri burada görünecek.',
    'مصاريف الشحن (تلقائي)': 'Nakliye masrafı (otomatik)',
    'مصاريف الشحن (تعديل يدوي)': 'Nakliye masrafı (manuel)',
    'تعديل يدوي': 'Manuel',
    'تلقائي': 'Otomatik',
    'غير محتسب': 'Hesaplanmadı',
    'قيمة مصاريف الشحن لهذه العملية': 'Bu işlem için nakliye masrafı',
    'قيمة المصاريف الإضافية لهذه العملية': 'Bu işlem için ek masraf',
    'إجمالي العملية': 'İşlem toplamı',
    'إنهاء العملية': 'İşlemi bitir',
    'حفظ التعديلات': 'Değişiklikleri kaydet',
    'إلغاء': 'İptal',
    'حذف آخر رقم': 'Son rakamı sil',
    'مسح الكمية': 'Miktarı temizle',
    'مسح': 'Temizle',
    'إدخال سريع': 'Hızlı giriş',
    'تعديل كمية هذا القسم فقط': 'Yalnızca bu bölümün miktarını değiştir',
    'مواد': 'malzeme',
    'فتح الإعدادات': 'Ayarları aç',
    'تأكيد العملية': 'İşlemi onayla',
    'نقل العملية': 'İşlemi taşı',
    'اختر نوع العمل الذي تريد نقل العملية إليه': 'İşlemi taşımak istediğiniz iş türünü seçin',
    'سيُحفظ العمل الحالي في الأرشيف قبل النقل، ويبقى اسم العميل كما هو.': 'Mevcut iş taşınmadan önce arşive kaydedilir ve müşteri adı korunur.',
    'لا توجد أنواع عمل أخرى متاحة للنقل إليها.': 'Taşınabilecek başka iş türü yok.',
    'مشاركة واستيراد الإعدادات': 'Ayarları paylaş ve içe aktar',
    'انقل المواد والأقسام وأنواع الأعمال عبر كود نصي محلي.': 'Malzemeleri, bölümleri ve iş türlerini yerel bir metin koduyla aktarın.',
    'مشاركة الإعدادات': 'Ayarları paylaş',
    'استيراد الإعدادات': 'Ayarları içe aktar',
    'إضافة مادة': 'Malzeme ekle',
    'إضافة قسم': 'Bölüm ekle',
    'إضافة نوع عمل': 'İş türü ekle',
    'المواد والأسعار': 'Malzemeler ve fiyatlar',
    'الأقسام': 'Bölümler',
    'أنواع الأعمال': 'İş türleri',
    'سجل الأسعار': 'Fiyat kaydı',
    'وحدات الحساب': 'Hesap birimleri',
    'قوالب العمل': 'İş şablonları',
    'سجل واحد للمواد التي تشتريها أو تستخدمها، مع سعر كل وحدة.': 'Satın aldığınız veya kullandığınız malzemeleri ve birim fiyatlarını kaydedin.',
    'مجموعات قابلة لإعادة الاستخدام من المواد مع قاعدة حساب واضحة.': 'Açık bir hesaplama kuralına sahip yeniden kullanılabilir malzeme grupları.',
    'اجمع الأقسام في أنواع الأعمال التي تعود إليها باستمرار.': 'Sık kullandığınız bölümleri iş türleri altında birleştirin.',
    'المواد في هذا القسم': 'Bu bölümdeki malzemeler',
    'اسم المادة': 'Malzeme adı',
    'سعر الوحدة': 'Birim fiyat',
    'طريقة الحساب': 'Hesaplama yöntemi',
    'اسم القسم': 'Bölüm adı',
    'اسم نوع العمل': 'İş türü adı',
    'الأقسام المضمنة': 'Dahil edilen bölümler',
    'إعداد مصاريف الشحن': 'Nakliye masraflarını ayarla',
    'مصاريف الشحن المرجعية': 'Referans nakliye masrafı',
    'الكمية المرجعية': 'Referans miktar',
    'يجب أن تكون أكبر من صفر.': 'Sıfırdan büyük olmalıdır.',
    'مفعّل': 'Etkin',
    'غير مفعّل': 'Devre dışı',
    'إضافة مادة موجودة': 'Mevcut malzeme ekle',
    'تمت إضافة كل المواد': 'Tüm malzemeler eklendi',
    'لا توجد مواد مرتبطة — عدّل القسم لإضافة مراجع.': 'Bağlı malzeme yok — referans eklemek için bölümü düzenleyin.',
    'لا توجد أقسام بعد': 'Henüz bölüm yok',
    'لا توجد أنواع أعمال بعد': 'Henüz iş türü yok',
    'لا توجد أقسام': 'Bölüm yok',
    'قسم غير موجود': 'Bölüm bulunamadı',
    'سجل الأسعار فارغ': 'Fiyat kaydı boş',
    'أضف مادة للبدء في بناء أقسام حساب قابلة لإعادة الاستخدام.': 'Yeniden kullanılabilir hesap bölümleri oluşturmak için bir malzeme ekleyin.',
    'حوّل مجموعة من المواد إلى جزء قابل لإعادة الاستخدام.': 'Bir malzeme grubunu yeniden kullanılabilir bir bölüme dönüştürün.',
    'أنشئ نوع عمل عندما تتكرر مجموعة من الأقسام.': 'Bir bölüm grubu tekrar kullanıldığında bir iş türü oluşturun.',
    'تُحفظ التغييرات تلقائيًا على هذا المتصفح.': 'Değişiklikler bu tarayıcıya otomatik olarak kaydedilir.',
    'اللغة / Language / Dil': 'Dil',
    'اختر لغة واجهة التطبيق.': 'Uygulama arayüzü dilini seçin.',
    'العربية': 'Arapça',
    'Türkçe': 'Türkçe',
    'English': 'İngilizce',
    'حفظ': 'Kaydet',
    'إغلاق': 'Kapat',
    'إضافة أول مادة': 'İlk malzemeyi ekle',
    'إضافة أول قسم': 'İlk bölümü ekle',
    'إضافة أول نوع عمل': 'İlk iş türünü ekle',
    'مشاركة الإعدادات': 'Ayarları paylaş',
    'نسخ الكود': 'Kodu kopyala',
    'لصق كود الإعدادات': 'Ayar kodunu yapıştır',
    'الصق كود الإعدادات هنا': 'Ayar kodunu buraya yapıştırın',
    'لصق من الحافظة': 'Panodan yapıştır',
    'معاينة الاستيراد': 'İçe aktarma önizlemesi',
    'معاينة الإعدادات': 'Ayar önizlemesi',
    'تأكيد الاستيراد': 'İçe aktarmayı onayla',
    'الاحتفاظ به': 'Koru',
    'إزالة': 'Kaldır',
    'حذف': 'Sil',
    'إغلاق النافذة': 'Pencereyi kapat',
    'إغلاق نافذة نقل العملية': 'İş taşıma penceresini kapat',
    'البحث في الأرشيف': 'Arşivde ara',
    'لا توجد أقسام مسجلة في هذه العملية.': 'Bu işlemde kayıtlı bölüm yok.',
    'التلقائي: ': 'Otomatik: ',
    'اليدوي: ': 'Manuel: ',
  },
  en: {
    'إعدادات الحاسبة': 'Calculator settings',
    'إعداداتك المحلية': 'Your local settings',
    'محفوظ على الجهاز': 'Saved on this device',
    'سجل العمليات': 'Operation log',
    'الأرشيف': 'Archive',
    'العمليات': 'Operations',
    'الإعدادات': 'Settings',
    'الأعمال': 'Records',
    'البحث في الأرشيف': 'Search archive',
    'ابحث باسم العميل أو نوع العمل': 'Search by customer or work type',
    'الأقسام المستخدمة': 'Used sections',
    'لا توجد عمليات محفوظة': 'No saved operations',
    'لا توجد نتائج مطابقة': 'No matching results',
    'تعديل العملية': 'Edit operation',
    'مشاركة واتساب': 'Share on WhatsApp',
    'نوع العمل': 'Work type',
    'مجموع الأقسام': 'Sections total',
    'مصاريف الشحن': 'Shipping expense',
    'مصاريف إضافية': 'Additional expenses',
    'المجموع النهائي': 'Final total',
    'إجمالي العملية': 'Operation total',
    'مجموع نتائج الأقسام الحالية + مصاريف الشحن': 'Current section results + shipping expense',
    'الكمية': 'Quantity',
    'المواد': 'Materials',
    'نتيجة القسم': 'Section result',
    'قسم الحساب': 'Calculation section',
    'اختيار واحد': 'Single choice',
    'جمع المختار': 'Sum selected',
    'اختر مادة واحدة': 'Choose one material',
    'محددة من إعدادات القسم': 'Defined by section settings',
    'لا توجد مواد متاحة لهذا القسم حاليًا.': 'No materials are currently available for this section.',
    'اضغط لإدخال الرقم': 'Tap to enter a number',
    'اختر نوع العمل': 'Choose work type',
    'اختر قالبًا للبدء بالحساب.': 'Choose a template to start calculating.',
    'ترتيب العمليات': 'Order operations',
    'تخصيص العرض': 'Customize view',
    'رتّب أنواع الأعمال أولًا، ثم افتح أي نوع لترتيب أقسامه.': 'Order work types first, then open a type to order its sections.',
    'ترتيب أنواع الأعمال': 'Order work types',
    'ترتيب الأقسام العام': 'Order sections',
    'ترتيب الأقسام': 'Order sections',
    'حفظ الترتيب': 'Save order',
    'السابق': 'Previous',
    'التالي': 'Next',
    'عمل حر': 'Free work',
    'نوع العمل المحدد': 'Selected work type',
    'إجراءات العملية': 'Operation actions',
    'العمل الحالي': 'Current work',
    'تعديل عملية محفوظة': 'Edit saved operation',
    'العودة إلى اختيار نوع العمل': 'Back to work type selection',
    'اسم العميل': 'Customer name',
    'مثال: أحمد': 'Example: Ahmed',
    'لا توجد أقسام لهذا العمل': 'No sections for this work',
    'جارٍ تجهيز القسم الأول': 'Preparing the first section',
    'ستظهر بيانات القسم الحالي هنا.': 'Current section data will appear here.',
    'مصاريف الشحن (تلقائي)': 'Shipping expense (automatic)',
    'مصاريف الشحن (تعديل يدوي)': 'Shipping expense (manual)',
    'تعديل يدوي': 'Manual',
    'تلقائي': 'Automatic',
    'غير محتسب': 'Not included',
    'قيمة مصاريف الشحن لهذه العملية': 'Shipping expense for this operation',
    'قيمة المصاريف الإضافية لهذه العملية': 'Additional expense for this operation',
    'إنهاء العملية': 'Finish operation',
    'حفظ التعديلات': 'Save changes',
    'إلغاء': 'Cancel',
    'حذف آخر رقم': 'Delete last digit',
    'مسح الكمية': 'Clear quantity',
    'مسح': 'Clear',
    'إدخال سريع': 'Quick input',
    'تعديل كمية هذا القسم فقط': 'Edit only this section quantity',
    'فتح الإعدادات': 'Open settings',
    'تأكيد العملية': 'Confirm operation',
    'نقل العملية': 'Move operation',
    'اختر نوع العمل الذي تريد نقل العملية إليه': 'Choose the work type to move the operation to',
    'سيُحفظ العمل الحالي في الأرشيف قبل النقل، ويبقى اسم العميل كما هو.': 'The current work will be saved to the archive before moving, and the customer name will remain unchanged.',
    'لا توجد أنواع عمل أخرى متاحة للنقل إليها.': 'No other work types are available for transfer.',
    'مشاركة واستيراد الإعدادات': 'Share and import settings',
    'انقل المواد والأقسام وأنواع الأعمال عبر كود نصي محلي.': 'Transfer materials, sections, and work types using a local text code.',
    'مشاركة الإعدادات': 'Share settings',
    'استيراد الإعدادات': 'Import settings',
    'إضافة مادة': 'Add material',
    'إضافة قسم': 'Add section',
    'إضافة نوع عمل': 'Add work type',
    'المواد والأسعار': 'Materials and prices',
    'الأقسام': 'Sections',
    'أنواع الأعمال': 'Work types',
    'سجل الأسعار': 'Price register',
    'وحدات الحساب': 'Calculation units',
    'قوالب العمل': 'Work templates',
    'سجل واحد للمواد التي تشتريها أو تستخدمها، مع سعر كل وحدة.': 'A single register for materials you buy or use, with a price for each unit.',
    'مجموعات قابلة لإعادة الاستخدام من المواد مع قاعدة حساب واضحة.': 'Reusable groups of materials with a clear calculation rule.',
    'اجمع الأقسام في أنواع الأعمال التي تعود إليها باستمرار.': 'Group sections into work types you use repeatedly.',
    'المواد في هذا القسم': 'Materials in this section',
    'اسم المادة': 'Material name',
    'سعر الوحدة': 'Unit price',
    'طريقة الحساب': 'Calculation method',
    'اسم القسم': 'Section name',
    'اسم نوع العمل': 'Work type name',
    'الأقسام المضمنة': 'Included sections',
    'إعداد مصاريف الشحن': 'Shipping expense settings',
    'مصاريف الشحن المرجعية': 'Reference shipping expense',
    'الكمية المرجعية': 'Reference quantity',
    'يجب أن تكون أكبر من صفر.': 'Must be greater than zero.',
    'مفعّل': 'Enabled',
    'غير مفعّل': 'Disabled',
    'إضافة مادة موجودة': 'Add existing material',
    'تمت إضافة كل المواد': 'All materials have been added',
    'لا توجد مواد مرتبطة — عدّل القسم لإضافة مراجع.': 'No linked materials — edit the section to add references.',
    'لا توجد أقسام بعد': 'No sections yet',
    'لا توجد أنواع أعمال بعد': 'No work types yet',
    'لا توجد أقسام': 'No sections',
    'قسم غير موجود': 'Section not found',
    'سجل الأسعار فارغ': 'Price register is empty',
    'أضف مادة للبدء في بناء أقسام حساب قابلة لإعادة الاستخدام.': 'Add a material to start building reusable calculation sections.',
    'حوّل مجموعة من المواد إلى جزء قابل لإعادة الاستخدام.': 'Turn a group of materials into a reusable section.',
    'أنشئ نوع عمل عندما تتكرر مجموعة من الأقسام.': 'Create a work type when a group of sections repeats.',
    'تُحفظ التغييرات تلقائيًا على هذا المتصفح.': 'Changes are saved automatically in this browser.',
    'اللغة / Language / Dil': 'Language',
    'اختر لغة واجهة التطبيق.': 'Choose the app interface language.',
    'العربية': 'Arabic',
    'Türkçe': 'Turkish',
    'English': 'English',
    'حفظ': 'Save',
    'إغلاق': 'Close',
    'إضافة أول مادة': 'Add first material',
    'إضافة أول قسم': 'Add first section',
    'إضافة أول نوع عمل': 'Add first work type',
    'نسخ الكود': 'Copy code',
    'لصق كود الإعدادات': 'Paste settings code',
    'الصق كود الإعدادات هنا': 'Paste settings code here',
    'لصق من الحافظة': 'Paste from clipboard',
    'معاينة الاستيراد': 'Import preview',
    'معاينة الإعدادات': 'Settings preview',
    'تأكيد الاستيراد': 'Confirm import',
    'الاحتفاظ به': 'Keep it',
    'إزالة': 'Remove',
    'حذف': 'Delete',
    'إغلاق النافذة': 'Close window',
    'إغلاق نافذة نقل العملية': 'Close move operation window',
    'لا توجد أقسام مسجلة في هذه العملية.': 'No sections are recorded in this operation.',
    'التلقائي: ': 'Automatic: ',
    'اليدوي: ': 'Manual: ',
  },
};

const ATTRIBUTES = ['placeholder', 'aria-label', 'title'] as const;
const originalTextByNode = new WeakMap<Text, string>();

function translateValue(value: string, dictionary: Dictionary) {
  const exact = dictionary[value];
  if (exact) return exact;
  if (value.startsWith('تعديل كمية ')) return dictionary['تعديل كمية هذا القسم فقط']?.replace('هذا القسم', value.slice('تعديل كمية '.length)) ?? value;
  if (value.startsWith('إزالة ')) return (dictionary['إزالة'] ?? 'إزالة') + ' ' + value.slice('إزالة '.length);
  if (value.startsWith('حذف ')) return (languageLabel(dictionary, 'حذف') ?? 'حذف') + ' ' + value.slice('حذف '.length);
  if (value.startsWith('تعديل ')) return (dictionary['تعديل العملية'] ?? 'تعديل') + ' ' + value.slice('تعديل '.length);
  return value;
}

function languageLabel(dictionary: Dictionary, key: string) {
  return dictionary[key];
}

function translateTree(language: AppLanguage) {
  const dictionary = dictionaries[language];
  const root = document.body;
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
    const original = originalTextByNode.get(textNode) ?? textNode.nodeValue ?? '';
    if (!originalTextByNode.has(textNode)) originalTextByNode.set(textNode, original);
    const trimmed = original.trim();
    if (!trimmed) continue;
    const translated = translateValue(trimmed, dictionary);
    const nextValue = translated !== trimmed ? original.replace(trimmed, translated) : original;
    if (textNode.nodeValue !== nextValue) textNode.nodeValue = nextValue;
  }

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of ATTRIBUTES) {
      const key = 'original' + attribute.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const saved = element.dataset[key] ?? element.getAttribute(attribute);
      if (!saved) continue;
      if (!element.dataset[key]) element.dataset[key] = saved;
      const translated = translateValue(saved, dictionary);
      if (element.getAttribute(attribute) !== translated) element.setAttribute(attribute, translated);
    }
  });
}

export function applyLanguage(language: AppLanguage = loadLanguage()) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dataset.language = language;
  translateTree(language);
}

export function startLanguageRuntime() {
  applyLanguage();
  const observer = new MutationObserver(() => applyLanguage());
  observer.observe(document.body, { childList: true, subtree: true });
  const onLanguageChange = () => applyLanguage(loadLanguage());
  window.addEventListener('settings-calculator-language-change', onLanguageChange);
  return () => {
    observer.disconnect();
    window.removeEventListener('settings-calculator-language-change', onLanguageChange);
  };
}
