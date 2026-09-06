import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  CheckCircle, FileQuestion, ArrowRight, ArrowLeft, 
  Sparkles, Award, BarChart3, Users, Target, Compass, TrendingUp, AlertCircle, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import aptitudeService from '../services/aptitudeService';
import aiService from '../services/aiService';
import './Phase2.css';
import './Phase4.css';

const categories = ['all', 'logical', 'verbal', 'quantitative', 'creative', 'social'];

const categoryLabels = {
  logical: 'Logical Reasoning',
  verbal: 'Verbal Ability',
  quantitative: 'Quantitative Aptitude',
  creative: 'Creative & Design',
  social: 'Social & Leadership',
};

const AptitudeTest = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // AI Roadmap State
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [activeRoadmapResultId, setActiveRoadmapResultId] = useState(null);

  // Stepper Wizard State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  const handleGenerateRoadmap = async (resultId) => {
    setGeneratingRoadmap(true);
    setActiveRoadmapResultId(resultId);
    try {
      const data = await aiService.generateRoadmap(resultId);
      setActiveRoadmap(data.roadmap);
      toast.success('AI Career Blueprint generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate AI roadmap');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionData, resultData] = await Promise.all([
        aptitudeService.questions(),
        aptitudeService.results(),
      ]);
      setQuestions(questionData.questions || []);
      setResults(resultData.results || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuestions = selectedCategoryTab === 'all'
    ? questions
    : questions.filter((q) => q.category === selectedCategoryTab);

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const totalAnswered = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const handleSelectOption = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submit = async () => {
    if (totalAnswered < Math.floor(questions.length * 0.8)) {
      toast.error(`Please answer at least 80% of the questions (${Math.floor(questions.length * 0.8)}/${questions.length})`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await aptitudeService.submit(answers);
      setResults([data.result, ...results]);
      toast.success('Assessment completed and scored successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not submit test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Career Aptitude Assessment">
      <div className="page-stack">
        {loading ? (
          <div className="flex-center" style={{ minHeight: 320 }}>
            <Spinner text="Loading career assessment engine..." />
          </div>
        ) : (
          <>
            {/* Stepper Assessment Card */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="var(--primary-light)" /> Comprehensive Aptitude Engine
                  </h3>
                  <span className="muted small-text">
                    Evaluates cognitive problem solving, language acumen, numerical skills, creativity, and interpersonal strengths.
                  </span>
                </div>
                <Badge variant={progressPercent === 100 ? 'success' : 'info'}>
                  {totalAnswered} / {questions.length} Answered ({progressPercent}%)
                </Badge>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary-dark), var(--primary-light))',
                    transition: 'width var(--transition-normal)',
                  }}
                />
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryTab(cat);
                      setCurrentQuestionIndex(0);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: selectedCategoryTab === cat ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                      background: selectedCategoryTab === cat ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                      color: selectedCategoryTab === cat ? '#fff' : 'var(--text-muted)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat === 'all' ? 'All Questions' : categoryLabels[cat] || cat}
                  </button>
                ))}
              </div>

              {/* Active Stepper Question Box */}
              {currentQuestion ? (
                <div
                  style={{
                    padding: 'var(--space-6)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <Badge variant="info">
                      {categoryLabels[currentQuestion.category] || currentQuestion.category}
                    </Badge>
                    <span className="muted small-text">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                    </span>
                  </div>

                  <h3 style={{ margin: 'var(--space-2) 0 var(--space-4) 0', fontSize: '1.2rem', lineHeight: 1.5 }}>
                    {currentQuestion.prompt}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {currentQuestion.options.map((option) => {
                      const isChosen = answers[currentQuestion.id] === option.id;
                      return (
                        <label
                          key={option.id}
                          onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                          style={{
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            border: isChosen ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            background: isChosen ? 'var(--glass-border-hover)' : 'var(--glass-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQuestion.id}`}
                            checked={isChosen}
                            onChange={() => handleSelectOption(currentQuestion.id, option.id)}
                            style={{ accentColor: 'var(--primary-light)' }}
                          />
                          <span style={{ fontSize: 'var(--text-sm)', color: isChosen ? '#fff' : 'var(--text-main)' }}>
                            {option.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Wizard Navigation Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)' }}>
                    <Button
                      variant="ghost"
                      onClick={handlePrev}
                      disabled={currentQuestionIndex === 0}
                      iconLeft={<ArrowLeft size={16} />}
                    >
                      Previous
                    </Button>

                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      {currentQuestionIndex < filteredQuestions.length - 1 ? (
                        <Button
                          variant="secondary"
                          onClick={handleNext}
                          iconRight={<ArrowRight size={16} />}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={submit}
                          loading={submitting}
                          iconLeft={<CheckCircle size={16} />}
                        >
                          Finish & Generate Career Analysis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<FileQuestion size={28} />}
                  title="No questions in this section"
                  description="Select 'All Questions' to view the entire test bank."
                />
              )}
            </Card>

            {/* Assessment Results & Career Recommendations */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Evaluation History & Recommended Pathways</h3>
                  <span className="muted small-text">Your aptitude test scores and suggested career streams</span>
                </div>
              </div>

              {results.length === 0 ? (
                <EmptyState
                  icon={<Award size={32} />}
                  title="No evaluation recorded yet"
                  description="Answer questions above and click Submit to generate your profile insights."
                />
              ) : (
                <div className="page-stack">
                  {results.map((result, idx) => (
                    <div
                      key={result.id || idx}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        background: idx === 0 ? 'var(--card-bg)' : 'var(--glass-bg)',
                        border: idx === 0 ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0 }}>
                              Recommended Stream: {result.streamRecommendation}
                            </h4>
                            {idx === 0 && <Badge variant="success">Latest Attempt</Badge>}
                          </div>
                          <span className="muted small-text">
                            Total Score: {result.totalScore} Points | Evaluated on {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            iconLeft={<Sparkles size={14} />}
                            loading={generatingRoadmap && activeRoadmapResultId === result.id}
                            onClick={() => handleGenerateRoadmap(result.id)}
                          >
                            {activeRoadmap && activeRoadmapResultId === result.id ? 'Regenerate AI Blueprint' : 'Generate AI Career Roadmap'}
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            iconLeft={<Users size={14} />}
                            onClick={() => navigate('/student/counselors')}
                          >
                            Find Counselors
                          </Button>
                        </div>
                      </div>

                      {/* Dimension Score Progress Bars */}
                      {result.scores && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                          {Object.entries(result.scores).map(([category, score]) => {
                            const max = 20; // 5 questions * 4 pts max
                            const pct = Math.min(100, Math.round((score / max) * 100));
                            return (
                              <div
                                key={category}
                                style={{
                                  padding: 'var(--space-3)',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(0,0,0,0.2)',
                                  border: '1px solid rgba(255, 255, 255, 0.04)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{category}</span>
                                  <span>{score} / {max}</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-light)', borderRadius: 3 }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* AI Generated Career Roadmap Section */}
                      {activeRoadmap && activeRoadmapResultId === result.id && (
                        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px dashed var(--glass-border)' }}>
                          {/* Archetype & Summary */}
                          <div style={{
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--glass-border-hover)',
                            marginBottom: 'var(--space-4)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <Sparkles size={18} color="var(--primary-light)" />
                              <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-light)', fontWeight: 700 }}>
                                AI Psychometric Archetype
                              </span>
                              <Badge variant="info">{activeRoadmap.dominantArchetype}</Badge>
                            </div>
                            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#e2e8f0', lineHeight: 1.6 }}>
                              {activeRoadmap.executiveSummary}
                            </p>
                          </div>

                          {/* Top Career Paths */}
                          {activeRoadmap.topCareerPaths?.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                <Target size={16} color="var(--accent-cyan)" /> Top AI-Aligned Career Pathways
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                                {activeRoadmap.topCareerPaths.map((career, cIdx) => (
                                  <div
                                    key={cIdx}
                                    style={{
                                      padding: 'var(--space-3)',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid var(--glass-border)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between'
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: '#fff' }}>{career.title}</span>
                                        <Badge variant="success">{career.matchScore}% Fit</Badge>
                                      </div>
                                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>
                                        {career.whyFit}
                                      </p>
                                    </div>
                                    <div>
                                      {career.benchmarkSalary && (
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '6px' }}>
                                          Est. Compensation: {career.benchmarkSalary}
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {career.targetRoles?.map((role, rIdx) => (
                                          <span
                                            key={rIdx}
                                            style={{
                                              fontSize: '10px',
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              background: 'var(--glass-bg)',
                                              color: 'var(--text-main)',
                                              border: '1px solid var(--glass-border)'
                                            }}
                                          >
                                            {role}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 3-Year Milestone Roadmap */}
                          {activeRoadmap.milestoneRoadmap?.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                <TrendingUp size={16} color="var(--accent-orange)" /> 3-Year Strategic Milestone Roadmap
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                                {activeRoadmap.milestoneRoadmap.map((ms, mIdx) => (
                                  <div
                                    key={mIdx}
                                    style={{
                                      padding: 'var(--space-3)',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(0,0,0,0.25)',
                                      border: '1px solid rgba(255,255,255,0.06)'
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--primary-light)', marginBottom: '4px' }}>
                                      {ms.phase}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: '#d1d8e0', fontWeight: 500, marginBottom: '8px' }}>
                                      {ms.focus}
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                      {ms.actionItems?.map((item, aIdx) => (
                                        <li key={aIdx} style={{ marginBottom: '4px' }}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Blindspots & Strategic Recommendations */}
                          {activeRoadmap.blindspotsAndRecommendations?.length > 0 && (
                            <div>
                              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                                <Compass size={16} color="var(--accent-amber)" /> Strategic Growth Areas & Recommendations
                              </h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {activeRoadmap.blindspotsAndRecommendations.map((bs, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      padding: 'var(--space-3)',
                                      borderRadius: 'var(--radius-sm)',
                                      background: 'rgba(253, 203, 110, 0.06)',
                                      border: '1px solid rgba(253, 203, 110, 0.2)',
                                      fontSize: 'var(--text-xs)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '3px' }}>
                                      <AlertCircle size={12} /> {bs.dimension}: {bs.observation}
                                    </div>
                                    <div style={{ color: '#d1d8e0', paddingLeft: '18px' }}>
                                      <strong>Action:</strong> {bs.remedy}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AptitudeTest;
