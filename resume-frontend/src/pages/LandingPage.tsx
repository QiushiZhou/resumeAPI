import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Container,
  CircularProgress,
  Alert,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
  styled,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import ResumeUpload from '../components/Resume/ResumeUpload';
import ResumeEditor from '../components/Resume/ResumeEditor';
import { resumeApi } from '../services/api';

// 使用styled API创建自定义样式组件
const GradientBackground = styled(Box)(({ theme }) => ({
  width: '100%',
  minHeight: 'calc(100vh - 64px)',
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, #e8f4fc 100%)`,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const FeaturesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
}));

const FeatureItem = styled(Box)(({ theme }) => ({
  flex: '1 1 calc(33.333% - 32px)',
  minWidth: '280px',
  [theme.breakpoints.down('md')]: {
    flex: '1 1 100%',
  },
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedResume, setProcessedResume] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    'Upload Resume',
    'AI Analysis',
    'Edit & Optimize',
    'Download'
  ];
  
  // 检查location state中是否有resumeId，如果有则直接跳转到分析页面
  useEffect(() => {
    if (location.state && location.state.resumeId) {
      const id = location.state.resumeId;
      console.log('Loading resume from state:', id);
      setResumeId(id);
      setActiveStep(1);
      setIsAnalyzing(false);
    }
  }, [location.state]);
  
  const handleUploadSuccess = (id: string) => {
    console.log('Resume uploaded successfully with ID:', id);
    setResumeId(id);
    setActiveStep(1);
    setIsAnalyzing(false);
    setUploadedFileName(id);
  };
  
  const handleResumeEditComplete = () => {
    // Move to the final step when resume editing is complete
    setActiveStep(2);
  };
  
  const handleStartEdit = () => {
    setIsEditing(true);
  };
  
  const handleSaveEdit = (editedContent: string) => {
    setProcessedResume(editedContent);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleDownload = async () => {
    if (!resumeId) return;
    
    try {
      setIsDownloading(true);
      const response = await resumeApi.generateCustomPDF(resumeId);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized_resume_${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError('Failed to download the resume. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <GradientBackground>
      <Container maxWidth="lg">
        <Fade in={true} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(45deg, #3a7bd5 0%, #00bcd4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2 
              }}
            >
              AI Resume Optimizer
            </Typography>
            <Typography 
              variant="h5" 
              color="textSecondary" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto', 
                mb: 4,
                fontWeight: 400 
              }}
            >
              Upload your resume, let AI analyze and optimize it to boost your job search success
            </Typography>
            
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                mb: 6,
                '& .MuiStepLabel-labelContainer': {
                  mt: 1
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Fade>
        
        {!user ? (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h5" gutterBottom>
              Please login to use our services
            </Typography>
            <Typography color="textSecondary" paragraph>
              Log in to upload your resume and get optimization suggestions
            </Typography>
          </Paper>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {activeStep === 0 && (
              <Box>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 4, 
                    mb: 6,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Start by uploading your resume
                  </Typography>
                  <ResumeUpload 
                    onUploadSuccess={handleUploadSuccess} 
                  />
                </Paper>
                
                <Typography variant="h4" align="center" sx={{ mt: 8, mb: 4 }}>
                  Our Benefits
                </Typography>
                <FeaturesContainer>
                  <FeatureItem>
                    <FeatureCard elevation={2}>
                      <Box sx={{ p: 2, color: theme.palette.primary.main }}>
                        <CloudUploadIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>Intelligent Analysis</Typography>
                      <Typography color="textSecondary">
                        AI-driven resume analysis identifies key strengths and weaknesses
                      </Typography>
                    </FeatureCard>
                  </FeatureItem>
                  <FeatureItem>
                    <FeatureCard elevation={2}>
                      <Box sx={{ p: 2, color: theme.palette.secondary.main }}>
                        <EditIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>Professional Optimization</Typography>
                      <Typography color="textSecondary">
                        Personalized resume suggestions tailored to different industries
                      </Typography>
                    </FeatureCard>
                  </FeatureItem>
                  <FeatureItem>
                    <FeatureCard elevation={2}>
                      <Box sx={{ p: 2, color: theme.palette.success.main }}>
                        <CheckCircleIcon sx={{ fontSize: 48 }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>Improved Success Rate</Typography>
                      <Typography color="textSecondary">
                        Increase your resume pass rate and interview opportunities
                      </Typography>
                    </FeatureCard>
                  </FeatureItem>
                </FeaturesContainer>
              </Box>
            )}
            
            {activeStep === 1 && resumeId && (
              <Box>
                {isAnalyzing ? (
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Typography variant="h5" gutterBottom>
                      Analyzing your resume
                    </Typography>
                    <CircularProgress sx={{ my: 4 }} />
                    <Typography color="textSecondary">
                      Please wait, we're processing your file
                    </Typography>
                  </Paper>
                ) : (
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Typography variant="h5" gutterBottom>
                      AI Optimization
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <ResumeEditor 
                      resumeId={resumeId} 
                      onComplete={handleResumeEditComplete}
                    />
                  </Paper>
                )}
              </Box>
            )}
            
            {activeStep === 2 && (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography variant="h5" gutterBottom>
                  Download Results
                </Typography>
                <Typography color="textSecondary" paragraph>
                  Your resume has been optimized, you can download the results.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  sx={{ 
                    minWidth: 160,
                    py: 1,
                    px: 3,
                    borderRadius: '50px',
                    background: !isDownloading ? 'linear-gradient(45deg, #3a7bd5 0%, #00bcd4 100%)' : undefined
                  }}
                >
                  {isDownloading ? 'Downloading...' : 'Download Optimized Resume'}
                </Button>
              </Paper>
            )}
          </>
        )}
      </Container>
    </GradientBackground>
  );
};

export default LandingPage; 