import { StyleSheet, Text, View } from 'react-native';
import { APP_COLORS } from '../constants/theme';

type CostRow = {
  label: string;
  free: string;
  premium: string;
};

const COST_ROWS: CostRow[] = [
  {
    label: 'Texto',
    free: '96 creditos',
    premium: '48 creditos',
  },
  {
    label: 'Imagen',
    free: '200 creditos',
    premium: '100 creditos',
  },
  {
    label: 'PDF',
    free: '480 creditos',
    premium: '240 creditos',
  },
  {
    label: 'Audio por minuto',
    free: 'Bloqueado',
    premium: '120 creditos',
  },
];

export default function CreditCostTable() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tabla de costos</Text>
      <Text style={styles.subtitle}>Esta es la referencia actual para entender cuanto cuesta cada tipo de uso.</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.flexTwo]}>Uso</Text>
        <Text style={styles.headerCell}>Free</Text>
        <Text style={styles.headerCell}>Premium</Text>
      </View>

      {COST_ROWS.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.cell, styles.flexTwo]}>{row.label}</Text>
          <Text style={styles.cell}>{row.free}</Text>
          <Text style={styles.cell}>{row.premium}</Text>
        </View>
      ))}

      <Text style={styles.note}>* El consumo puede variar segun el tamano y la complejidad del archivo o imagen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_COLORS.creamSoft,
    padding: 20,
    marginTop: 18,
    shadowColor: APP_COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    color: APP_COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: APP_COLORS.textMuted,
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
    color: APP_COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.creamSoft,
  },
  cell: {
    color: APP_COLORS.text,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  flexTwo: {
    flex: 1.2,
  },
  note: {
    color: APP_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});
