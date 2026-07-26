import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../App';
import ui from '../components/ui';
import theme from '../theme';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ui.content}>
        <Text style={ui.overline}>Welcome back</Text>
        <Text style={ui.h2}>Sign in</Text>

        {error && (
          <View style={[ui.notice, ui.noticeDanger]} accessibilityLiveRegion="polite">
            <Text style={ui.bodyStrong}>{error}</Text>
          </View>
        )}

        <Text style={[ui.caption, { marginBottom: theme.space['2'] }]}>Email</Text>
        <TextInput
          style={[ui.input, focused === 'email' && ui.inputFocused]}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email"
        />

        <Text style={[ui.caption, { marginBottom: theme.space['2'] }]}>Password</Text>
        <TextInput
          style={[ui.input, focused === 'password' && ui.inputFocused]}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          accessibilityLabel="Password"
        />

        <Pressable
          style={({ pressed }) => [ui.btnPrimary, pressed && ui.btnPrimaryPressed, busy && { opacity: 0.6 }]}
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={ui.btnPrimaryText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
