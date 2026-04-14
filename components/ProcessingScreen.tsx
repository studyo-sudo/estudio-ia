import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  type?: 'archivo' | 'imagen' | 'audio' | 'examen' | 'problema';
};

export default function ProcessingScreen({ type = 'archivo' }: Props) {
  const title =
    type === 'imagen'
      ? 'Procesando imagen'
      : type === 'audio'
      ? 'Procesando audio'
      : type === 'examen'
      ? 'Procesando examen'
      : type === 'problema'
      ? 'Procesando problema'
      : 'Procesando archivo';

  const subtitle =
    type === 'imagen'
      ? 'Analizando el contenido  y generando material de estudio.'
      : type === 'audio'
      ? 'Transcribiendo el audio y generando material de estudio.'
      : type === 'examen'
      ? 'Detectando patrones y generando un nuevo modelo de examen.'
      : type === 'problema'
      ? 'Leyendo la imagen y resolviendo el ejercicio paso a paso.'
      : 'Leyendo el archivo y generando material de estudio.';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
