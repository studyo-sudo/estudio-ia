import { router } from 'expo-router';
import HomeScreenContent from '../../components/HomeScreenContent';

export default function HomeScreen() {
  return (
    <HomeScreenContent
      onFilePress={() => router.push('/file')}
      onExamModelPress={() => router.push('/exam-model')}
      onFlashcardsHistoryPress={() => router.push('/flashcards-history')}
    />
  );
}
