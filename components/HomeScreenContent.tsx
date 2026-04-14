import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  onFilePress: () => void;
  onExamModelPress: () => void;
  onFlashcardsHistoryPress: () => void;
  onProblemSolverPress: () => void;
  onTutorPress: () => void;
};

export default function HomeScreenContent({
  onFilePress,
  onExamModelPress,
  onFlashcardsHistoryPress,
  onProblemSolverPress,
  onTutorPress,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Studyo Ai</Text>
      <Text style={styles.subtitle}>
        Convierte clases, archivos, imagenes y examenes en material de estudio.
      </Text>

      <View style={styles.cardContainer}>
        <Pressable style={styles.card} onPress={onFilePress}>
          <Text style={styles.cardEmoji}>Archivo</Text>
          <Text style={styles.cardTitle}>Centro de carga</Text>
          <Text style={styles.cardText}>
            Sube texto, PDF, imagenes o audio desde un solo lugar para generar material
            de estudio.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onExamModelPress}>
          <Text style={styles.cardEmoji}>Exam</Text>
          <Text style={styles.cardTitle}>Subir examenes</Text>
          <Text style={styles.cardText}>
            Analiza examenes anteriores y genera uno nuevo con estilo similar.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onProblemSolverPress}>
          <Text style={styles.cardEmoji}>Solve</Text>
          <Text style={styles.cardTitle}>Resolver problemas</Text>
          <Text style={styles.cardText}>
            Saca una foto de matematicas, fisica o quimica y recibe una correccion paso a paso.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onTutorPress}>
          <Text style={styles.cardEmoji}>Tutor</Text>
          <Text style={styles.cardTitle}>Tutor</Text>
          <Text style={styles.cardText}>
            Chatea con la IA para que te explique temas con ejemplos, formulas y resueltos.
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
      paddingBottom: 280,
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
