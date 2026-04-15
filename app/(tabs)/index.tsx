import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import HomeScreenContent from '../../components/HomeScreenContent';
import { markStudySession, getStudyProgress, type StudyProgress } from '../../services/studyProgressStorage';

export default function HomeScreen() {
  const [studyProgress, setStudyProgress] = useState<StudyProgress | null>(null);

  const loadHomeState = useCallback(async () => {
    const progress = await getStudyProgress();
    setStudyProgress(progress);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeState();
    }, [loadHomeState])
  );

  const handleMarkStudyPress = async () => {
    const updated = await markStudySession();
    setStudyProgress(updated);
  };

  return (
    <HomeScreenContent
      onFilePress={() => router.push('/file')}
      onExamModelPress={() => router.push('/exam-model')}
      onProblemSolverPress={() => router.push('/problem-solver' as never)}
      onTutorPress={() => router.push('/tutor' as never)}
      onFlashcardsHistoryPress={() => router.push('/flashcards-history')}
      onStudyRoutePress={() => router.push('/study-route' as never)}
      onMarkStudyPress={handleMarkStudyPress}
      studyProgress={studyProgress}
    />
  );
}
