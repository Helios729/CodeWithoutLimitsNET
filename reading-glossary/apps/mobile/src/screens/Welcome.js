import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import ui from '../components/ui';
import theme from '../theme';
import KenscoffMountains from '../components/KenscoffMountains';

export default function Welcome({ navigation }) {
  const { width } = useWindowDimensions();

  return (
    <View style={ui.screen}>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.space['5'] }}>
        <Text style={ui.overline}>Mondial Connections · Community Changers</Text>
        <Text style={ui.h1}>Code Without Limits</Text>
        <Text style={ui.body}>
          Ten courses in artificial intelligence, programming and the web. Every explanation names
          a source you can open for free.
        </Text>
      </View>

      <KenscoffMountains width={width} height={200} />

      <View style={{ padding: theme.space['5'], gap: theme.space['3'] }}>
        <Pressable
          style={({ pressed }) => [ui.btnPrimary, pressed && ui.btnPrimaryPressed]}
          accessibilityRole="button"
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={ui.btnPrimaryText}>Sign in</Text>
        </Pressable>

        <Pressable
          style={ui.btnSecondary}
          accessibilityRole="button"
          onPress={() => navigation.navigate('Catalogue')}
        >
          <Text style={ui.btnSecondaryText}>Look around first</Text>
        </Pressable>

        <Text style={[ui.caption, { textAlign: 'center' }]}>
          You can read the first lesson of any course without an account.
        </Text>
      </View>
    </View>
  );
}
