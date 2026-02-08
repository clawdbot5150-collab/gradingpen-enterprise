import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ProgressBar,
  FAB,
  Text,
  Divider,
  Avatar,
  IconButton,
  Badge,
  Surface,
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';

// Import API services
import { 
  getAssignmentSubmissions, 
  gradeSubmission, 
  gradeBatchSubmissions 
} from '../../services/api';

const { width } = Dimensions.get('window');

const GradingScreen = ({ route, navigation }) => {
  const { assignmentId, assignmentTitle } = route.params;
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [batchGrading, setBatchGrading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const queryClient = useQueryClient();

  // Set navigation title
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        title: assignmentTitle || 'Grade Submissions',
      });
    }, [navigation, assignmentTitle])
  );

  // Fetch submissions for the assignment
  const {
    data: submissions,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['submissions', assignmentId],
    () => getAssignmentSubmissions(assignmentId),
    {
      onError: (error) => {
        showMessage({
          message: 'Error',
          description: 'Failed to load submissions',
          type: 'danger',
        });
      },
    }
  );

  // Grade single submission mutation
  const gradeSingleMutation = useMutation(gradeSubmission, {
    onSuccess: (data, variables) => {
      showMessage({
        message: 'Success',
        description: `Graded submission for ${variables.studentName}`,
        type: 'success',
      });
      queryClient.invalidateQueries(['submissions', assignmentId]);
    },
    onError: (error, variables) => {
      showMessage({
        message: 'Error',
        description: `Failed to grade submission for ${variables.studentName}`,
        type: 'danger',
      });
    },
  });

  // Batch grading mutation
  const batchGradingMutation = useMutation(gradeBatchSubmissions, {
    onMutate: () => {
      setBatchGrading(true);
    },
    onSuccess: (data) => {
      setBatchGrading(false);
      setSelectedSubmissions([]);
      showMessage({
        message: 'Success',
        description: `Graded ${data.successCount} submissions successfully`,
        type: 'success',
      });
      queryClient.invalidateQueries(['submissions', assignmentId]);
    },
    onError: (error) => {
      setBatchGrading(false);
      showMessage({
        message: 'Error',
        description: 'Batch grading failed',
        type: 'danger',
      });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleGradeSubmission = (submission) => {
    navigation.navigate('SubmissionDetail', {
      submissionId: submission.id,
      assignmentId,
      studentName: submission.student.name,
    });
  };

  const handleQuickGrade = (submission) => {
    Alert.alert(
      'Quick AI Grade',
      `Grade submission from ${submission.student.name} using AI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grade',
          onPress: () => {
            gradeSingleMutation.mutate({
              submissionId: submission.id,
              studentName: submission.student.name,
              useAI: true,
            });
          },
        },
      ]
    );
  };

  const handleBatchGrade = () => {
    if (selectedSubmissions.length === 0) {
      showMessage({
        message: 'No submissions selected',
        description: 'Please select submissions to grade',
        type: 'warning',
      });
      return;
    }

    Alert.alert(
      'Batch Grade',
      `Grade ${selectedSubmissions.length} submissions using AI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grade All',
          onPress: () => {
            batchGradingMutation.mutate({
              assignmentId,
              submissionIds: selectedSubmissions,
            });
          },
        },
      ]
    );
  };

  const toggleSubmissionSelection = (submissionId) => {
    setSelectedSubmissions((prev) => {
      if (prev.includes(submissionId)) {
        return prev.filter((id) => id !== submissionId);
      } else {
        return [...prev, submissionId];
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'needs_review':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'graded':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'needs_review':
        return 'warning';
      default:
        return 'help';
    }
  };

  const ungradedSubmissions = submissions?.filter(s => s.status !== 'graded') || [];
  const gradedSubmissions = submissions?.filter(s => s.status === 'graded') || [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ProgressBar indeterminate />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#f44336" />
        <Text style={styles.errorText}>Failed to load submissions</Text>
        <Button mode="contained" onPress={refetch}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Grading Progress</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{gradedSubmissions.length}</Text>
                <Text style={styles.statLabel}>Graded</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#ff9800' }]}>
                  {ungradedSubmissions.length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {submissions?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
            <ProgressBar
              progress={
                submissions?.length
                  ? gradedSubmissions.length / submissions.length
                  : 0
              }
              color="#4caf50"
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {/* Batch Grading Controls */}
        {ungradedSubmissions.length > 0 && (
          <Surface style={styles.batchControls}>
            <View style={styles.batchHeader}>
              <Text variant="titleMedium">Batch Actions</Text>
              <Chip
                icon="auto-fix-high"
                mode="outlined"
                compact
                onPress={() => {
                  setSelectedSubmissions(
                    ungradedSubmissions.map((s) => s.id)
                  );
                }}
              >
                Select All Pending
              </Chip>
            </View>
            {selectedSubmissions.length > 0 && (
              <View style={styles.batchActions}>
                <Badge
                  visible={selectedSubmissions.length > 0}
                  style={styles.selectionBadge}
                >
                  {selectedSubmissions.length}
                </Badge>
                <Button
                  mode="contained"
                  icon="auto-awesome"
                  loading={batchGrading}
                  disabled={batchGrading}
                  onPress={handleBatchGrade}
                  style={styles.batchButton}
                >
                  Grade Selected with AI
                </Button>
              </View>
            )}
          </Surface>
        )}

        {/* Ungraded Submissions */}
        {ungradedSubmissions.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Pending Submissions ({ungradedSubmissions.length})
            </Text>
            {ungradedSubmissions.map((submission) => (
              <Card
                key={submission.id}
                style={[
                  styles.submissionCard,
                  selectedSubmissions.includes(submission.id) &&
                    styles.selectedCard,
                ]}
                onPress={() => handleGradeSubmission(submission)}
              >
                <Card.Content>
                  <View style={styles.submissionHeader}>
                    <View style={styles.studentInfo}>
                      <Avatar.Text
                        size={40}
                        label={submission.student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                        style={{ backgroundColor: '#1976d2' }}
                      />
                      <View style={styles.studentDetails}>
                        <Text variant="titleMedium">
                          {submission.student.name}
                        </Text>
                        <Text variant="bodySmall" color="#666">
                          Submitted {format(new Date(submission.submittedAt), 'MMM d, h:mm a')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.submissionActions}>
                      <IconButton
                        icon={
                          selectedSubmissions.includes(submission.id)
                            ? 'check-box'
                            : 'check-box-outline-blank'
                        }
                        onPress={() => toggleSubmissionSelection(submission.id)}
                        iconColor={
                          selectedSubmissions.includes(submission.id)
                            ? '#1976d2'
                            : '#666'
                        }
                      />
                      <IconButton
                        icon="auto-awesome"
                        onPress={() => handleQuickGrade(submission)}
                        iconColor="#4caf50"
                        disabled={gradeSingleMutation.isLoading}
                      />
                    </View>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.submissionMeta}>
                    <Chip
                      icon={getStatusIcon(submission.status)}
                      textStyle={{ color: getStatusColor(submission.status) }}
                      style={{
                        backgroundColor: `${getStatusColor(submission.status)}20`,
                      }}
                      compact
                    >
                      {submission.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                    <Text variant="bodySmall" color="#666">
                      {submission.wordCount} words
                    </Text>
                  </View>
                  
                  {submission.content && (
                    <Paragraph numberOfLines={2} style={styles.preview}>
                      {submission.content.substring(0, 150)}...
                    </Paragraph>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Graded Submissions */}
        {gradedSubmissions.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Graded Submissions ({gradedSubmissions.length})
            </Text>
            {gradedSubmissions.map((submission) => (
              <Card
                key={submission.id}
                style={styles.submissionCard}
                onPress={() => handleGradeSubmission(submission)}
              >
                <Card.Content>
                  <View style={styles.submissionHeader}>
                    <View style={styles.studentInfo}>
                      <Avatar.Text
                        size={40}
                        label={submission.student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                        style={{ backgroundColor: '#4caf50' }}
                      />
                      <View style={styles.studentDetails}>
                        <Text variant="titleMedium">
                          {submission.student.name}
                        </Text>
                        <Text variant="bodySmall" color="#666">
                          Graded {format(new Date(submission.gradedAt), 'MMM d, h:mm a')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gradeDisplay}>
                      <Text variant="headlineSmall" style={styles.gradeText}>
                        {submission.grade}
                      </Text>
                      <Text variant="bodySmall" color="#666">
                        Grade
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {submissions?.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No submissions yet
            </Text>
            <Text variant="bodyMedium" color="#666">
              Students haven't submitted their work for this assignment.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="camera"
        label="Camera Grade"
        onPress={() =>
          navigation.navigate('CameraGrading', { assignmentId })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  batchControls: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionBadge: {
    position: 'absolute',
    left: -8,
    top: -8,
  },
  batchButton: {
    flex: 1,
    marginLeft: 16,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  submissionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  submissionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeDisplay: {
    alignItems: 'center',
  },
  gradeText: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  divider: {
    marginVertical: 8,
  },
  submissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});

export default GradingScreen;