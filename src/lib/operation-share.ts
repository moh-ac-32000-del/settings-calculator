import type { ArchivedOperationDraft } from '@/lib/operations-archive-store';
import { formatAmount, formatWesternNumber } from '@/lib/operations-utils';
import { translateKey } from '@/lib/i18n';

function titleLine(value: string) {
  return '*' + value + '*';
}

export function buildOperationShareText(record: ArchivedOperationDraft) {
  const lines = [
    titleLine(translateKey('whatsappTitle')),
    '👤 ' + record.name,
  ];

  if (record.workTypeName) {
    lines.push('🔧 ' + record.workTypeName);
  }

  lines.push('', translateKey('whatsappMaterials'));

  for (const section of record.sections) {
    const unitPrice = section.quantity ? section.result / section.quantity : 0;
    const quantity = formatWesternNumber(section.quantity);
    const total = formatAmount(section.result);
    lines.push('• *' + section.name + '* — ' + quantity + ' × ' + formatAmount(unitPrice) + ' = *' + total + '*');
    const materials = section.materials.map((material) => material.name + ' ' + formatAmount(material.price)).join(' · ');
    if (materials) lines.push('  ' + materials);
    lines.push('---');
  }

  if (record.sections.length > 0) lines.pop();
  if (record.shipping.included) {
    lines.push(translateKey('whatsappShipping') + ': *' + formatWesternNumber(record.shipping.amount) + '*');
  }
  if ((record.additionalExpenses ?? 0) > 0) {
    lines.push(translateKey('whatsappAdditional') + ': *' + formatWesternNumber(record.additionalExpenses ?? 0) + '*');
  }
  lines.push(translateKey('whatsappFinal') + ': *' + formatAmount(record.finalTotal) + '*');

  return lines.join('\n');
}
