'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  // ==========================================================================
  // STATE - ONLY PROFILES AND REPOSITORIES
  // ==========================================================================
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceMode, setPerformanceMode] = useState(false);
  
  // ==========================================================================
  // PROFILES TABLE - COMPLETE SCHEMA
  // ==========================================================================
  const [formData, setFormData] = useState({
    // Core fields
    username: '',
    email: '',
    full_name: '',
    avatar_url: '',
    bio: '',
    
    // Location & contact
    location: '',
    website: '',
    company: '',
    
    // Social
    github_username: '',
    twitter_username: '',
    
    // Arrays
    skills: [],
    interests: [],
    
    // Metadata
    user_id: null,
    created_at: null,
    updated_at: null
  });

  // ==========================================================================
  // REPOSITORIES TABLE - COMPLETE SCHEMA
  // ==========================================================================
  const [repositories, setRepositories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  const [releases, setReleases] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [repoIssues, setRepoIssues] = useState([]);
  const [repoComments, setRepoComments] = useState([]);
  const [repoStars, setRepoStars] = useState([]);
  
  // ==========================================================================
  // STATS - ONLY FROM REPOSITORIES
  // ==========================================================================
  const [stats, setStats] = useState({
    // Repositories
    totalRepos: 0,
    publicRepos: 0,
    privateRepos: 0,
    
    // Development
    totalBranches: 0,
    totalCommits: 0,
    totalReleases: 0,
    
    // Collaboration
    totalPullRequests: 0,
    openPullRequests: 0,
    mergedPullRequests: 0,
    closedPullRequests: 0,
    
    // Issues
    totalIssues: 0,
    openIssues: 0,
    closedIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    
    // Engagement
    totalStars: 0,
    totalForks: 0,
    totalComments: 0,
    totalViews: 0,
    
    // Languages
    languages: {}
  });

  // ==========================================================================
  // PERFORMANCE REFS
  // ==========================================================================
  const canvasRef = useRef(null);
  const profileCardRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);
  const lastFrameTimeRef = useRef(0);
  const mouseTrackingRef = useRef({ x: 0, y: 0 });

  // ==========================================================================
  // AUTH & PROFILE FETCHING
  // ==========================================================================
  useEffect(() => {
    const initialize = async () => {
      await handleOAuthCallback();
      await fetchUserAndProfile();
      await fetchAllRepositories();
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
            await fetchAllRepositories();
          } else {
            setUser(null);
            setProfile(null);
            setRepositories([]);
          }
          setLoading(false);
        }
      );
      
      return () => subscription?.unsubscribe();
    };
    
    initialize();
  }, []);

  const handleOAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
  };

  const fetchUserAndProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FETCH PROFILE - COMPLETE profiles TABLE
  // ==========================================================================
  const fetchProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setEditMode(true);
          const user = await supabase.auth.getUser();
          if (user.data?.user?.email) {
            const usernameFromEmail = user.data.user.email.split('@')[0];
            setFormData(prev => ({ 
              ...prev, 
              username: usernameFromEmail,
              email: user.data.user.email
            }));
          }
        }
        return;
      }

      setProfile(profile);
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        company: profile.company || '',
        github_username: profile.github_username || '',
        twitter_username: profile.twitter_username || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        user_id: profile.user_id,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // ==========================================================================
  // FETCH ALL REPOSITORIES - COMPLETE WITH ALL RELATED TABLES
  // ==========================================================================
  const fetchAllRepositories = async () => {
    if (!user) return;
    
    try {
      // 1. FETCH REPOSITORIES
      const { data: repos, error: reposError } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (reposError) throw reposError;
      setRepositories(repos || []);
      
      // 2. FETCH BRANCHES for all repos
      const repoIds = repos?.map(r => r.id) || [];
      if (repoIds.length > 0) {
        const { data: branchesData } = await supabase
          .from('branches')
          .select('*')
          .in('repo_id', repoIds);
        setBranches(branchesData || []);
        
        // 3. FETCH COMMITS
        const { data: commitsData } = await supabase
          .from('commits')
          .select('*')
          .in('repo_id', repoIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setCommits(commitsData || []);
        
        // 4. FETCH RELEASES
        const { data: releasesData } = await supabase
          .from('releases')
          .select('*')
          .in('repo_id', repoIds)
          .order('created_at', { ascending: false });
        setReleases(releasesData || []);
        
        // 5. FETCH PULL REQUESTS
        const { data: prData } = await supabase
          .from('pull_requests')
          .select('*')
          .in('repo_id', repoIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setPullRequests(prData || []);
        
        // 6. FETCH ISSUES
        const { data: issuesData } = await supabase
          .from('repo_issues')
          .select('*')
          .in('repo_id', repoIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRepoIssues(issuesData || []);
        
        // 7. FETCH COMMENTS
        const { data: commentsData } = await supabase
          .from('repo_comments')
          .select('*')
          .in('repo_id', repoIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRepoComments(commentsData || []);
        
        // 8. FETCH STARS
        const { data: starsData } = await supabase
          .from('repo_stars')
          .select('*')
          .in('repo_id', repoIds);
        setRepoStars(starsData || []);
      }
      
      // 9. CALCULATE ALL STATS
      await calculateStats(repos || [], repoIds);
      
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // ==========================================================================
  // CALCULATE COMPLETE REPOSITORY STATISTICS
  // ==========================================================================
  const calculateStats = async (repos, repoIds) => {
    try {
      // Repository counts
      const totalRepos = repos.length;
      const publicRepos = repos.filter(r => r.is_public === true).length;
      const privateRepos = repos.filter(r => r.is_public === false).length;
      
      // Get fresh counts from database
      const { count: branchesCount } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds);
      
      const { count: commitsCount } = await supabase
        .from('commits')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .eq('user_id', user.id);
      
      const { count: releasesCount } = await supabase
        .from('releases')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds);
      
      // Pull request stats
      const { data: prs } = await supabase
        .from('pull_requests')
        .select('status')
        .in('repo_id', repoIds)
        .eq('user_id', user.id);
      
      const totalPRs = prs?.length || 0;
      const openPRs = prs?.filter(pr => pr.status === 'open').length || 0;
      const mergedPRs = prs?.filter(pr => pr.status === 'merged').length || 0;
      const closedPRs = prs?.filter(pr => pr.status === 'closed').length || 0;
      
      // Issue stats
      const { data: issues } = await supabase
        .from('repo_issues')
        .select('status')
        .in('repo_id', repoIds)
        .eq('user_id', user.id);
      
      const totalIssues = issues?.length || 0;
      const openIssues = issues?.filter(i => i.status === 'open').length || 0;
      const inProgressIssues = issues?.filter(i => i.status === 'in_progress').length || 0;
      const resolvedIssues = issues?.filter(i => i.status === 'resolved').length || 0;
      const closedIssues = issues?.filter(i => i.status === 'closed').length || 0;
      
      // Stars and forks totals
      const totalStars = repos.reduce((acc, repo) => acc + (repo.star_count || 0), 0);
      const totalForks = repos.reduce((acc, repo) => acc + (repo.fork_count || 0), 0);
      const totalViews = repos.reduce((acc, repo) => acc + (repo.view_count || 0), 0);
      
      // Comments count
      const { count: commentsCount } = await supabase
        .from('repo_comments')
        .select('*', { count: 'exact', head: true })
        .in('repo_id', repoIds)
        .eq('user_id', user.id);
      
      // Language breakdown
      const languages = {};
      repos.forEach(repo => {
        const lang = repo.language || 'Unknown';
        languages[lang] = (languages[lang] || 0) + 1;
      });
      
      setStats({
        totalRepos,
        publicRepos,
        privateRepos,
        totalBranches: branchesCount || 0,
        totalCommits: commitsCount || 0,
        totalReleases: releasesCount || 0,
        totalPullRequests: totalPRs,
        openPullRequests: openPRs,
        mergedPullRequests: mergedPRs,
        closedPullRequests: closedPRs,
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        closedIssues,
        totalStars,
        totalForks,
        totalComments: commentsCount || 0,
        totalViews,
        languages
      });
      
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  // ==========================================================================
  // PERFORMANCE TOGGLE
  // ==========================================================================
  const togglePerformanceMode = () => {
    setPerformanceMode(!performanceMode);
  };

  // ==========================================================================
  // AUTH HANDLERS
  // ==========================================================================
  const handleGitHubLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          scopes: 'read:user user:email'
        }
      });
    } catch (error) {
      console.error('GitHub login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setRepositories([]);
      setBranches([]);
      setCommits([]);
      setReleases([]);
      setPullRequests([]);
      setRepoIssues([]);
      setRepoComments([]);
      setRepoStars([]);
      setEditMode(false);
    }
  };

  // ==========================================================================
  // PROFILE UPDATE HANDLER
  // ==========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const profileData = {
        user_id: user.id,
        email: user.email,
        username: formData.username,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        company: formData.company,
        github_username: formData.github_username,
        twitter_username: formData.twitter_username,
        skills: formData.skills,
        interests: formData.interests,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // ==========================================================================
  // AVATAR UPLOAD
  // ==========================================================================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setFormData({ ...formData, avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // ==========================================================================
  // SKILLS MANAGEMENT
  // ==========================================================================
  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const addInterest = (interest) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  const removeInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  // ==========================================================================
  // REPOSITORY ACTIONS
  // ==========================================================================
  const createRepository = async (repoData) => {
    try {
      const { data, error } = await supabase
        .from('repositories')
        .insert({
          ...repoData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setRepositories([data, ...repositories]);
        await fetchAllRepositories();
      }
    } catch (error) {
      console.error('Error creating repository:', error);
    }
  };

  // ==========================================================================
  // 3D MOUSE TRACKING
  // ==========================================================================
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseTrackingRef.current = { x: e.clientX, y: e.clientY };
      
      if (!performanceMode) {
        requestAnimationFrame(() => {
          setMousePosition({
            x: (e.clientX / window.innerWidth - 0.5) * 20,
            y: (e.clientY / window.innerHeight - 0.5) * 20
          });
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [performanceMode]);

  // ==========================================================================
  // GPU PARTICLE SYSTEM
  // ==========================================================================
  useEffect(() => {
    if (performanceMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true, antialias: false });
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resizeCanvas();
    
    const initParticles = () => {
      const particles = [];
      const particleCount = Math.min(Math.floor((width * height) / 8000), 120);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.2 + 0.1,
          pulse: Math.random() * Math.PI * 2
        });
      }
      return particles;
    };
    
    let particles = initParticles();
    
    const animateParticles = (timestamp) => {
      if (!ctx) return;
      
      if (performanceMode && timestamp - lastFrameTimeRef.current < 20) {
        animationFrameRef.current = requestAnimationFrame(animateParticles);
        return;
      }
      lastFrameTimeRef.current = timestamp;
      
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.03;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 200, 255, ${pulseAlpha})`;
        ctx.fill();
      }
      
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.02)';
      ctx.lineWidth = 0.3;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    };
    
    animationFrameRef.current = requestAnimationFrame(animateParticles);
    
    const handleResize = () => {
      resizeCanvas();
      particles = initParticles();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [performanceMode]);

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 20% 30%, #0a0b1e, #03050c)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <canvas ref={canvasRef} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          background: 'rgba(10, 20, 40, 0.7)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '24px',
          border: '1px solid rgba(0, 200, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '3px solid rgba(0, 200, 255, 0.1)',
            borderTopColor: '#00c8ff',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          
          <div style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '8px',
            textShadow: '0 0 10px rgba(0, 200, 255, 0.5)'
          }}>Loading immersive profile...</div>
          
          <div style={{
            color: 'rgba(200, 230, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '24px'
          }}>Initializing neural interface</div>
          
          <button onClick={togglePerformanceMode} style={{
            padding: '10px 20px',
            background: performanceMode ? 'rgba(0, 200, 255, 0.2)' : 'rgba(30, 50, 80, 0.5)',
            border: performanceMode ? '1px solid #00c8ff' : '1px solid rgba(0, 200, 255, 0.3)',
            borderRadius: '30px',
            color: performanceMode ? '#00c8ff' : 'white',
            fontSize: '14px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            boxShadow: performanceMode ? '0 0 20px rgba(0, 200, 255, 0.3)' : 'none'
          }}>
            ⚡ {performanceMode ? 'Performance Mode' : 'Immersive Mode'}
          </button>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.6; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ==========================================================================
  // LOGIN SCREEN
  // ==========================================================================
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 20% 30%, #0a0b1e, #03050c)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <canvas ref={canvasRef} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '520px',
          padding: '20px',
          zIndex: 10
        }}>
          <div style={{
            background: 'rgba(10, 15, 30, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: '1px solid rgba(0, 200, 255, 0.2)',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '140%',
              height: '200%',
              background: 'radial-gradient(circle at 50% 0%, rgba(0, 200, 255, 0.1), transparent 70%)',
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                animation: 'pulse 2s infinite'
              }}>⚡</div>
              
              <h1 style={{
                color: 'white',
                fontSize: '36px',
                fontWeight: 700,
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #fff, #a0e7ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Modz</h1>
              
              <p style={{
                color: 'rgba(200, 230, 255, 0.7)',
                fontSize: '16px'
              }}>Repository Control Interface</p>
            </div>
            
            <div style={{ marginBottom: '32px', position: 'relative' }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '15px',
                lineHeight: 1.6,
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                Initialize your repository hub. Connect your GitHub, manage your code, track issues, pull requests, and collaborate with the community.
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <button 
                  onClick={handleGitHubLogin}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(36, 41, 46, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #24292e, #1b1f23)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '12px' }}>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                  </svg>
                  Initialize with GitHub
                </button>
                
                <button 
                  onClick={handleGoogleLogin}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(66, 133, 244, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 24px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#333',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Initialize with Google
                </button>
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={togglePerformanceMode}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '30px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                  {performanceMode ? '🎮 Performance Mode' : '✨ Immersive Mode'}
                </button>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '20px 0 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Repository Analytics</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🔄</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Pull Requests</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🐛</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Issue Tracking</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>50+ FPS</span>
              </div>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.8; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ==========================================================================
  // MAIN PROFILE UI - COMPLETE REPOSITORY DASHBOARD
  // ==========================================================================
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 20% 30%, #0a0b1e, #03050c)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <canvas ref={canvasRef} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Performance Toggle */}
      <button 
        onClick={togglePerformanceMode}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 15px 35px -10px rgba(0, 200, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = performanceMode 
            ? '0 0 30px rgba(0, 200, 255, 0.3)' 
            : '0 10px 30px -10px rgba(0, 0, 0, 0.5)';
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          background: performanceMode ? 'rgba(0, 200, 255, 0.15)' : 'rgba(20, 30, 50, 0.7)',
          border: performanceMode ? '1px solid #00c8ff' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '40px',
          color: performanceMode ? '#00c8ff' : 'white',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          transition: 'all 0.3s ease',
          boxShadow: performanceMode ? '0 0 30px rgba(0, 200, 255, 0.3)' : '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
        }}>
        {performanceMode ? '🎮 Performance Mode' : '✨ Immersive Mode'}
      </button>
      
      {/* Main Profile Card with 3D Tilt */}
      <div 
        ref={profileCardRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          padding: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transformStyle: 'preserve-3d',
          perspective: '2000px',
          transform: performanceMode ? 'none' : `perspective(2000px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`,
          transition: performanceMode ? 'none' : 'transform 0.1s ease-out'
        }}>
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          background: 'rgba(10, 15, 25, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          border: '1px solid rgba(0, 200, 255, 0.2)',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Header Glow Effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '120%',
            height: '200%',
            background: 'radial-gradient(circle at 50% 0%, rgba(0, 200, 255, 0.1), transparent 70%)',
            pointerEvents: 'none'
          }}></div>
          
          {/* Profile Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            position: 'relative'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #fff, #a0e7ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              position: 'relative'
            }}>
              {editMode ? '🖋️  Initialize Profile' : '👤  Repository Command Center'}
            </h2>
            
            <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              {!editMode && (
                <button 
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(0, 200, 255, 0.1)',
                    border: '1px solid rgba(0, 200, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#00c8ff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 5px 15px -5px rgba(0, 200, 255, 0.2)'
                  }}
                  onClick={() => setEditMode(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 200, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px -5px rgba(0, 200, 255, 0.2)';
                  }}>
                  ✏️ Edit Profile
                </button>
              )}
              <button 
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 75, 43, 0.1)',
                  border: '1px solid rgba(255, 75, 43, 0.3)',
                  borderRadius: '12px',
                  color: '#ff4b2b',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.border = '1px solid transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 75, 43, 0.1)';
                  e.currentTarget.style.color = '#ff4b2b';
                  e.currentTarget.style.border = '1px solid rgba(255, 75, 43, 0.3)';
                }}>
                ⚡ Disconnect
              </button>
            </div>
          </div>
          
          {/* Profile Content */}
          <div style={{ position: 'relative', zIndex: 5 }}>
            {editMode ? (
              // ==========================================================================
              // EDIT MODE - COMPLETE PROFILES TABLE FORM
              // ==========================================================================
            <form 
  onSubmit={handleSubmit} 
  style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '32px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    paddingRight: '16px'
  }}
  className="profile-form-scroll"
>
                
                {/* Avatar Upload Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', marginBottom: '12px' }}>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      right: '-10px',
                      bottom: '-10px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, rgba(0, 200, 255, 0.5), transparent 70%)',
                      animation: 'pulse 3s infinite',
                      zIndex: 1
                    }}></div>
                    <img 
                      src={formData.avatar_url || '/default-avatar.png'} 
                      alt="Profile" 
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid rgba(0, 200, 255, 0.5)',
                        boxShadow: '0 0 30px rgba(0, 200, 255, 0.3)',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onError={(e) => e.target.src = '/default-avatar.png'}
                    />
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="avatar-upload" 
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00c8ff, #a0e7ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 5px 15px rgba(0, 200, 255, 0.4)',
                        border: '2px solid white',
                        zIndex: 3,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                      <span style={{ fontSize: '18px' }}>📸</span>
                    </label>
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Max 5MB • PNG, JPG, GIF</p>
                </div>
                
                {/* Two Column Form Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  
                  {/* Left Column - Identity & Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Username - Required */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>
                        Username <span style={{ color: '#00c8ff' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                        minLength={3}
                        maxLength={30}
                        placeholder="unique_identifier"
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          zIndex: 2
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Full Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Full Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        placeholder="Your name"
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Email</label>
                      <input
                        type="email"
                        value={formData.email || user?.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your@email.com"
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Location */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="City, Country"
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Company */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="Your organization"
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Website */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        placeholder="https://..."
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Right Column - Social & Bio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* GitHub Username */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>GitHub Username</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '16px'
                        }}>@</span>
                        <input
                          type="text"
                          value={formData.github_username}
                          onChange={(e) => setFormData({...formData, github_username: e.target.value})}
                          placeholder="username"
                          style={{
                            padding: '14px 16px 14px 40px',
                            background: 'rgba(20, 30, 50, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid #00c8ff';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Twitter Username */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Twitter Username</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '16px'
                        }}>@</span>
                        <input
                          type="text"
                          value={formData.twitter_username}
                          onChange={(e) => setFormData({...formData, twitter_username: e.target.value})}
                          placeholder="username"
                          style={{
                            padding: '14px 16px 14px 40px',
                            background: 'rgba(20, 30, 50, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid #00c8ff';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Bio */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell your story as a developer..."
                        style={{
                          padding: '14px 16px',
                          background: 'rgba(20, 30, 50, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          resize: 'vertical',
                          minHeight: '120px',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = '1px solid #00c8ff';
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', textAlign: 'right' }}>
                        {500 - (formData.bio?.length || 0)} characters remaining
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Skills Section - PostgreSQL Array */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Skills</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(20, 30, 50, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {formData.skills.map((skill, index) => (
                      <span key={index} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #00c8ff, #0080ff)',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 500,
                        gap: '6px'
                      }}>
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => removeSkill(skill)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}>
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add skill..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          addSkill(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '13px',
                        padding: '6px',
                        outline: 'none',
                        minWidth: '120px'
                      }}
                    />
                  </div>
                </div>
                
                {/* Interests Section - PostgreSQL Array */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: 500 }}>Interests</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(20, 30, 50, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {formData.interests.map((interest, index) => (
                      <span key={index} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #4158D0, #C850C0)',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 500,
                        gap: '6px'
                      }}>
                        {interest}
                        <button 
                          type="button" 
                          onClick={() => removeInterest(interest)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}>
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add interest..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInterest(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          addInterest(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '13px',
                        padding: '6px',
                        outline: 'none',
                        minWidth: '120px'
                      }}
                    />
                  </div>
                </div>
                
                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                  <button 
                    type="submit" 
                    style={{
                      flex: 1,
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #00c8ff, #0080ff)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 10px 20px -5px rgba(0, 200, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(0, 200, 255, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 200, 255, 0.3)';
                    }}>
                    💾 Save Profile Configuration
                  </button>
                  <button 
                    type="button" 
                    style={{
                      padding: '16px 32px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      setEditMode(false);
                      if (profile) {
                        setFormData({
                          username: profile.username || '',
                          email: profile.email || '',
                          full_name: profile.full_name || '',
                          avatar_url: profile.avatar_url || '',
                          bio: profile.bio || '',
                          location: profile.location || '',
                          website: profile.website || '',
                          company: profile.company || '',
                          github_username: profile.github_username || '',
                          twitter_username: profile.twitter_username || '',
                          skills: profile.skills || [],
                          interests: profile.interests || [],
                          user_id: profile.user_id,
                          created_at: profile.created_at,
                          updated_at: profile.updated_at
                        });
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    }}>
                    ✖ Cancel
                  </button>
                </div>
              </form>
            ) : (
              // ==========================================================================
              // VIEW MODE - REPOSITORY COMMAND CENTER DASHBOARD
              // ==========================================================================
              <div style={{ width: '100%' }}>
                
                {/* Two Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
                  
                  {/* ====================================================================== */}
                  {/* LEFT COLUMN - PROFILE CARD */}
                  {/* ====================================================================== */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    
                    {/* Avatar with Glow */}
                    <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', marginBottom: '24px' }}>
                      <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '-15px',
                        right: '-15px',
                        bottom: '-15px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, rgba(0, 200, 255, 0.4), transparent 70%)',
                        animation: 'pulse 4s infinite',
                        zIndex: 1
                      }}></div>
                      <img 
                        src={profile?.avatar_url || formData.avatar_url || '/default-avatar.png'} 
                        alt={profile?.username || user?.email}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid rgba(0, 200, 255, 0.5)',
                          boxShadow: '0 0 40px rgba(0, 200, 255, 0.3)',
                          position: 'relative',
                          zIndex: 2
                        }}
                        onError={(e) => e.target.src = '/default-avatar.png'}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(10, 20, 30, 0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '6px 12px',
                        borderRadius: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(0, 255, 0, 0.3)',
                        color: '#00ff88',
                        fontSize: '12px',
                        fontWeight: 500,
                        zIndex: 3
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#00ff88',
                          boxShadow: '0 0 10px #00ff88',
                          animation: 'pulse 2s infinite'
                        }}></span>
                        Active
                      </div>
                    </div>
                    
                    {/* Name & Username */}
                    <h1 style={{
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 700,
                      marginBottom: '4px'
                    }}>
                      {profile?.full_name || formData.full_name || profile?.username || user?.email?.split('@')[0]}
                    </h1>
                    
                    <div style={{
                      color: 'rgba(0, 200, 255, 0.9)',
                      fontSize: '16px',
                      fontWeight: 500,
                      marginBottom: '16px'
                    }}>
                      @{profile?.username || formData.username || user?.email?.split('@')[0]}
                    </div>
                    
                    {/* Email */}
                    {user?.email && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>📧</span>
                        {user.email}
                      </div>
                    )}
                    
                    {/* Location */}
                    {formData.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>📍</span>
                        {formData.location}
                      </div>
                    )}
                    
                    {/* Company */}
                    {formData.company && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>🏢</span>
                        {formData.company}
                      </div>
                    )}
                    
                    {/* Website */}
                    {formData.website && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>🔗</span>
                        <a 
                          href={formData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#00c8ff', textDecoration: 'none' }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                          {formData.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    
                    {/* Member Since */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '13px',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontSize: '13px' }}>🗓️</span>
                      Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    
                    {/* Social Links */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {formData.github_username && (
                        <a 
                          href={`https://github.com/${formData.github_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                          </svg>
                        </a>
                      )}
                      {formData.twitter_username && (
                        <a 
                          href={`https://twitter.com/${formData.twitter_username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.8)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                          }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    
                    {/* Bio Section */}
                    {formData.bio && (
                      <div style={{
                        width: '100%',
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginTop: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                          📝 Bio
                        </h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                          {formData.bio}
                        </p>
                      </div>
                    )}
                    
                    {/* Skills Display */}
                    {formData.skills?.length > 0 && (
                      <div style={{
                        width: '100%',
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginTop: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                          ⚡ Skills
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {formData.skills.map((skill, index) => (
                            <span key={index} style={{
                              padding: '4px 12px',
                              background: 'rgba(0, 200, 255, 0.1)',
                              border: '1px solid rgba(0, 200, 255, 0.3)',
                              borderRadius: '20px',
                              color: '#00c8ff',
                              fontSize: '12px',
                              fontWeight: 500
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Interests Display */}
                    {formData.interests?.length > 0 && (
                      <div style={{
                        width: '100%',
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginTop: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                          🎯 Interests
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {formData.interests.map((interest, index) => (
                            <span key={index} style={{
                              padding: '4px 12px',
                              background: 'linear-gradient(135deg, rgba(65, 88, 208, 0.1), rgba(200, 80, 192, 0.1))',
                              border: '1px solid rgba(200, 80, 192, 0.3)',
                              borderRadius: '20px',
                              color: '#C850C0',
                              fontSize: '12px',
                              fontWeight: 500
                            }}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* ====================================================================== */}
                  {/* RIGHT COLUMN - REPOSITORY DASHBOARD */}
                  {/* ====================================================================== */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Repository Stats Grid - Complete Overview */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '16px'
                    }}>
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(0, 200, 255, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 200, 255, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(0, 200, 255, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 30, 50, 0.3)';
                        e.currentTarget.style.border = '1px solid rgba(0, 200, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
                        <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.totalRepos}</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Repositories</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
                          <span style={{ color: '#00c8ff' }}>{stats.publicRepos} public</span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{stats.privateRepos} private</span>
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(255, 215, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 30, 50, 0.3)';
                        e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
                        <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.totalStars}</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Stars Received</div>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#FFD700' }}>across all repositories</div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(0, 255, 136, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(0, 255, 136, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 30, 50, 0.3)';
                        e.currentTarget.style.border = '1px solid rgba(0, 255, 136, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍴</div>
                        <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.totalForks}</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Forks</div>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#00ff88' }}>community copies</div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid rgba(255, 75, 43, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 75, 43, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(255, 75, 43, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 30, 50, 0.3)';
                        e.currentTarget.style.border = '1px solid rgba(255, 75, 43, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
                        <div style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{stats.totalPullRequests}</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Pull Requests</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
                          <span style={{ color: '#00ff88' }}>{stats.mergedPullRequests} merged</span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                          <span style={{ color: '#00c8ff' }}>{stats.openPullRequests} open</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Development Activity Stats */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '16px'
                    }}>
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginBottom: '4px' }}>Branches</div>
                        <div style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>{stats.totalBranches}</div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginBottom: '4px' }}>Commits</div>
                        <div style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>{stats.totalCommits}</div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginBottom: '4px' }}>Releases</div>
                        <div style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>{stats.totalReleases}</div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(20, 30, 50, 0.3)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginBottom: '4px' }}>Views</div>
                        <div style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>{stats.totalViews}</div>
                      </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingBottom: '8px'
                    }}>
                      <button 
                        onClick={() => setActiveTab('overview')}
                        style={{
                          padding: '10px 16px',
                          background: activeTab === 'overview' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: activeTab === 'overview' ? '#00c8ff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                        📊 Overview
                      </button>
                      <button 
                        onClick={() => setActiveTab('repositories')}
                        style={{
                          padding: '10px 16px',
                          background: activeTab === 'repositories' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: activeTab === 'repositories' ? '#00c8ff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                        📦 Repositories ({stats.totalRepos})
                      </button>
                      <button 
                        onClick={() => setActiveTab('issues')}
                        style={{
                          padding: '10px 16px',
                          background: activeTab === 'issues' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: activeTab === 'issues' ? '#00c8ff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                        🐛 Issues ({stats.totalIssues})
                      </button>
                      <button 
                        onClick={() => setActiveTab('pulls')}
                        style={{
                          padding: '10px 16px',
                          background: activeTab === 'pulls' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          color: activeTab === 'pulls' ? '#00c8ff' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                        🔀 Pull Requests ({stats.totalPullRequests})
                      </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div style={{ padding: '20px 0' }}>
                      {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          
                          {/* Issues Overview */}
                          <div style={{
                            background: 'rgba(20, 30, 50, 0.3)',
                            borderRadius: '20px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                              🐛 Issues Overview
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Open</div>
                                <div style={{ color: '#00c8ff', fontSize: '20px', fontWeight: 600 }}>{stats.openIssues}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>In Progress</div>
                                <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: 600 }}>{stats.inProgressIssues}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Resolved</div>
                                <div style={{ color: '#00ff88', fontSize: '20px', fontWeight: 600 }}>{stats.resolvedIssues}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Closed</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '20px', fontWeight: 600 }}>{stats.closedIssues}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pull Requests Overview */}
                          <div style={{
                            background: 'rgba(20, 30, 50, 0.3)',
                            borderRadius: '20px',
                            padding: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                              🔀 Pull Requests Overview
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Open</div>
                                <div style={{ color: '#00c8ff', fontSize: '20px', fontWeight: 600 }}>{stats.openPullRequests}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Merged</div>
                                <div style={{ color: '#00ff88', fontSize: '20px', fontWeight: 600 }}>{stats.mergedPullRequests}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Closed</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '20px', fontWeight: 600 }}>{stats.closedPullRequests}</div>
                              </div>
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>Merge Rate</div>
                                <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: 600 }}>
                                  {stats.totalPullRequests > 0 
                                    ? Math.round((stats.mergedPullRequests / stats.totalPullRequests) * 100) 
                                    : 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Languages */}
                          {Object.keys(stats.languages).length > 0 && (
                            <div style={{
                              background: 'rgba(20, 30, 50, 0.3)',
                              borderRadius: '20px',
                              padding: '24px',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                              <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                                💻 Languages
                              </h3>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {Object.entries(stats.languages).map(([lang, count]) => (
                                  <div key={lang} style={{
                                    padding: '8px 16px',
                                    background: 'rgba(0, 200, 255, 0.1)',
                                    borderRadius: '30px',
                                    border: '1px solid rgba(0, 200, 255, 0.2)'
                                  }}>
                                    <span style={{ color: '#00c8ff', fontWeight: 500 }}>{lang}</span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: '8px' }}>{count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'repositories' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {repositories.length === 0 ? (
                            <div style={{
                              background: 'rgba(20, 30, 50, 0.3)',
                              borderRadius: '20px',
                              padding: '48px',
                              textAlign: 'center',
                              border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                              <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>No repositories yet</h4>
                              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                                Create your first repository to start sharing code
                              </p>
                            </div>
                          ) : (
                            repositories.map((repo) => (
                              <div key={repo.id} style={{
                                background: 'rgba(20, 30, 50, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(30, 40, 60, 0.4)';
                                e.currentTarget.style.border = '1px solid rgba(0, 200, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(20, 30, 50, 0.3)';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <h4 style={{ color: '#00c8ff', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                                      {repo.name}
                                    </h4>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '12px' }}>
                                      {repo.description || 'No description provided'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                                        ⭐ {repo.star_count || 0}
                                      </span>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                                        🍴 {repo.fork_count || 0}
                                      </span>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                                        🐛 {repo.issue_count || 0}
                                      </span>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                                        🔀 {repo.pr_count || 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: repo.is_public ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 75, 43, 0.1)',
                                    borderRadius: '20px',
                                    border: `1px solid ${repo.is_public ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 75, 43, 0.3)'}`,
                                    color: repo.is_public ? '#00ff88' : '#ff4b2b',
                                    fontSize: '11px',
                                    fontWeight: 600
                                  }}>
                                    {repo.is_public ? 'PUBLIC' : 'PRIVATE'}
                                  </div>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '11px'
                                  }}>
                                    {repo.language || 'Unknown'}
                                  </span>
                                  <span style={{
                                    padding: '2px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '11px'
                                  }}>
                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'issues' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {repoIssues.length === 0 ? (
                            <div style={{
                              background: 'rgba(20, 30, 50, 0.3)',
                              borderRadius: '20px',
                              padding: '48px',
                              textAlign: 'center',
                              border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐛</div>
                              <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>No issues yet</h4>
                              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                                Your repositories are bug-free! (or no one has reported any)
                              </p>
                            </div>
                          ) : (
                            repoIssues.map((issue) => (
                              <div key={issue.id} style={{
                                background: 'rgba(20, 30, 50, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <h4 style={{ color: 'white', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                                      {issue.title}
                                    </h4>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: '8px' }}>
                                      {issue.description?.substring(0, 100)}...
                                    </p>
                                  </div>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: issue.status === 'open' ? 'rgba(0, 200, 255, 0.1)' :
                                               issue.status === 'in_progress' ? 'rgba(255, 215, 0, 0.1)' :
                                               issue.status === 'resolved' ? 'rgba(0, 255, 136, 0.1)' :
                                               'rgba(255, 75, 43, 0.1)',
                                    borderRadius: '20px',
                                    border: `1px solid ${
                                      issue.status === 'open' ? 'rgba(0, 200, 255, 0.3)' :
                                      issue.status === 'in_progress' ? 'rgba(255, 215, 0, 0.3)' :
                                      issue.status === 'resolved' ? 'rgba(0, 255, 136, 0.3)' :
                                      'rgba(255, 75, 43, 0.3)'
                                    }`,
                                    color: issue.status === 'open' ? '#00c8ff' :
                                           issue.status === 'in_progress' ? '#FFD700' :
                                           issue.status === 'resolved' ? '#00ff88' :
                                           '#ff4b2b',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                  }}>
                                    {issue.status === 'in_progress' ? 'IN PROGRESS' : issue.status}
                                  </div>
                                </div>
                                <div style={{ marginTop: '12px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>
                                  Opened {new Date(issue.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'pulls' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {pullRequests.length === 0 ? (
                            <div style={{
                              background: 'rgba(20, 30, 50, 0.3)',
                              borderRadius: '20px',
                              padding: '48px',
                              textAlign: 'center',
                              border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔀</div>
                              <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>No pull requests</h4>
                              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                                Your code is perfect (or no contributions yet)
                              </p>
                            </div>
                          ) : (
                            pullRequests.map((pr) => (
                              <div key={pr.id} style={{
                                background: 'rgba(20, 30, 50, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <h4 style={{ color: 'white', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                                      {pr.title}
                                    </h4>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: '8px' }}>
                                      {pr.description?.substring(0, 100)}...
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        {pr.source_branch} → {pr.target_branch}
                                      </span>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        {pr.commits || 0} commits
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: pr.status === 'open' ? 'rgba(0, 200, 255, 0.1)' :
                                               pr.status === 'merged' ? 'rgba(0, 255, 136, 0.1)' :
                                               'rgba(255, 75, 43, 0.1)',
                                    borderRadius: '20px',
                                    border: `1px solid ${
                                      pr.status === 'open' ? 'rgba(0, 200, 255, 0.3)' :
                                      pr.status === 'merged' ? 'rgba(0, 255, 136, 0.3)' :
                                      'rgba(255, 75, 43, 0.3)'
                                    }`,
                                    color: pr.status === 'open' ? '#00c8ff' :
                                           pr.status === 'merged' ? '#00ff88' :
                                           '#ff4b2b',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                  }}>
                                    {pr.status}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Account Information */}
                    <div style={{
                      background: 'rgba(20, 30, 50, 0.3)',
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      marginTop: '16px'
                    }}>
                      <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                        🔒 Account Information
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' }}>Provider</div>
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            {user?.app_metadata?.provider || 'email'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' }}>Last Login</div>
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            {new Date(user?.last_sign_in_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' }}>User ID</div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontFamily: 'monospace' }}>
                            {user?.id.substring(0, 8)}...{user?.id.substring(user.id.length - 4)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                          <div style={{ color: 'white', fontSize: '14px' }}>
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '12px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ Modz Repository Interface v1.0
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🎮 {performanceMode ? 'Performance Mode' : 'Immersive Mode'}
              </span>
            </div>
            <div>
              <span>© 2024 Modz</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        .profile-form-scroll::-webkit-scrollbar {
  width: 6px;
}
.profile-form-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.profile-form-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 200, 255, 0.3);
  border-radius: 10px;
}
.profile-form-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.5);
}
      `}</style>
    </div>
  );
}
