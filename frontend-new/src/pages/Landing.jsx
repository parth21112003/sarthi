import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Sparkles, Video, MessageCircle, FileQuestion, Users, BarChart3, ChevronRight, Star } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Decorative Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Hero Section */}
      <section className="hero container reveal">
        <div className="hero-content">
          <div className="badge-pill">
            <Sparkles size={16} className="text-primary" />
            <span>Sarthi 2.0 is now live</span>
          </div>
          <h1 className="hero-title">
            Connect with <span className="gradient-text">Expert</span> <br />Career Counsellors
          </h1>
          <p className="hero-subtitle">
            Navigate your career path with confidence. Get personalized guidance, aptitude tests, and real-time support from industry experts.
          </p>
          <div className="hero-actions">
            <Link to="/signup">
              <Button size="lg" iconRight={<ChevronRight size={20}/>}>Get Started</Button>
            </Link>
            <Link to="/#features">
              <Button variant="secondary" size="lg">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats container reveal">
        <Card className="stats-card">
          <div className="stat-item">
            <h3>500+</h3>
            <p>Students Guided</p>
          </div>
          <div className="stat-item">
            <h3>50+</h3>
            <p>Expert Counsellors</p>
          </div>
          <div className="stat-item">
            <h3>1000+</h3>
            <p>Sessions Conducted</p>
          </div>
          <div className="stat-item">
            <h3>4.8</h3>
            <p>Average Rating</p>
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section id="features" className="features container reveal">
        <h2 className="section-title text-center">Why Choose <span className="gradient-text">Sarthi</span>?</h2>
        <div className="features-grid">
          <Card hover className="feature-card">
            <div className="feature-icon"><Sparkles size={24} /></div>
            <h3>Smart Matching</h3>
            <p>Find the perfect counsellor based on your interests and goals.</p>
          </Card>
          <Card hover className="feature-card">
            <div className="feature-icon"><Video size={24} /></div>
            <h3>Video Calls</h3>
            <p>High-quality 1-on-1 video sessions with your counsellor.</p>
          </Card>
          <Card hover className="feature-card">
            <div className="feature-icon"><MessageCircle size={24} /></div>
            <h3>Real-time Chat</h3>
            <p>Stay connected with your counsellor anytime, anywhere.</p>
          </Card>
          <Card hover className="feature-card">
            <div className="feature-icon"><FileQuestion size={24} /></div>
            <h3>Aptitude Tests</h3>
            <p>Discover your strengths with our scientific assessments.</p>
          </Card>
          <Card hover className="feature-card">
            <div className="feature-icon"><Users size={24} /></div>
            <h3>Community Forum</h3>
            <p>Connect with peers, share experiences, and learn together.</p>
          </Card>
          <Card hover className="feature-card">
            <div className="feature-icon"><BarChart3 size={24} /></div>
            <h3>Session Analytics</h3>
            <p>Track your progress and get actionable insights.</p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works container reveal">
        <h2 className="section-title text-center">How It <span className="gradient-text">Works</span></h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your profile and tell us about your goals.</p>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Find Counselor</h3>
            <p>Get matched with experts in your field of interest.</p>
          </div>
          <div className="step-line"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Session</h3>
            <p>Book a session and start your journey to success.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials container reveal">
        <h2 className="section-title text-center">Student <span className="gradient-text">Success Stories</span></h2>
        <div className="testimonials-grid">
          {[
            { name: 'Ananya Sharma', stream: 'Engineering', quote: 'Sarthi helped me find the right engineering college. My counsellor guided me through every entrance exam and application.' },
            { name: 'Rahul Verma', stream: 'Commerce', quote: 'I was confused between CA and MBA. My Sarthi counsellor helped me understand both paths and make a confident decision.' },
            { name: 'Priya Patel', stream: 'Medical', quote: 'The aptitude test gave me clarity on my strengths. The one-on-one sessions with my counsellor were incredibly helpful.' },
          ].map((testimonial, i) => (
            <Card key={i} className="testimonial-card">
              <div className="stars">
                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="var(--accent-amber)" color="var(--accent-amber)" />)}
              </div>
              <p className="quote">"{testimonial.quote}"</p>
              <div className="author">
                <div className="author-avatar gradient-bg">{testimonial.name[0]}</div>
                <div>
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.stream}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section container reveal">
        <Card className="cta-card text-center">
          <h2>Ready to Shape Your Future?</h2>
          <p>Join thousands of students who have already found their path.</p>
          <Link to="/signup">
            <Button size="lg">Join Sarthi Today</Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <span className="logo-icon gradient-bg">S</span>
            <span className="logo-text">Sarthi</span>
            <p>© 2026 Sarthi. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <Link to="/#features">Features</Link>
            <Link to="/signup">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
