import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Chip,
  IconButton,
  Stack,
  Paper,
  Autocomplete,
  Tooltip,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Job {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  apply_link: string;
  posted_at: string | null;
  job_description: string;
}

const JobSearchPage: React.FC = () => {
  // 搜索参数状态
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // API状态
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const jobsPerPage = 5;

  // 自动补全选项
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  
  // 扩展显示的工作描述
  const [expandedJobIndex, setExpandedJobIndex] = useState<number | null>(null);

  // 计算当前页面应该显示的工作项
  const currentJobs = useMemo(() => {
    const startIndex = (page - 1) * jobsPerPage;
    return allJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [allJobs, page, jobsPerPage]);

  // 计算总页数
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(allJobs.length / jobsPerPage)), 
    [allJobs.length, jobsPerPage]
  );

  // 从职位数据提取建议选项
  const extractSuggestions = useCallback((jobs: Job[]) => {
    if (!jobs.length) return;
    
    const titles = Array.from(new Set(jobs.map(job => job.title)));
    const locations = Array.from(new Set(jobs.map(job => job.location).filter(Boolean)));
    
    setTitleSuggestions(prev => {
      // 使用数组方法合并并去重
      const combined = [...prev];
      titles.forEach(title => {
        if (!combined.includes(title)) {
          combined.push(title);
        }
      });
      return combined;
    });
    
    setLocationSuggestions(prev => {
      // 使用数组方法合并并去重
      const combined = [...prev];
      locations.forEach(location => {
        if (!combined.includes(location)) {
          combined.push(location);
        }
      });
      return combined;
    });
  }, []);

  // 获取已存储的职位数据
  const fetchLocalJobs = useCallback(async () => {
    // 防止重复请求
    if (isLoading) return; 
    
    setIsLoading(true);
    setError(null);
    
    try {
      let params: Record<string, string> = {};
      
      if (searchTitle) params.title = searchTitle;
      if (searchLocation) params.location = searchLocation;
      
      console.log("Fetching jobs with params:", params);
      const response = await axios.get('/proxy/api/jobs', { params });
      const fetchedJobs = response.data || [];
      
      setAllJobs(fetchedJobs);
      // 只在有新数据时处理建议
      if (fetchedJobs.length > 0) {
        extractSuggestions(fetchedJobs);
      }
      
      if (fetchedJobs.length === 0 && (searchTitle || searchLocation)) {
        setError('No jobs found matching your criteria. Try different search terms or refresh job data.');
      }
    } catch (err: any) {
      setError(`Error fetching jobs: ${err.message || 'Unknown error'}`);
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTitle, searchLocation, extractSuggestions, isLoading]);

  // 获取所有建议数据（添加检查避免重复调用）
  const fetchAllSuggestions = useCallback(async () => {
    // 防止已有大量建议时的不必要请求
    if (titleSuggestions.length > 10 && locationSuggestions.length > 5) return;
    
    console.log("Fetching all suggestions");
    try {
      const response = await axios.get('/proxy/api/jobs');
      if (response.data && Array.isArray(response.data)) {
        extractSuggestions(response.data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }, [extractSuggestions, titleSuggestions.length, locationSuggestions.length]);

  // 从API获取新的职位数据
  const fetchNewJobs = useCallback(async () => {
    if (isFetchingNew) return; // 防止重复请求
    
    setIsFetchingNew(true);
    setError(null);
    setFetchSuccess(false);
    setAlertVisible(false);
    
    try {
      let params: Record<string, string> = {};
      
      if (searchTitle) params.query = searchTitle;
      if (searchLocation) params.location = searchLocation;
      params.max_pages = '1';
      
      await axios.get('/proxy/jobs/fetch_jobs', { params });
      setFetchSuccess(true);
      setAlertVisible(true);
      
      // 重新加载本地数据
      await fetchLocalJobs();
    } catch (err: any) {
      setError(`Error fetching new jobs: ${err.message || 'Unknown error'}`);
      console.error('Error fetching new jobs:', err);
    } finally {
      setIsFetchingNew(false);
    }
  }, [searchTitle, searchLocation, fetchLocalJobs, isFetchingNew]);

  // Auto-dismiss success alert
  useEffect(() => {
    if (alertVisible) {
      const timer = setTimeout(() => setAlertVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertVisible]);

  // 组件加载时获取数据
  useEffect(() => {
    // 使用一个标志变量确保只在组件首次加载时调用
    const shouldFetchInitialData = true;
    if (shouldFetchInitialData) {
      fetchLocalJobs();
      fetchAllSuggestions();
    }
    // 空依赖数组确保只在组件挂载时执行一次
  }, []);
  
  // 分离获取建议的逻辑，避免不必要的重新获取
  useEffect(() => {
    // 仅当没有建议数据时才获取
    if (titleSuggestions.length === 0 && locationSuggestions.length === 0) {
      fetchAllSuggestions();
    }
  }, [fetchAllSuggestions, titleSuggestions.length, locationSuggestions.length]);

  // 处理页码变化
  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    setExpandedJobIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 节流版本的搜索处理函数
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLocalJobs();
  }, [fetchLocalJobs]);
  
  // 优化清除搜索函数
  const clearSearch = useCallback(() => {
    // 一次性更新所有状态，减少重新渲染次数
    setSearchTitle('');
    setSearchLocation('');
    setPage(1);
    setError(null);
    
    // 仅当有搜索条件时才重新获取
    if (searchTitle || searchLocation) {
      setTimeout(fetchLocalJobs, 0);
    }
  }, [fetchLocalJobs, searchTitle, searchLocation]);

  // 切换职位描述展开/折叠
  const toggleJobDescription = (index: number) => {
    setExpandedJobIndex(expandedJobIndex === index ? null : index);
  };

  // 过滤自动补全选项
  const filterOptions = (options: string[], state: { inputValue: string }) => {
    const inputValue = state.inputValue.toLowerCase().trim();
    if (!inputValue) return options;
    return options.filter(option => option.toLowerCase().includes(inputValue));
  };

  // 渲染职位卡片
  const renderJobCard = (job: Job, index: number) => (
    <Card 
      key={index} 
      elevation={1}
      sx={{ 
        overflow: 'visible',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 职位标题和公司 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                  {job.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle1" color="text.secondary">
                    {job.company}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Salary:
                  </Typography>
                  {job.salary ? (
                    <Chip 
                      label={job.salary} 
                      color="success" 
                      variant="outlined" 
                      sx={{ fontWeight: 500 }} 
                    />
                  ) : (
                    <Tooltip title="Salary information is not available for this position">
                      <Chip 
                        label="N/A" 
                        color="default" 
                        size="small"
                        variant="outlined" 
                        sx={{ fontSize: '0.75rem', opacity: 0.7 }} 
                      />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* 位置和日期 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {job.location || 'Location not specified'}
                </Typography>
              </Box>
              {job.posted_at && (
                <Typography variant="body2" color="text.secondary">
                  Posted: {job.posted_at}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* 职位描述 */}
          <Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ 
                maxHeight: expandedJobIndex === index ? 'none' : '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: expandedJobIndex === index ? 'block' : '-webkit-box',
                WebkitLineClamp: expandedJobIndex === index ? 'unset' : 4,
                WebkitBoxOrient: 'vertical',
                mb: 1,
                whiteSpace: 'pre-line'
              }}>
                {job.job_description}
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => toggleJobDescription(index)}
                sx={{ mt: 1 }}
              >
                {expandedJobIndex === index ? 'Show Less' : 'Show More'}
              </Button>
            </Box>
          </Box>
          
          {/* 应用按钮 */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                href={job.apply_link} 
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2 }}
              >
                Apply Now
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(90deg, #4f6df5 0%, #6c63ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Job Search
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Find your next career opportunity
        </Typography>
      </Box>
      
      {/* 搜索表单 */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                freeSolo
                options={titleSuggestions}
                filterOptions={filterOptions}
                value={searchTitle}
                onChange={(_, newValue) => setSearchTitle(newValue || '')}
                onInputChange={(_, newValue) => setSearchTitle(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Job Title"
                    variant="outlined"
                    placeholder="e.g. Software Engineer, Data Scientist"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Autocomplete
                freeSolo
                options={locationSuggestions}
                filterOptions={filterOptions}
                value={searchLocation}
                onChange={(_, newValue) => setSearchLocation(newValue || '')}
                onInputChange={(_, newValue) => setSearchLocation(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Location"
                    variant="outlined"
                    placeholder="e.g. New York, Remote"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<SearchIcon />}
                disabled={isLoading || isFetchingNew}
                sx={{
                  py: 1.2,
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Search
              </Button>
              {(searchTitle || searchLocation) && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={clearSearch}
                  disabled={isLoading || isFetchingNew}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
      
      {/* 功能按钮 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchNewJobs}
          disabled={isFetchingNew}
          sx={{ 
            borderRadius: 2,
            '&:hover': {
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          {isFetchingNew ? 'Fetching New Jobs...' : 'Refresh Job Data'}
        </Button>
      </Box>
      
      {/* 加载指示器、错误和成功提示 */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}
      
      {error && (
        <Alert severity="info" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {fetchSuccess && alertVisible && (
        <Alert 
          severity="success" 
          sx={{ mb: 4 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setAlertVisible(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          New job data successfully fetched and loaded!
        </Alert>
      )}
      
      {/* 职位列表 */}
      {!isLoading && allJobs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Showing {currentJobs.length} of {allJobs.length} jobs 
            {page > 1 && ` (Page ${page} of ${totalPages})`}
          </Typography>
          
          <Stack spacing={3}>
            {currentJobs.map((job, index) => renderJobCard(job, index))}
          </Stack>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '1rem',
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* 无结果显示 */}
      {!isLoading && allJobs.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Try different search terms or click "Refresh Job Data" to fetch new jobs
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default JobSearchPage; 