import { View, Text, ScrollView, Pressable } from 'react-native';
import ui from '../components/ui';
import theme from '../theme';

export default function Results({ route, navigation }) {
  const { moduleId, data } = route.params;
  const { result, feedback } = data;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.overline}>Quiz result</Text>
      <Text style={ui.h1}>
        {result.score} of {result.total} · {result.percentage}%
      </Text>

      <View style={[ui.notice, result.passed ? ui.noticeSuccess : ui.noticeDanger]}>
        <Text style={[ui.bodyStrong, { color: result.passed ? theme.color.success : theme.color.danger }]}>
          {result.passed ? 'Passed' : 'Not yet'}
        </Text>
        <Text style={ui.caption}>Pass mark is {result.passThresholdPct}%.</Text>
      </View>

      <Text style={[ui.h4, { marginBottom: theme.space['3'] }]}>By level</Text>
      {Object.entries(result.bloomBreakdown).map(([level, counts]) => (
        <View key={level} style={{ marginBottom: theme.space['4'] }}>
          <Text style={ui.caption}>
            {level} — {counts.correct} of {counts.total}
          </Text>
          <View style={ui.meterTrack}>
            <View style={[ui.meterFill, { width: `${Math.round((counts.correct / counts.total) * 100)}%` }]} />
          </View>
        </View>
      ))}

      <Text style={[ui.h4, { marginTop: theme.space['5'], marginBottom: theme.space['3'] }]}>Review</Text>
      {feedback.map((item) => (
        <View key={item.q_id} style={[ui.card, item.correct ? ui.optionCorrect : ui.optionIncorrect]}>
          <Text
            style={[
              ui.overline,
              { color: item.correct ? theme.color.success : theme.color.danger }
            ]}
          >
            {item.correct ? 'Correct' : 'Incorrect'} · {item.bloom}
          </Text>
          <Text style={[ui.h4, { marginBottom: theme.space['3'] }]}>{item.stem}</Text>
          <Text style={ui.caption}>
            You chose {item.selected}: {item.selectedText}
          </Text>
          {!item.correct && (
            <Text style={[ui.caption, { marginTop: theme.space['2'] }]}>
              Correct answer {item.correctOption}: {item.correctText}
            </Text>
          )}
          <Text style={[ui.caption, { marginTop: theme.space['3'] }]}>{item.explanation}</Text>
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [ui.btnPrimary, pressed && ui.btnPrimaryPressed]}
        onPress={() => navigation.navigate('ModuleDetail', { moduleId })}
      >
        <Text style={ui.btnPrimaryText}>Back to the course</Text>
      </Pressable>
    </ScrollView>
  );
}
