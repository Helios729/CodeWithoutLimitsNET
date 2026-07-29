import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import api from '../api';
import ui from '../components/ui';
import theme from '../theme';

function Meter({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View
      style={ui.meterTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={[ui.meterFill, { width: `${pct}%` }]} />
    </View>
  );
}

export default function Catalogue({ navigation }) {
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setError(null);
    return api
      .catalogue()
      .then((data) => setModules(data.modules))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={ui.screen}>
      <FlatList
        contentContainerStyle={ui.content}
        data={modules}
        keyExtractor={(item) => item.module_id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.color.brand_secondary}
            onRefresh={() => {
              setRefreshing(true);
              load().finally(() => setRefreshing(false));
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: theme.space['4'] }}>
            <Text style={ui.overline}>Course catalogue</Text>
            <Text style={ui.h2}>Start anywhere</Text>
            {error && (
              <View style={[ui.notice, ui.noticeDanger]}>
                <Text style={ui.bodyStrong}>{error}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !error && (
            <View style={ui.notice}>
              <Text style={ui.body}>No courses published yet. Pull down to check again.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={ui.card}
            accessibilityRole="button"
            accessibilityLabel={`${item.module_title}, ${item.difficulty}, ${item.duration_min} minutes`}
            onPress={() => navigation.navigate('ModuleDetail', { moduleId: item.module_id })}
          >
            <Text style={ui.overline}>{item.difficulty}</Text>
            <Text style={[ui.h4, { marginBottom: theme.space['2'] }]}>
              {item.module_title.replace(/-L$/, '')}
            </Text>
            <Text style={[ui.caption, { marginBottom: theme.space['3'] }]}>{item.tagline}</Text>
            <Text style={[ui.caption, { marginBottom: theme.space['3'] }]}>
              {item.duration_min} min · {item.miniLessonCount} lessons
              {item.price_cents === 0 ? ' · Free' : ''}
            </Text>
            {item.progress && item.progress.status !== 'not_started' && (
              <Meter value={item.progress.completedMiniLessons} max={item.miniLessonCount} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
