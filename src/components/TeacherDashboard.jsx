import { useState } from 'react';
import { Users, Calendar, BarChart2, MessageSquare, ClipboardCheck, Eye } from 'lucide-react';
import BatchManager from './BatchManager';
import AssignmentCreator from './AssignmentCreator';
import FacultyAnalytics from './FacultyAnalytics';
import TeacherCommunication from './TeacherCommunication';
import QuestionApproval from './QuestionApproval';
import ProctorMonitor from './ProctorMonitor';

export default function TeacherDashboard({ user, streams, onBack }) {
  const [activeTab, setActiveTab] = useState('batches');

  const tabs = [
    { id: 'batches', label: 'Batches', icon: Users },
    { id: 'assignments', label: 'Assignments', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'questions', label: 'Question Bank', icon: ClipboardCheck },
    { id: 'proctor', label: 'Proctor Monitor', icon: Eye }
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'batches':
        return <BatchManager user={user} />;
      case 'assignments':
        return <AssignmentCreator user={user} streams={streams} />;
      case 'analytics':
        return <FacultyAnalytics user={user} />;
      case 'communication':
        return <TeacherCommunication user={user} />;
      case 'questions':
        return <QuestionApproval user={user} streams={streams} />;
      case 'proctor':
        return <ProctorMonitor user={user} />;
      default:
        return <BatchManager user={user} />;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
        borderColor: 'var(--warning)',
        padding: '2rem',
        borderRadius: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--text)' }}>
            Welcome back, {user.name}!
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Access all administrative tools to manage your batches, verify student proctoring, and schedule custom exams.
          </p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          Exit Dashboard
        </button>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  padding: '1rem 1.25rem',
                  fontSize: '0.95rem',
                  borderRadius: '0.75rem',
                  width: '100%',
                  background: isActive ? 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)' : 'var(--card)',
                  color: isActive ? 'white' : 'var(--text)',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  boxShadow: isActive ? '0 4px 12px rgba(217, 119, 6, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <div className="card" style={{ padding: '2rem', borderRadius: '1rem', minHeight: '60vh' }}>
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
}
