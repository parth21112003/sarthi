import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, DollarSign, GraduationCap, Briefcase, 
  ChevronRight, Users, Sparkles, CheckCircle2 
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { careerStreams } from '../data/careerPathsData';
import './Phase2.css';

const CareerPaths = () => {
  const navigate = useNavigate();
  const [selectedStream, setSelectedStream] = useState(careerStreams[0]);
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Engineering & Tech', 'Analytics & Quant', 'Creative & Design', 'Finance & Commerce', 'Law & Governance', 'Behavioral Sciences', 'Healthcare & Life Sciences'];

  const filteredStreams = filterCategory === 'All'
    ? careerStreams
    : careerStreams.filter((s) => s.category === filterCategory);

  return (
    <DashboardLayout title="Career Pathways & Industry Roadmaps">
      <div className="page-stack">
        {/* Header Hero Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Compass size={24} color="var(--primary-light)" />
            <h2 style={{ margin: 0 }}>Explore Career Trajectories & Degree Paths</h2>
          </div>
          <p className="muted" style={{ maxWidth: 720, lineHeight: 1.6, margin: 0 }}>
            Compare academic eligibility, industry skill requirements, compensation benchmarks, and top roles across major career sectors. Consult verified counselors specialized in each field.
          </p>
        </Card>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: filterCategory === cat ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                background: filterCategory === cat ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                color: filterCategory === cat ? '#fff' : 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Master-Detail Career Explorer Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Left Column: Stream Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filteredStreams.map((stream) => {
              const isSelected = selectedStream?.id === stream.id;
              return (
                <div
                  key={stream.id}
                  onClick={() => setSelectedStream(stream)}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    background: isSelected
                      ? 'var(--glass-border-hover)'
                      : 'var(--glass-bg)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                      <Badge variant={stream.badgeColor || 'info'}>{stream.category}</Badge>
                    </div>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{stream.title}</strong>
                    <div className="muted small-text" style={{ marginTop: 4 }}>
                      {stream.avgSalaryRange}
                    </div>
                  </div>
                  <ChevronRight size={18} color={isSelected ? 'var(--primary-light)' : 'var(--text-muted)'} />
                </div>
              );
            })}
          </div>

          {/* Right Column: In-Depth Career Blueprint */}
          {selectedStream && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <Badge variant={selectedStream.badgeColor || 'info'}>{selectedStream.category}</Badge>
                  <h2 style={{ margin: 'var(--space-2) 0 4px 0' }}>{selectedStream.title}</h2>
                  <span className="muted small-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={14} color="var(--accent-green)" /> Benchmark Compensation: {selectedStream.avgSalaryRange}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  iconLeft={<Users size={15} />}
                  onClick={() => navigate('/student/counselors')}
                >
                  Find Counselors
                </Button>
              </div>

              {/* Stream Overview */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4>Domain Overview</h4>
                <p className="muted small-text" style={{ lineHeight: 1.6, marginTop: 4 }}>
                  {selectedStream.description}
                </p>
              </div>

              {/* Recommended High School & College Paths */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4, color: 'var(--primary-light)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    <GraduationCap size={14} /> High School Eligibility
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)' }}>{selectedStream.highSchoolStream}</span>
                </div>

                <div style={{ padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4, color: 'var(--accent-green)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    <Briefcase size={14} /> Recommended Degrees
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedStream.recommendedDegrees.map((deg, i) => (
                      <span key={i}>• {deg}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Roles in Industry */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4>Prominent Industry Roles</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {selectedStream.topRoles.map((role, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* High-Value Core Competencies */}
              <div>
                <h4>Essential Skills & Tools</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {selectedStream.keySkills.map((skill, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <CheckCircle2 size={13} color="var(--accent-green)" /> {skill}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CareerPaths;
