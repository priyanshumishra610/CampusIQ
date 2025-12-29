import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// AI Campus Assistant Component
export const AICampusAssistant = ({
  onQuery,
  loading,
}: {
  onQuery: (query: string) => void;
  loading?: boolean;
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) {
      onQuery(query.trim());
      setQuery('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="smart-toy" size={20} color="#1e3a5f" style={styles.titleIcon} />
          <Text style={styles.title}>AI Campus Assistant</Text>
        </View>
        <Text style={styles.subtitle}>Ask questions about campus operations</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          value={query}
          onChangeText={setQuery}
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// AI Academic Advisor Component
export const AIAcademicAdvisor = ({
  onAdvice,
  loading,
}: {
  onAdvice: (topic: string) => void;
  loading?: boolean;
}) => {
  const topics = [
    'Study Tips',
    'Time Management',
    'Course Selection',
    'Career Guidance',
    'Exam Preparation',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="school" size={20} color="#1e3a5f" style={styles.titleIcon} />
          <Text style={styles.title}>AI Academic Advisor</Text>
        </View>
        <Text style={styles.subtitle}>Get personalized academic guidance</Text>
      </View>
      <View style={styles.topicsGrid}>
        {topics.map(topic => (
          <TouchableOpacity
            key={topic}
            style={[styles.topicButton, loading && styles.topicButtonDisabled]}
            onPress={() => onAdvice(topic)}
            disabled={loading}>
            <Text style={styles.topicButtonText}>{topic}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1e3a5f" />
          <Text style={styles.loadingText}>Generating advice...</Text>
        </View>
      )}
    </View>
  );
};

// AI Teaching Assistant Component
export const AITeachingAssistant = ({
  onSuggestion,
  loading,
}: {
  onSuggestion: (type: string) => void;
  loading?: boolean;
}) => {
  const suggestions = [
    {type: 'Lesson Plan', icon: 'menu-book'},
    {type: 'Assessment Ideas', icon: 'assignment'},
    {type: 'Student Engagement', icon: 'lightbulb'},
    {type: 'Grading Tips', icon: 'check-circle'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="person" size={20} color="#1e3a5f" style={styles.titleIcon} />
          <Text style={styles.title}>AI Teaching Assistant</Text>
        </View>
        <Text style={styles.subtitle}>Get teaching suggestions and tips</Text>
      </View>
      <View style={styles.suggestionsGrid}>
        {suggestions.map(item => (
          <TouchableOpacity
            key={item.type}
            style={[styles.suggestionButton, loading && styles.suggestionButtonDisabled]}
            onPress={() => onSuggestion(item.type)}
            disabled={loading}>
            <Icon name={item.icon} size={32} color="#1e3a5f" style={styles.suggestionIcon} />
            <Text style={styles.suggestionText}>{item.type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1e3a5f" />
          <Text style={styles.loadingText}>Generating suggestions...</Text>
        </View>
      )}
    </View>
  );
};

// AI Admin Copilot Component
export const AIAdminCopilot = ({
  onAction,
  loading,
}: {
  onAction: (action: string) => void;
  loading?: boolean;
}) => {
  const actions = [
    {action: 'Analytics Summary', icon: 'analytics'},
    {action: 'Risk Assessment', icon: 'warning'},
    {action: 'Resource Planning', icon: 'assignment'},
    {action: 'Trend Analysis', icon: 'trending-up'},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="security" size={20} color="#1e3a5f" style={styles.titleIcon} />
          <Text style={styles.title}>AI Admin Copilot</Text>
        </View>
        <Text style={styles.subtitle}>Intelligent administrative insights</Text>
      </View>
      <View style={styles.actionsGrid}>
        {actions.map(item => (
          <TouchableOpacity
            key={item.action}
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={() => onAction(item.action)}
            disabled={loading}>
            <Icon name={item.icon} size={32} color="#1e3a5f" style={styles.actionIcon} />
            <Text style={styles.actionText}>{item.action}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#1e3a5f" />
          <Text style={styles.loadingText}>Analyzing data...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#7a8a9a',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0c1222',
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  topicButtonDisabled: {
    opacity: 0.6,
  },
  topicButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  suggestionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
  },
  suggestionButtonDisabled: {
    opacity: 0.6,
  },
  suggestionIcon: {
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c1222',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c1222',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#7a8a9a',
  },
});

