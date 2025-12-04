import { RecordMode, IndividualType, CalculationResult } from '../types';

export const calculateEarnings = (
  mode: RecordMode,
  quantity: number,
  individualType?: IndividualType,
  areaIdCount: number = 1
): CalculationResult => {
  // Safe defaults
  const qty = Math.max(0, quantity);

  if (mode === RecordMode.INDIVIDUAL) {
    if (individualType === IndividualType.COLLECTION) {
      // Opção B: 1 coleta = £0.80
      return {
        value: qty * 0.80,
        breakdown: `${qty} coletas × £0.80`
      };
    } else {
      // Opção A: 1 libra por parcela (Default)
      return {
        value: qty * 1.00,
        breakdown: `${qty} parcelas × £1.00`
      };
    }
  } else {
    // Mode AREA
    // 1 ID -> £180 fixed
    if (areaIdCount === 1) {
      return {
        value: 180.00,
        breakdown: `Daily (1 ID) - Valor Fixo`
      };
    }

    // 2 IDs
    // < 150 parcelas → 260
    if (qty < 150) {
      return {
        value: 260.00,
        breakdown: `Daily (2 IDs, <150 unid.)`
      };
    }
    // 150 a 250 parcelas → 300
    if (qty <= 250) {
      return {
        value: 300.00,
        breakdown: `Daily (2 IDs, 150-250 unid.)`
      };
    }
    // > 250 parcelas → 360
    return {
      value: 360.00,
      breakdown: `Daily (2 IDs, >250 unid.)`
    };
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(value);
};