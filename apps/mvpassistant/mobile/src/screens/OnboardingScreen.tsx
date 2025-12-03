import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://api.mvpassistant.com';

interface Question {
  id: string;
  question: string;
  type: string;
  placeholder: string;
}

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/onboarding-questions`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Load questions error:', error);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/complete-onboarding`,
        answers,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigation.navigate('Main' as never);
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.question}>{currentQuestion.question}</Text>

        {currentQuestion.type === 'textarea' ? (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={answers[currentQuestion.id] || ''}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
            placeholder={currentQuestion.placeholder}
            multiline
            numberOfLines={6}
          />
        ) : (
          <TextInput
            style={styles.input}
            value={answers[currentQuestion.id] || ''}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
            placeholder={currentQuestion.placeholder}
          />
        )}

        <TouchableOpacity
          style={[styles.button, (!answers[currentQuestion.id]?.trim() || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!answers[currentQuestion.id]?.trim() || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : currentIndex === questions.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

