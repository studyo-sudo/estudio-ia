import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppPreferences } from '../contexts/AppPreferencesContext';

type CostRow = {
  label: string;
  detail: string;
  free: number | string;
  premium: number | string;
};

export default function CreditCostTable() {
  const { colors, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const creditsUnit = t('cost.creditsUnit');

  const costRows: CostRow[] = [
    {
      label: t('tutor.title'),
      detail: t('cost.text'),
      free: 96,
      premium: 48,
    },
    {
      label: t('problem.title'),
      detail: t('cost.image'),
      free: 200,
      premium: 100,
    },
    {
      label: t('file.title'),
      detail: t('cost.pdf'),
      free: 480,
      premium: 240,
    },
    {
      label: t('cost.audioPerMinute'),
      detail: t('cost.perMinute'),
      free: t('cost.blocked'),
      premium: 120,
    },
  ];

  const formatCostValue = (value: number | string) =>
    typeof value === 'number' ? `${value} ${creditsUnit}` : value;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('cost.title')}</Text>
      <Text style={styles.subtitle}>{t('cost.subtitle')}</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.flexTwo]}>{t('cost.function')}</Text>
        <Text style={styles.headerCell}>{t('cost.free')}</Text>
        <Text style={styles.headerCell}>{t('cost.premium')}</Text>
      </View>

      {costRows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={[styles.cell, styles.flexTwo]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowDetail}>{row.detail}</Text>
          </View>
          <Text style={styles.cell}>{formatCostValue(row.free)}</Text>
          <Text style={styles.cell}>{formatCostValue(row.premium)}</Text>
        </View>
      ))}

      <Text style={styles.note}>{t('cost.note')}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.creamSoft,
      padding: 20,
      marginTop: 18,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 6,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    headerCell: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.creamSoft,
    },
    cell: {
      color: colors.text,
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    rowDetail: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    flexTwo: {
      flex: 1.2,
    },
    note: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 12,
    },
  });
}
