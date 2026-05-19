import { useEffect, useRef } from 'react';
import { streams } from '../questions';
import { Home, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Results({ result, user, onHome }) {
  const { streamId, questions, answers, timeSpent } = result;
  const stream = streams.find(s => s.id === streamId);
  const sentRef = useRef(false);

  // Calculate score
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalTime = 0;

  const evaluation = questions.map((q, idx) => {
    const ans = answers[idx] || [];
    const time = timeSpent[idx] || 0;
    totalTime += time;

    if (ans.length === 0) {
      unattemptedCount++;
      return { q, status: 'unattempted', ans, time };
    }

    let isCorrect = false;
    if (q.type === 'Integer') {
      isCorrect = ans[0] === q.correct[0];
    } else {
      isCorrect = ans.length === q.correct.length && q.correct.every(c => ans.includes(c));
    }

    if (isCorrect) {
      score += stream.marking.correct;
      correctCount++;
      return { q, status: 'correct', ans, time };
    } else {
      if (!q.noNegative) {
        score += stream.marking.wrong;
      }
      wrongCount++;
      return { q, status: 'wrong', ans, time };
    }
  });

  const totalPossible = questions.length * stream.marking.correct;
  const percentile = Math.min(99.9, Math.max(10, (score / totalPossible) * 100 + Math.random() * 5)).toFixed(2);
  const rank = Math.floor(Math.random() * 50000) + 1;

  const formatTime = (secs) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

  useEffect(() => {
    if (!sentRef.current && user) {
      sentRef.current = true;
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend/api' : 'http://localhost:5000/api');
      fetch(`${apiUrl}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          streamId,
          score,
          totalPossible,
          percentile: parseFloat(percentile),
          timeSpent
        })
      }).catch(err => console.error('Failed to save result:', err));
    }
  }, [user, streamId, score, totalPossible, percentile, timeSpent]);

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Exam Complete!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Here is your detailed performance report.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Score</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{score} / {totalPossible}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Estimated Rank</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>#{rank.toLocaleString()}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Percentile</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{percentile}%</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Summary</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-answered)' }}>
            <CheckCircle /> Correct: {correctCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-not-answered)' }}>
            <XCircle /> Wrong: {wrongCount}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <AlertCircle /> Unattempted: {unattemptedCount}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Question Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {evaluation.map((ev, idx) => (
          <div key={idx} className="card" style={{ borderLeft: `4px solid ${ev.status === 'correct' ? 'var(--status-answered)' : ev.status === 'wrong' ? 'var(--status-not-answered)' : 'var(--text-muted)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold' }}>Q{idx + 1}. {ev.q.subject} ({ev.q.type})</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Time spent: {formatTime(ev.time)}</span>
            </div>
            <p style={{ marginBottom: '1rem' }}>{ev.q.text}</p>
            
            <div style={{ fontSize: '0.875rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.375rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Your Answer: </strong> 
                {ev.ans.length > 0 ? (ev.q.type === 'Integer' ? ev.ans[0] : ev.ans.map(a => ev.q.options[a]).join(', ')) : 'None'}
              </div>
              <div>
                <strong>Correct Answer: </strong>
                {ev.q.type === 'Integer' ? ev.q.correct[0] : ev.q.correct.map(c => ev.q.options[c]).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={onHome}>
          <Home size={18} /> Back to Home
        </button>
      </div>
    </div>
  );
}
