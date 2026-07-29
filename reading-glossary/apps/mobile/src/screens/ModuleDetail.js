import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import api from '../api';
import ui from '../components/ui';
import theme from '../theme';

export default function ModuleDetail({ route, navigation }) {
  const { moduleId } = route.params;
  const [module, setModule] = useState(null);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .module(moduleId)
      .then((data) => {
        setModule(data.module);
        navigation.setOptions({ title: data.module.module_title.replace(/-L$/, '') });
      })
      .catch((err) => setError(err.message));
    api
      .quizOutline(moduleId)
      .then(setOutline)
      .catch(() => {});
  }, [moduleId]);

  if (error) {
    return (
      <View style={[ui.screen, { padding: theme.space['5'] }]}>
        <View style={[ui.notice, ui.noticeDanger]}>
          <Text style={ui.bodyStrong}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!module) {
    return (
      <View style={[ui.screen, { padding: theme.space['5'] }]}>
        <Text style={ui.body}>Loading…</Text>
      </View>
    );
  }

  const completed = module.progress?.completedMiniLessons ?? [];

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.overline}>
        {module.difficulty} · {module.duration_min} minutes
      </Text>
      <Text style={ui.h2}>{module.module_title.replace(/-L$/, '')}</Text>
      <Text style={[ui.body, { marginBottom: theme.space['5'] }]}>
        {module.description || module.tagline}
      </Text>

      {module.demo?.active && (
        <View style={ui.notice}>
          <Text style={ui.bodyStrong}>Preview</Text>
          <Text style={ui.caption}>{module.demo.message}</Text>
        </View>
      )}

      <Text style={[ui.h4, { marginBottom: theme.space['3'] }]}>Lessons</Text>
      {module.mini_lessons.map((lesson) => (
        <Pressable
          key={lesson.ml}
          style={ui.card}
          accessibilityRole="button"
          disabled={lesson.locked}
          onPress={() => navigation.navigate('Lesson', { moduleId, ml: lesson.ml })}
        >
          <Text style={ui.overline}>
            Lesson {lesson.ml}
            {completed.includes(lesson.ml) ? ' · Read' : ''}
            {lesson.locked ? ' · Locked' : ''}
          </Text>
          <Text style={ui.h4}>{lesson.title}</Text>
        </Pressable>
      ))}

      {outline && (
        <Pressable
          style={({ pressed }) => [ui.btnPrimary, pressed && ui.btnPrimaryPressed, { marginTop: theme.space['4'] }]}
          accessibilityRole="button"
          onPress={() => navigation.navigate('Quiz', { moduleId })}
        >
          <Text style={ui.btnPrimaryText}>
            Take the quiz · {outline.totals?.questions ?? ''} questions
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
