import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import api from '../api';
import ui from '../components/ui';
import theme from '../theme';

export default function Lesson({ route, navigation }) {
  const { moduleId, ml } = route.params;
  const [module, setModule] = useState(null);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    api.module(moduleId).then((data) => {
      setModule(data.module);
      setMarked(Boolean(data.module.progress?.completedMiniLessons?.includes(ml)));
    });
  }, [moduleId, ml]);

  if (!module) {
    return (
      <View style={[ui.screen, { padding: theme.space['5'] }]}>
        <Text style={ui.body}>Loading…</Text>
      </View>
    );
  }

  const lesson = module.mini_lessons.find((l) => l.ml === ml);
  const next = module.mini_lessons.find((l) => l.ml === ml + 1);

  const markRead = async () => {
    setMarked(true);
    try {
      await api.completeLesson(moduleId, ml);
    } catch {
      setMarked(false);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.overline}>
        Lesson {lesson.ml} of {module.mini_lessons.length}
      </Text>
      <Text style={ui.h2}>{lesson.title}</Text>

      {lesson.concepts.map((concept) => (
        <View key={concept.title} style={{ marginBottom: theme.space['6'] }}>
          <Text style={[ui.h4, { marginBottom: theme.space['3'] }]}>{concept.title}</Text>
          <Text style={[ui.bodyStrong, { marginBottom: theme.space['4'] }]}>{concept.explanation}</Text>

          {Boolean(concept.worked_example) && (
            <View style={ui.card}>
              <Text style={ui.overline}>Worked example</Text>
              <Text style={ui.bodyStrong}>{concept.worked_example}</Text>
            </View>
          )}

          {concept.source_refs?.length > 0 && (
            <Text style={ui.caption}>Source: {concept.source_refs.join(', ')}</Text>
          )}
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [marked ? ui.btnSecondary : ui.btnPrimary, pressed && !marked && ui.btnPrimaryPressed]}
        onPress={markRead}
        disabled={marked}
        accessibilityRole="button"
      >
        <Text style={marked ? ui.btnSecondaryText : ui.btnPrimaryText}>
          {marked ? 'Marked as read' : 'Mark as read'}
        </Text>
      </Pressable>

      <Pressable
        style={[ui.btnSecondary, { marginTop: theme.space['3'] }]}
        accessibilityRole="button"
        onPress={() =>
          next
            ? navigation.replace('Lesson', { moduleId, ml: next.ml })
            : navigation.navigate('Quiz', { moduleId })
        }
      >
        <Text style={ui.btnSecondaryText}>{next ? `Next: ${next.title}` : 'Take the quiz'}</Text>
      </Pressable>
    </ScrollView>
  );
}
