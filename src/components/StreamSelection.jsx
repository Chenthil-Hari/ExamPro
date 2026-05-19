import { BookOpen, Clock, BarChart } from 'lucide-react';

export default function StreamSelection({ streams, onSelect }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Select Your Exam Stream</h2>
        <p style={{ color: 'var(--text-muted)' }}>Choose the competitive exam you want to practice for.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {streams.map(stream => (
          <div 
            key={stream.id} 
            className="card stream-card"
            onClick={() => onSelect(stream)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stream.name}</h3>
              <span className="badge" style={{
                background: stream.difficulty === 'Easy' ? '#dcfce7' : stream.difficulty === 'Medium' ? '#fef08a' : '#fee2e2',
                color: stream.difficulty === 'Easy' ? '#166534' : stream.difficulty === 'Medium' ? '#854d0e' : '#991b1b'
              }}>{stream.difficulty}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} /> <span>{stream.subjectCount} Subjects • {stream.totalQuestions} Questions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> <span>{stream.duration} Minutes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart size={16} /> <span>Marking: +{stream.marking.correct} / {stream.marking.wrong}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
