import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import api from '../api';
import ui from '../components/ui';
import theme from '../theme';

/**
 * The native quiz runner mirrors the web one exactly: it holds selections and
 * posts them. The device never receives the answer key, so an inspected build
 * or a proxied response yields nothing useful.
 */
export default function Quiz({ route, navigation }) {
  const { moduleId } = route.params;
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .startAttempt(moduleId, { scope: 'module' })
      .then((data) => {
        setAttempt(data.attempt);
        setQuestions(data.questions);
      })
      .catch((err) => setError(err.message));
  }, [moduleId]);

  if (error) {
    return (
      <View style={[ui.screen, { padding: theme.space['5'] }]}>
        <View style={[ui.notice, ui.noticeDanger]}>
          <Text style={ui.bodyStrong}>{error}</Text>
        </View>
        <Pressable style={ui.btnSecondary} onPress={() => navigation.goBack()}>
          <Text style={ui.btnSecondaryText}>Back to the course</Text>
        </Pressable>
      </View>
    );
  }

  if (!attempt) {
    return (
      <View style={[ui.screen, { padding: theme.space['5'] }]}>
        <Text style={ui.body}>Setting up your quiz…</Text>
      </View>
    );
  }

  const current = questions[index];
  const answered = Object.keys(choices).length;
  const isLast = index === questions.length - 1;

  const submit = async () => {
    setBusy(true);
    try {
      const responses = Object.entries(choices).map(([q_id, selected]) => ({ q_id, selected }));
      const data = await api.submitAttempt(attempt.id, responses);
      navigation.replace('Results', { moduleId, data });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.overline}>
        Question {index + 1} of {questions.length} · {current.bloom}
      </Text>

      <View style={[ui.meterTrack, { marginBottom: theme.space['5'] }]}>
        <View style={[ui.meterFill, { width: `${Math.round((answered / questions.length) * 100)}%` }]} />
      </View>

      <Text style={[ui.h4, { marginBottom: theme.space['5'] }]}>{current.stem}</Text>

      {Object.entries(current.options).map(([letter, text]) => {
        const selected = choices[current.q_id] === letter;
        return (
          <Pressable
            key={letter}
            style={[ui.option, selected && ui.optionSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setChoices((prev) => ({ ...prev, [current.q_id]: letter }))}
          >
            <Text style={[ui.bodyStrong, { fontFamily: theme.font.display, width: 22 }]}>{letter}</Text>
            <Text style={[ui.bodyStrong, { flex: 1 }]}>{text}</Text>
          </Pressable>
        );
      })}

      <View style={{ flexDirection: 'row', gap: theme.space['3'], marginTop: theme.space['5'] }}>
        <Pressable
          style={[ui.btnSecondary, { flex: 1, opacity: index === 0 ? 0.5 : 1 }]}
          disabled={index === 0}
          onPress={() => setIndex((i) => i - 1)}
        >
          <Text style={ui.btnSecondaryText}>Back</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [ui.btnPrimary, pressed && ui.btnPrimaryPressed, { flex: 1 }]}
          disabled={busy || (isLast && answered === 0)}
          onPress={() => (isLast ? submit() : setIndex((i) => i + 1))}
        >
          <Text style={ui.btnPrimaryText}>{isLast ? (busy ? 'Sending…' : 'Submit') : 'Next'}</Text>
        </Pressable>
      </View>

      {isLast && answered < questions.length && (
        <Text style={[ui.caption, { marginTop: theme.space['3'] }]}>
          Unanswered questions are marked wrong. {questions.length - answered} left.
        </Text>
      )}
    </ScrollView>
  );
}
