import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  onPdfPress: () => void;
  onAudioPress: () => void;
  onPhotoPress: () => void;
  onExamModelPress: () => void;
  onFlashcardsHistoryPress: () => void;
  plan: 'free' | 'premium';
  credits: number;
};

export default function HomeScreenContent({
  onPdfPress,
  onAudioPress,
  onPhotoPress,
  onExamModelPress,
  onFlashcardsHistoryPress,
  plan,
  credits,
}: Props) {
  const isPremium = plan === 'premium';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Studyo Ai</Text>
      <Text style={styles.subtitle}>
        Convierte clases, PDFs, imagenes y examenes en material de estudio.
      </Text>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>
            {isPremium ? 'Premium activo' : 'Plan Free'}
          </Text>
          <Text style={styles.statusCredits}>{credits} creditos</Text>
        </View>

        <Text style={styles.statusText}>
          {isPremium
            ? 'Tu plan incluye uso amplio y creditos extra si necesitas mas.'
            : 'El plan free usa anuncios, limites semanales y creditos mas caros.'}
        </Text>

        <View style={styles.statusButtonsRow}>
          <Pressable
            style={styles.primaryMiniButton}
            onPress={() => router.push('/pricing')}
          >
            <Text style={styles.primaryMiniButtonText}>
              {isPremium ? 'Ver plan' : 'Hazte Premium'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryMiniButton}
            onPress={() => router.push('/credits')}
          >
            <Text style={styles.secondaryMiniButtonText}>Comprar creditos</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Pressable style={styles.card} onPress={onPdfPress}>
          <Text style={styles.cardEmoji}>PDF</Text>
          <Text style={styles.cardTitle}>Subir archivo</Text>
          <Text style={styles.cardText}>
            Genera resumenes, preguntas, flashcards y examen.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onAudioPress}>
          <Text style={styles.cardEmoji}>Audio</Text>
          <Text style={styles.cardTitle}>Grabar clase</Text>
          <Text style={styles.cardText}>
            Transcribe el audio y crea material de estudio.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onPhotoPress}>
          <Text style={styles.cardEmoji}>Foto</Text>
          <Text style={styles.cardTitle}>Foto de texto</Text>
          <Text style={styles.cardText}>
            Analiza pizarrones, apuntes o cualquier imagen con texto.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onExamModelPress}>
          <Text style={styles.cardEmoji}>Exam</Text>
          <Text style={styles.cardTitle}>Subir examenes</Text>
          <Text style={styles.cardText}>
            Analiza examenes anteriores y genera uno nuevo con estilo similar.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onFlashcardsHistoryPress}>
          <Text style={styles.cardEmoji}>Cards</Text>
          <Text style={styles.cardTitle}>Flashcards</Text>
          <Text style={styles.cardText}>
            Abri el historial de flashcards generadas y estudia cuando quieras.
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 140,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  statusTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  statusCredits: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '700',
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryMiniButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryMiniButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryMiniButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryMiniButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
  },
  cardEmoji: {
    color: '#93c5fd',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
});
