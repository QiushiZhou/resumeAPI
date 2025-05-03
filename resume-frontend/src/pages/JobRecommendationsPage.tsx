import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  List,
  Chip,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';

interface Job {
  title: string;
  company: string;
  location: string;
  job_description: string;
  score: number;
  apply_link?: string;
  posted_at?: string | null;
  salary?: string | null;
  requirements?: string[];
  description?: string;
  match_score?: number;
}

const JobRecommendationsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeKeywords, setResumeKeywords] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [resumeContentString, setResumeContentString] = useState<string>('');
  
  const resumeId = location.state?.resumeId;
  const resumeContent = location.state?.resumeContent;

  const [expandedJobs, setExpandedJobs] = useState<{[key: number]: boolean}>({});
  
  // 请求状态标志
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [contentStringLoading, setContentStringLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [apiRequestCompleted, setApiRequestCompleted] = useState(false);
  
  // 切换工作描述的展开状态
  const toggleJobDescription = (index: number) => {
    setExpandedJobs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // 将文本中的换行符转换为JSX换行元素
  const formatText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  // 截取文本函数
  const truncateText = (text: string, maxLength: number = 300) => {
    if (!text) return '';
    
    // 分割为段落，计算总长度
    const paragraphs = text.split('\n');
    let currentLength = 0;
    let truncatedParagraphs = [];
    
    // 拼接段落直到达到最大长度
    for (let para of paragraphs) {
      if (currentLength + para.length <= maxLength) {
        truncatedParagraphs.push(para);
        currentLength += para.length + 1; // +1 for newline
      } else {
        // 如果第一段已经超过最大长度，则截取部分
        if (truncatedParagraphs.length === 0) {
          truncatedParagraphs.push(para.substring(0, maxLength - currentLength) + '...');
        } else {
          truncatedParagraphs.push('...');
        }
        break;
      }
    }
    
    // 如果文本总长度超过最大长度但所有段落都添加了，仍然添加省略号
    if (text.length > maxLength && currentLength < text.length) {
      truncatedParagraphs.push('...');
    }
    
    return truncatedParagraphs.join('\n');
  };

  // 获取基于分数的颜色
  const getScoreColor = (score: number): "success" | "primary" | "info" | "warning" | "error" | "default" => {
    if (score >= 80) return "success";
    if (score >= 70) return "primary";
    if (score >= 60) return "info";
    if (score >= 50) return "warning";
    if (score >= 0) return "error";
    return "default";
  };

  // 处理API响应
  const processJobRecommendations = useCallback((response: any) => {
    let jobs: Job[] = [];
    
    // 从不同格式的响应中提取工作
    if (response.data) {
      if (Array.isArray(response.data)) {
        jobs = response.data;
      } else if (response.data.matches && Array.isArray(response.data.matches)) {
        jobs = response.data.matches.map((job: any) => ({
          ...job,
          description: job.job_description,
          match_score: Math.round(job.score * 100) // 将0-1的分数转换为百分比
        }));
      }
    }
    
    if (jobs.length > 0) {
      setRecommendedJobs(jobs);
      setApiRequestCompleted(true);
    } else {
      setRecommendedJobs([]);
      setError('No matching jobs found for your skills profile.');
    }
    
    // 重置加载状态
    setIsLoading(false);
    setJobsLoading(false);
  }, []);

  // 处理API错误
  const handleApiError = useCallback((err: any) => {
    const errorMessage = err.response 
      ? `Error: ${err.response.status} - ${err.response.statusText}` 
      : 'Could not connect to job matching service. Please ensure the service is running.';
    
    setError(errorMessage);
  }, []);

  // 使用关键词获取工作推荐（作为备选方法）
  const getJobRecommendationsWithKeywords = useCallback(async (keywords: string[]) => {
    if (jobsLoading || recommendedJobs.length > 0) return;
    
    setJobsLoading(true);
    setIsLoading(true);
    setError(null);
    
    try {
      const keywordsString = keywords.join(' ');
      
      const response = await axios.post('/proxy/api/match_jobs', {
        candidate_keywords: keywordsString,
        top_k: 3
      });
      
      processJobRecommendations(response);
      setApiRequestCompleted(true);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setJobsLoading(false);
      setIsLoading(false);
    }
  }, [processJobRecommendations, handleApiError, recommendedJobs.length, jobsLoading]);

  // 使用简历内容字符串获取工作推荐（首选方法）
  const getJobRecommendationsWithString = useCallback(async (contentString: string) => {
    if (jobsLoading || recommendedJobs.length > 0) return;
    
    setJobsLoading(true);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/proxy/api/match_jobs', {
        candidate_keywords: contentString,
        top_k: 3
      });
      
      processJobRecommendations(response);
      setApiRequestCompleted(true);
    } catch (err: any) {
      handleApiError(err);
      // 如果使用内容字符串失败，尝试使用关键词
      if (resumeKeywords.length > 0) {
        getJobRecommendationsWithKeywords(resumeKeywords);
      }
    } finally {
      setJobsLoading(false);
      setIsLoading(false);
    }
  }, [processJobRecommendations, handleApiError, recommendedJobs.length, resumeKeywords, jobsLoading, getJobRecommendationsWithKeywords]);

  // 提取简历关键词
  const extractKeywordsFromResume = useCallback(async () => {
    // 如果已经在加载或有结果，则跳过
    if (keywordsLoading || resumeKeywords.length > 0) return;
    
    setKeywordsLoading(true);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:8080/api/v1/resumes/${resumeId}/extract-keywords`);
      
      if (response.data.status === 'success') {
        const keywords = response.data.data.keywords || [];
        setResumeKeywords(keywords);
        
        // 只有当内容字符串加载失败时，才尝试使用关键词获取工作推荐
        if (keywords.length > 0 && !resumeContentString && apiRequestCompleted) {
          getJobRecommendationsWithKeywords(keywords);
        }
      } else {
        setError('Failed to extract keywords from resume');
      }
    } catch (err) {
      setError('An error occurred while extracting keywords from resume');
    } finally {
      setKeywordsLoading(false);
      setIsLoading(false);
    }
  }, [resumeId, resumeContentString, getJobRecommendationsWithKeywords, apiRequestCompleted, keywordsLoading, resumeKeywords.length]);

  // 获取简历内容字符串
  const getResumeContentString = useCallback(async () => {
    // 如果已经在加载或有结果，则跳过
    if (contentStringLoading || resumeContentString) return;
    
    setContentStringLoading(true);
    setIsLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:8080/api/v1/resumes/${resumeId}/content-string`);
      
      if (response.data.status === 'success') {
        const contentString = response.data.data.content_string || '';
        setResumeContentString(contentString);
        
        // 使用简历内容字符串获取工作推荐
        if (contentString) {
          getJobRecommendationsWithString(contentString);
        }
      } else {
        setApiRequestCompleted(true); // 标记API请求已完成，使用关键词方式
      }
    } catch (err) {
      setError('Error getting detailed resume content. Using keywords instead.');
      setApiRequestCompleted(true); // 标记API请求已完成，使用关键词方式
    } finally {
      setContentStringLoading(false);
      setIsLoading(false);
    }
  }, [resumeId, getJobRecommendationsWithString, resumeContentString, contentStringLoading]);

  // 初始化useEffect
  useEffect(() => {
    // 如果没有简历ID或内容，重定向回简历列表
    if (!resumeId && !resumeContent) {
      navigate('/resumes');
      return;
    }

    // 如果没有进行过API请求且没有获取过关键词或内容字符串
    if (!keywordsLoading && !contentStringLoading && !jobsLoading && 
        resumeKeywords.length === 0 && !resumeContentString && !apiRequestCompleted) {
      
      // 先尝试获取简历内容字符串
      getResumeContentString();
      
      // 同时获取关键词
      extractKeywordsFromResume();
    }
  }, [
    resumeId, 
    resumeContent, 
    navigate, 
    extractKeywordsFromResume, 
    getResumeContentString, 
    resumeKeywords.length, 
    resumeContentString, 
    apiRequestCompleted, 
    keywordsLoading, 
    contentStringLoading, 
    jobsLoading
  ]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          sx={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            pb: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Job Recommendations
          </Typography>
          <Box>
            <Button 
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              Back to Resume
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card 
          sx={{ 
            mb: 4, 
            p: 1,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <CardContent>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                pb: 1
              }}
            >
              Keywords Extracted from Your Resume
            </Typography>
            
            {isLoading && resumeKeywords.length === 0 ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {resumeKeywords.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {resumeKeywords.map((keyword, index) => (
                      <Chip 
                        key={index} 
                        label={keyword} 
                        color="primary" 
                        variant="outlined" 
                        sx={{ mb: 1, fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No keywords extracted. Please go back and try again.
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            pb: 1,
            mb: 3 
          }}
        >
          Recommended Jobs
        </Typography>

        {isLoading && recommendedJobs.length === 0 ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        ) : recommendedJobs.length > 0 ? (
          <List sx={{ p: 0 }}>
            {recommendedJobs.map((job, index) => (
              <React.Fragment key={index}>
                <Card sx={{ 
                  mb: 3, 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                  },
                  // 根据匹配度调整卡片样式
                  ...((() => {
                    const scoreValue = job.match_score !== undefined 
                      ? job.match_score 
                      : Math.round((job.score || 0) * 100);
                    
                    if (scoreValue >= 70) {
                      return { 
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
                      };
                    }
                    return {
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    };
                  })())
                }}>
                  <CardContent sx={{ position: 'relative', p: 3 }}>
                    {/* 竖直分数指示器 */}
                    {(() => {
                      const scoreValue = job.match_score !== undefined 
                        ? job.match_score 
                        : Math.round((job.score || 0) * 100);
                      
                      return (
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0,
                            width: '5px', 
                            height: '100%', 
                            bgcolor: (() => {
                              if (scoreValue >= 80) return 'success.main';
                              if (scoreValue >= 70) return 'primary.main';
                              if (scoreValue >= 60) return 'info.main';
                              if (scoreValue >= 50) return 'warning.main';
                              return 'error.main';
                            })(),
                            opacity: 0.8
                          }} 
                        />
                      );
                    })()}
                    
                    <Box sx={{ pl: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: (() => {
                            const scoreValue = job.match_score !== undefined 
                              ? job.match_score 
                              : Math.round((job.score || 0) * 100);
                            return scoreValue >= 70 ? 'bold' : 'medium';
                          })(),
                          fontSize: '1.3rem',
                          mb: 1
                        }}
                      >
                        {job.title}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        color="text.secondary"
                        sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                      >
                        {job.company} • {job.location}
                      </Typography>
                    
                      <Box 
                        sx={{ 
                          mt: 2, 
                          mb: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        {/* 分数显示 */}
                        {(() => {
                          const scoreValue = job.match_score !== undefined 
                            ? job.match_score 
                            : Math.round((job.score || 0) * 100);
                          
                          // 根据分数获取颜色
                          const scoreColor = getScoreColor(scoreValue);
                          
                          return (
                            <Chip 
                              label={`Match Score: ${scoreValue}%`} 
                              color={scoreColor}
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                height: '32px',
                                // 添加额外样式根据分数调整
                                ...(scoreColor === "success" && { 
                                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)' 
                                }),
                                ...(scoreColor === "error" && { opacity: 0.85 })
                              }}
                            />
                          );
                        })()}
                        
                        {/* Apply按钮调整 */}
                        {job.apply_link && (
                          <Button 
                            variant="contained" 
                            size="medium" 
                            href={job.apply_link} 
                            target="_blank"
                            sx={{ 
                              ml: 1,
                              textTransform: 'none',
                              fontWeight: 'bold'
                            }}
                          >
                            Apply Now
                          </Button>
                        )}
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography 
                          variant="body2" 
                          component="div"
                          sx={{ 
                            lineHeight: 1.6,
                            fontSize: '0.95rem'
                          }}
                        >
                          {expandedJobs[index] 
                            ? formatText(job.description || job.job_description || '') 
                            : formatText(truncateText(job.description || job.job_description || '', 350))}
                        </Typography>
                        
                        {(job.description || job.job_description || '').length > 350 && (
                          <Button
                            onClick={() => toggleJobDescription(index)}
                            endIcon={expandedJobs[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ 
                              mt: 1, 
                              textTransform: 'none',
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                            size="small"
                          >
                            {expandedJobs[index] ? 'Show Less' : 'Show More'}
                          </Button>
                        )}
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography 
                          variant="subtitle2"
                          sx={{ 
                            fontWeight: 'bold',
                            mb: 1
                          }}
                        >
                          Required Skills:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.8} mt={1}>
                          {job.requirements ? job.requirements.map((skill, idx) => (
                            <Chip 
                              key={idx} 
                              label={skill} 
                              size="small" 
                              variant={resumeKeywords.includes(skill) ? "filled" : "outlined"}
                              color={resumeKeywords.includes(skill) ? "success" : "default"}
                              sx={{ mb: 1 }}
                            />
                          )) : (
                            <Typography variant="body2" color="text.secondary">
                              See job description for details
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                {index < recommendedJobs.length - 1 && <Box sx={{ mb: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No job recommendations found. Try adjusting your resume to include more relevant skills.
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default JobRecommendationsPage; 