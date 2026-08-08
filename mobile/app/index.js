import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const { login, loading, error, restoreSession } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    restoreSession().then(hasSession => {
      if (hasSession) {
        router.replace('/dashboard');
      } else {
        setIsReady(true);
      }
    });
  }, [restoreSession]);

  const handleLogin = async () => {
    const success = await login(username, password);
    if (success) {
      router.replace('/dashboard');
    }
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FleetPulse</Text>
      <Text style={styles.subtitle}>Mobile Monitor</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#718096"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#718096"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0c1a2e" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#070d1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22d3ee',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1a202c',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 8,
    padding: 16,
    color: '#f7fafc',
    fontSize: 16,
  },
  error: {
    color: '#fc8181',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0c1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
