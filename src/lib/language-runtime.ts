import { loadLanguage, type AppLanguage } from './language-store';

type Dictionary = Record<string, string>;

const dictionaries: Record<AppLanguage, Dictionary> = {
  ar: {},
  tr: {
    'الإعدادات': 'Ayarlar',
    'الأرشيف': 'Arşiv',
    'العمليات': 'İşlemler',
    'سجل العمليات': 'İşlem kaydı',
    'البحث في الأرشيف': 'Arşivde ara',
    'ابحث باسم العميل أو نوع العمل': 'Müşteri veya iş türü ara',
    'الأعمال': 'İş',
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
    'الكمية': 'Miktar',
    'المواد': 'Malzemeler',
    'نتيجة القسم': 'Bölüm sonucu',
    'اختر نوع العمل': 'İş türünü seçin',
    'فتح الإعدادات': 'Ayarları aç',
    'الإعدادات العامة': 'Genel ayarlar',
    'اختر لغة واجهة التطبيق.': 'Uygulama arayüzü dilini seçin.',
    'العربية': 'Arapça',
    'Türkçe': 'Türkçe',
    'English': 'İngilizce',
    'اللغة / Language / Dil': 'Dil',
    'حفظ': 'Kaydet',
    'إلغاء': 'İptal',
    'مسح': 'Temizle',
    'قسم الحساب': 'Hesap bölümü',
    'اختيار واحد': 'Tek seçim',
    'جمع المختار': 'Seçilenleri topla',
    'اختر مادة واحدة': 'Bir malzeme seçin',
    'قيمة المصاريف الإضافية لهذه العملية': 'Bu işlem için ek masraf tutarı',
    'مصاريف الشحن (تلقائي)': 'Nakliye masrafı (otomatik)',
    'مصاريف الشحن (تعديل يدوي)': 'Nakliye masrafı (manuel)',
    'غير محتسب': 'Hesaplanmadı',
    'المواد والأقسام:': 'Malzemeler ve bölümler:',
    'النتيجة': 'Sonuç',
  },
  en: {
    'الإعدادات': 'Settings',
    'الأرشيف': 'Archive',
    'العمليات': 'Operations',
    'سجل العمليات': 'Operation log',
    'البحث في الأرشيف': 'Search archive',
    'ابحث باسم العميل أو نوع العمل': 'Search by customer or work type',
    'الأعمال': 'Records',
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
    'الكمية': 'Quantity',
    'المواد': 'Materials',
    'نتيجة القسم': 'Section result',
    'اختر نوع العمل': 'Choose work type',
    'فتح الإعدادات': 'Open settings',
    'الإعدادات العامة': 'General settings',
    'اختر لغة واجهة التطبيق.': 'Choose the app interface language.',
    'العربية': 'Arabic',
    'Türkçe': 'Turkish',
    'English': 'English',
    'اللغة / Language / Dil': 'Language',
    'حفظ': 'Save',
    'إلغاء': 'Cancel',
    'مسح': 'Clear',
    'قسم الحساب': 'Calculation section',
    'اختيار واحد': 'Single choice',
    'جمع المختار': 'Sum selected',
    'اختر مادة واحدة': 'Choose one material',
    'قيمة المصاريف الإضافية لهذه العملية': 'Additional expense for this operation',
    'مصاريف الشحن (تلقائي)': 'Shipping expense (automatic)',
    'مصاريف الشحن (تعديل يدوي)': 'Shipping expense (manual)',
    'غير محتسب': 'Not included',
    'المواد والأقسام:': 'Materials and sections:',
    'النتيجة': 'Result',
  },
};

const ATTRIBUTES = ['placeholder', 'aria-label', 'title'] as const;

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

    const original = textNode.dataset.originalText ?? textNode.nodeValue ?? '';
    if (!textNode.dataset.originalText) textNode.dataset.originalText = original;

    const trimmed = original.trim();
    if (!trimmed) continue;

    const translated = dictionary[trimmed];
    const nextValue = translated ? original.replace(trimmed, translated) : original;
    if (textNode.nodeValue !== nextValue) textNode.nodeValue = nextValue;
  }

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of ATTRIBUTES) {
      const key = 'original' + attribute.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const saved = element.dataset[key] ?? element.getAttribute(attribute);
      if (!saved) continue;
      if (!element.dataset[key]) element.dataset[key] = saved;

      const translated = dictionary[saved] ?? saved;
      if (element.getAttribute(attribute) !== translated) {
        element.setAttribute(attribute, translated);
      }
    }
  });
}

export function applyLanguage(language: AppLanguage = loadLanguage()) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  translateTree(language);
}

export function startLanguageRuntime() {
  applyLanguage();

  // Observe only newly rendered elements. Observing characterData creates a
  // feedback loop because translation itself changes text nodes.
  const observer = new MutationObserver(() => applyLanguage());
  observer.observe(document.body, { childList: true, subtree: true });

  const onLanguageChange = () => applyLanguage(loadLanguage());
  window.addEventListener('settings-calculator-language-change', onLanguageChange);

  return () => {
    observer.disconnect();
    window.removeEventListener('settings-calculator-language-change', onLanguageChange);
  };
}
