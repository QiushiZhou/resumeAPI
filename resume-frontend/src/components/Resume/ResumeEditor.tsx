import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove
} from '@dnd-kit/sortable';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

// 导入API服务
import { resumeApi } from '../../services/api';

// 导入重构后的组件
import SortableSection from './SortableSection';
import SortableList from './SortableList';
import SortableItem from './SortableItem';
import ResumeScoreCard from './ResumeScoreCard';
import JobTargetCard from './JobTargetCard';
import OptimizeButton from './OptimizeButton';
import ResumePreview from './ResumePreview';
import StringFieldEditor from './StringFieldEditor';
import ArrayFieldEditor from './ArrayFieldEditor';

// 导入类型
import { ResumeData, AnalysisData } from './utils/types';

interface ResumeEditorProps {
  resumeId: string;
  onComplete?: () => void;
}

// 高亮显示选中条目的样式
const HighlightedItem = styled(Paper)(({ theme }) => ({
  '&.highlight-item': {
    animation: 'highlight-pulse 2s ease-in-out',
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  },
  '@keyframes highlight-pulse': {
    '0%': {
      boxShadow: `0 0 0 0px ${theme.palette.primary.main}`,
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
    },
    '50%': {
      boxShadow: `0 0 0 4px ${theme.palette.primary.main}`,
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
    },
    '100%': {
      boxShadow: `0 0 0 0px ${theme.palette.primary.main}`,
      backgroundColor: 'transparent',
    },
  }
}));

// 悬浮按钮样式
const JobTargetFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
}));

// Add a DialogState interface close to other interfaces
interface DialogState {
  open: boolean;
  title: string;
  content: React.ReactNode;
  actions: React.ReactNode;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumeId, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [fileName, setFileName] = useState('');
  const [score, setScore] = useState(0);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({});
  const [editValues, setEditValues] = useState<{[key: string]: any}>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'personal_info',
    'summary',
    'experience',
    'education',
    'skills'
  ]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isOptimizing, setIsOptimizing] = useState<{[key: string]: boolean}>({});
  const [targetJobTitle, setTargetJobTitle] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // 创建对编辑区域的引用
  const sectionRefs = React.useRef<{[key: string]: HTMLDivElement | null}>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 添加职位目标弹窗状态
  const [jobTargetDialogOpen, setJobTargetDialogOpen] = useState(false);

  // Add this to state declarations in the ResumeEditor component
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillType, setNewSkillType] = useState('array');

  // Add this to state declarations in the ResumeEditor component
  const [dialogState, setDialogState] = useState<DialogState>({ 
    open: false, 
    title: '', 
    content: null, 
    actions: null 
  });

  const navigate = useNavigate();

  // Fetch resume data when component mounts
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get the parsed resume
        const response = await resumeApi.getResume(resumeId);
        
        if (response.data.status === 'success') {
          const resume = response.data.data;
          
          // If resume is not parsed yet, trigger parsing
          if (!resume.content || resume.status !== 'parsed') {
            const parseResponse = await resumeApi.parseResume(resumeId);
            
            if (parseResponse.data.status === 'success') {
              const content = parseResponse.data.data.content;
              setResumeData(content);
              // Initialize section order based on content or saved section_order
              if (content.section_order && Array.isArray(content.section_order)) {
                setSectionOrder(content.section_order);
              } else {
              setSectionOrder(Object.keys(content).filter(key => 
                content[key] && key !== 'raw_text' && typeof content[key] === 'object'
              ));
              }
              setFileName(resume.filename || '');
              
              // After parsing, get or create analysis
              await fetchOrCreateAnalysis(resumeId);
            } else {
              setError('Failed to parse resume');
            }
          } else {
            const content = resume.content;
            setResumeData(content);
            // Initialize section order based on content or saved section_order
            if (content.section_order && Array.isArray(content.section_order)) {
              setSectionOrder(content.section_order);
            } else {
            setSectionOrder(Object.keys(content).filter(key => 
              content[key] && key !== 'raw_text' && typeof content[key] === 'object'
            ));
            }
            setFileName(resume.filename || '');
            
            // Get or create analysis
            await fetchOrCreateAnalysis(resumeId);
          }
        } else {
          setError('Failed to fetch resume data');
        }
      } catch (err) {
        console.error('Error fetching resume data:', err);
        setError('Failed to fetch resume data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (resumeId) {
      fetchResumeData();
    }
  }, [resumeId]);

  // 添加函数来获取或创建简历分析
  const fetchOrCreateAnalysis = async (resumeId: string) => {
    try {
      // First try to get existing analysis
      const analysisResponse = await resumeApi.getAnalysis(resumeId);
      
      if (analysisResponse.data.status === 'success' && 
          analysisResponse.data.data && 
          analysisResponse.data.data.analysis) {
        // Use existing analysis
        setAnalysisData(analysisResponse.data.data.analysis);
        setScore(analysisResponse.data.data.analysis.overall_score || 0);
        console.log("Successfully loaded analysis data:", analysisResponse.data.data.analysis);
      } else {
        // If no analysis exists, create one
        const createAnalysisResponse = await resumeApi.analyzeResume(resumeId);
        
        if (createAnalysisResponse.data.status === 'success' && createAnalysisResponse.data.data) {
          const analysis = createAnalysisResponse.data.data.analysis;
          setAnalysisData(analysis);
          setScore(analysis.overall_score || 0);
          console.log("Successfully created analysis data:", analysis);
        } else {
          console.error('Failed to create analysis', createAnalysisResponse);
          // Fallback to a default score in case of error
          setScore(70);
        }
      }
    } catch (error: any) {
      console.error('Error fetching/creating analysis:', error);
      
      // 检查是否是404错误（分析不存在）
      if (error.response && error.response.status === 404) {
        console.log("Analysis not found, creating new analysis...");
        try {
          // 创建新的分析
          const createAnalysisResponse = await resumeApi.analyzeResume(resumeId);
          
          if (createAnalysisResponse.data.status === 'success' && createAnalysisResponse.data.data) {
            const analysis = createAnalysisResponse.data.data.analysis;
            setAnalysisData(analysis);
            setScore(analysis.overall_score || 0);
            console.log("Successfully created analysis data:", analysis);
          } else {
            console.error('Failed to create analysis after 404', createAnalysisResponse);
      setScore(70);
          }
        } catch (createError) {
          console.error('Error creating analysis after 404:', createError);
          setScore(70);
        }
      } else {
        // 其他错误情况，使用默认分数
        setScore(70);
      }
    }
  };

  const handleEdit = (section: string) => {
    setEditMode({ ...editMode, [section]: true });
    
    // 确保正确复制数据，处理对象或数组类型
    let sectionData = resumeData?.[section];
    if (typeof sectionData === 'object' && sectionData !== null) {
      // 使用深拷贝确保不会直接修改原始数据
      sectionData = JSON.parse(JSON.stringify(sectionData));
    }
    
    setEditValues({ 
      ...editValues, 
      [section]: sectionData || '' 
    });
  };

  const handleSave = async (section: string) => {
    setEditMode({ ...editMode, [section]: false });
    
    // Update local state
    const updatedData = {
      ...resumeData,
      [section]: editValues[section]
    };
    
    setResumeData(updatedData);
    
    // Save to backend
    try {
      await resumeApi.updateResumeContent(resumeId, updatedData);
      console.log(`${section} section updated successfully`);
      
      // Re-analyze the resume after content changes
      if (resumeId) {
        const analyzeResponse = await resumeApi.analyzeResume(resumeId);
        if (analyzeResponse.data.status === 'success') {
          const analysis = analyzeResponse.data.data.analysis;
          setAnalysisData(analysis);
          setScore(analysis.overall_score || 0);
        }
      }
    } catch (error) {
      console.error(`Error updating ${section} section:`, error);
      // Consider adding error notification here
    }
  };

  const handleTextChange = (section: string, value: string) => {
    setEditValues({
      ...editValues,
      [section]: value
    });
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    setEditValues({
      ...editValues,
      [section]: {
        ...editValues[section],
        [field]: value
      }
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // After reordering, save to backend
        try {
          // Only save if we have resume data
          if (resumeData) {
            const sectionOrderData = {
              ...resumeData,
              section_order: newOrder
            };
            resumeApi.updateResumeContent(resumeId, sectionOrderData);
            console.log('Section order updated successfully');
          }
        } catch (error) {
          console.error('Error updating section order:', error);
        }
        
        return newOrder;
      });
    }
  };

  const handleItemsReorder = (section: string, newItems: any[]) => {
    // 更新本地状态
    const updatedData = {
      ...resumeData,
      [section]: newItems
    };
    
    setResumeData(updatedData);
    
    // 保存到后端
    try {
      resumeApi.updateResumeContent(resumeId, updatedData);
      console.log(`${section} items reordered successfully`);
    } catch (error) {
      console.error(`Error updating ${section} order:`, error);
    }
  };

  const handleOptimizeContent = async (
    sectionKey: string, 
    currentContent: string, 
    itemIndex?: number, 
    bulletIndex?: number,
    nestedSection?: string,
    nestedItemIndex?: number
  ) => {
    // Create optimization identifier
    const optimizeId = `${sectionKey}${itemIndex !== undefined ? `-${itemIndex}` : ''}${bulletIndex !== undefined ? `-${bulletIndex}` : ''}${nestedSection ? `-${nestedSection}` : ''}${nestedItemIndex !== undefined ? `-${nestedItemIndex}` : ''}`;
    
    // Set optimization status
    setIsOptimizing(prev => ({ ...prev, [optimizeId]: true }));
    
    try {
      // Call API to optimize content
      const response = await resumeApi.optimizeContent(resumeId, {
        sectionKey,
        itemIndex,
        bulletIndex,
        nestedSection,
        nestedItemIndex,
        currentContent,
        jobTitle: targetJobTitle
      });
      
      // If request is successful
      if (response.data && response.data.status === 'success') {
        const optimizedContent = response.data.data.optimizedContent;
        console.log('原始内容:', currentContent);
        console.log('优化后内容:', optimizedContent);
        
        // Update edit values
        if (!resumeData) return;
        
        const sectionData = resumeData[sectionKey];
        
        // 创建resumeData的深拷贝，用于更新
        const updatedResumeData = JSON.parse(JSON.stringify(resumeData));
        
        if (typeof sectionData === 'string') {
          // Update string field
          setEditValues({
            ...editValues,
            [sectionKey]: optimizedContent
          });
          
          // 直接更新resumeData
          updatedResumeData[sectionKey] = optimizedContent;
        } else if (Array.isArray(sectionData)) {
          // Update array field
          if (bulletIndex !== undefined && itemIndex !== undefined) {
            // Update bullet point in an item
            const newArray = [...editValues[sectionKey]];
            const item = newArray[itemIndex];
            
            if (nestedSection && nestedItemIndex !== undefined) {
              try {
                const nestedItems = [...(item[nestedSection] as any[])];
                const nestedItem = nestedItems[nestedItemIndex];
                
                // 找到嵌套项目中包含字符串数组的字段
                const bulletArrayField = Object.keys(nestedItem).find(key => 
                  Array.isArray(nestedItem[key]) && 
                  nestedItem[key].length > 0 && 
                  typeof nestedItem[key][0] === 'string'
                );
                
                if (bulletArrayField) {
                  // 现在我们找到了正确的字段，更新该字段中的特定项
                  const newBullets = [...nestedItem[bulletArrayField]];
                  newBullets[bulletIndex] = optimizedContent;
                  
                  // 更新嵌套对象
                  nestedItems[nestedItemIndex] = { 
                    ...nestedItem, 
                    [bulletArrayField]: newBullets 
                  };
                  newArray[itemIndex] = { ...item, [nestedSection]: nestedItems };
                  
                  // 更新resumeData中的嵌套项目
                  const updatedArray = [...updatedResumeData[sectionKey]];
                  const updatedItem = {...updatedArray[itemIndex]};
                  const updatedNestedItems = [...updatedItem[nestedSection]];
                  const updatedNestedItem = {...updatedNestedItems[nestedItemIndex]};
                  const updatedBullets = [...updatedNestedItem[bulletArrayField]];
                  updatedBullets[bulletIndex] = optimizedContent;
                  
                  updatedNestedItem[bulletArrayField] = updatedBullets;
                  updatedNestedItems[nestedItemIndex] = updatedNestedItem;
                  updatedItem[nestedSection] = updatedNestedItems;
                  updatedArray[itemIndex] = updatedItem;
                  updatedResumeData[sectionKey] = updatedArray;
                } else {
                  // 如果找不到字符串数组字段，可能是直接更新字段值
                  console.log('嵌套项目结构:', nestedItem);
                  
                  // 尝试找到与currentContent匹配的字段
                  const matchingField = Object.keys(nestedItem).find(key => 
                    nestedItem[key] === currentContent
                  );
                  
                  if (matchingField) {
                    nestedItems[nestedItemIndex] = { 
                      ...nestedItem, 
                      [matchingField]: optimizedContent 
                    };
                    newArray[itemIndex] = { ...item, [nestedSection]: nestedItems };
                    
                    // 更新resumeData
                    const updatedArray = [...updatedResumeData[sectionKey]];
                    const updatedItem = {...updatedArray[itemIndex]};
                    const updatedNestedItems = [...updatedItem[nestedSection]];
                    updatedNestedItems[nestedItemIndex] = { 
                      ...updatedNestedItems[nestedItemIndex], 
                      [matchingField]: optimizedContent 
                    };
                    updatedItem[nestedSection] = updatedNestedItems;
                    updatedArray[itemIndex] = updatedItem;
                    updatedResumeData[sectionKey] = updatedArray;
                  }
                }
              } catch (err) {
                console.error('嵌套项目处理错误:', err);
              }
            } else {
              // Update regular bullet point
              const key = Object.keys(item).find(k => 
                Array.isArray(item[k]) && 
                typeof item[k][0] === 'string'
              );
              
              if (key) {
                const newBullets = [...(item[key] as string[])];
                newBullets[bulletIndex] = optimizedContent;
                newArray[itemIndex] = { ...item, [key]: newBullets };
                
                // 更新resumeData中的常规bullet point
                const updatedArray = [...updatedResumeData[sectionKey]];
                const updatedItem = {...updatedArray[itemIndex]};
                const updatedBullets = [...updatedItem[key]];
                updatedBullets[bulletIndex] = optimizedContent;
                updatedItem[key] = updatedBullets;
                updatedArray[itemIndex] = updatedItem;
                updatedResumeData[sectionKey] = updatedArray;
              }
            }
            
            setEditValues({ ...editValues, [sectionKey]: newArray });
          } else if (itemIndex !== undefined) {
            // 处理单个字段优化的情况 (例如职位名称、公司名等)
            const key = Object.keys(editValues[sectionKey][itemIndex]).find(k => 
              editValues[sectionKey][itemIndex][k] === currentContent
            );
            
            if (key) {
              const newArray = [...editValues[sectionKey]];
              newArray[itemIndex] = { ...newArray[itemIndex], [key]: optimizedContent };
              setEditValues({ ...editValues, [sectionKey]: newArray });
              
              // 更新resumeData
              const updatedArray = [...updatedResumeData[sectionKey]];
              updatedArray[itemIndex] = { ...updatedArray[itemIndex], [key]: optimizedContent };
              updatedResumeData[sectionKey] = updatedArray;
            }
          }
        }
        
        // 更新UI显示
        setResumeData(updatedResumeData);
        
        // 保存到后端
        try {
          resumeApi.updateResumeContent(resumeId, updatedResumeData);
        } catch (error) {
          console.error('Error updating content after optimization:', error);
        }
        
        // Show success message
        setSnackbarMessage('Content optimized successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Show error message
        setSnackbarMessage('Failed to optimize content. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error optimizing content:', error);
      setSnackbarMessage('Error occurred during optimization');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      // Clear optimization status
      setIsOptimizing(prev => ({ ...prev, [optimizeId]: false }));
    }
  };
  
  // 关闭Snackbar通知
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // 处理预览区域点击，滚动到对应的编辑区域并开始编辑
  const handlePreviewSectionClick = (section: string, itemIndex?: number) => {
    console.log(`点击了预览区的 ${section} 部分`, itemIndex !== undefined ? `索引: ${itemIndex}` : '');
    
    // 如果引用存在，则滚动到该位置
    if (sectionRefs.current[section]) {
      sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // 只对用户点击的特定部分启用编辑模式，不影响其他部分
      setEditMode(prevMode => ({
        ...prevMode,
        [section]: true
      }));
      
      // 准备编辑值
      setEditValues(prevValues => ({
        ...prevValues,
        [section]: JSON.parse(JSON.stringify(resumeData?.[section] || ''))
      }));
      
      // 如果点击了特定条目，在下一个渲染周期后将焦点放在该条目上
      if (itemIndex !== undefined && Array.isArray(resumeData?.[section])) {
        // 使用setTimeout确保DOM已更新
        setTimeout(() => {
          // 这里可以添加定位到特定条目的逻辑
          // 例如，使用DOM查询找到该条目并滚动到它
          try {
            const itemElement = document.querySelector(`[data-section="${section}"][data-index="${itemIndex}"]`);
            if (itemElement) {
              (itemElement as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
              // 可选：视觉上高亮该条目
              itemElement.classList.add('highlight-item');
              setTimeout(() => itemElement.classList.remove('highlight-item'), 2000);
            }
          } catch (error) {
            console.error('Error focusing on item:', error);
          }
        }, 300);
      }
    }
  };

  // 处理职位目标弹窗打开关闭
  const handleJobTargetDialogOpen = () => {
    setJobTargetDialogOpen(true);
  };

  const handleJobTargetDialogClose = () => {
    setJobTargetDialogOpen(false);
  };

  // Add function to handle navigation to job recommendations page
  const handleNavigateToJobRecommendations = () => {
    if (resumeData) {
      navigate('/job-recommendations', { 
        state: { 
          resumeId: resumeId,
          resumeContent: resumeData 
        } 
      });
    } else {
      setSnackbarMessage('Resume data not available. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const renderSectionEditor = (section: string, title: string) => {
    if (!resumeData) return null;

    const sectionData = resumeData[section];
    const isEditing = editMode[section] || false;

    // 处理字符串型字段，如summary或objective
    if (typeof sectionData === 'string') {
      return isEditing ? (
        <Box>
          <StringFieldEditor
              value={editValues[section] || ''}
            onChange={(newValue) => handleTextChange(section, newValue)}
            onOptimize={() => handleOptimizeContent(section, editValues[section] || '')}
            multiline={true}
            rows={6}
            />
          <Typography variant="caption" color="text.secondary">
            Tip: Click the magic wand to optimize this content with AI
          </Typography>
        </Box>
      ) : (
        <Typography>{sectionData}</Typography>
      );
    }
    // 处理数组型字段，如experience或education
    else if (Array.isArray(sectionData)) {
      return isEditing ? (
        <Box>
          {editValues[section]?.map((item: any, index: number) => (
            <HighlightedItem 
              key={index} 
              elevation={1} 
              sx={{ mb: 2, p: 2, position: 'relative' }}
              data-section={section}
              data-index={index}
              className={`section-item ${section}-item-${index}`}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Item {index + 1}</Typography>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => {
                    const newArray = [...editValues[section]];
                    newArray.splice(index, 1);
                    setEditValues({
                      ...editValues,
                      [section]: newArray
                    });
                  }}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              {/* Recursive rendering of nested object structure */}
              {Object.entries(item).map(([key, value]) => {
                // Simple string fields
                if (typeof value === 'string') {
                  const optimizeId = `${section}-${index}-${key}`;
                  return (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <TextField
                          fullWidth
                          multiline
                          size="small"
                          value={value || ''}
                          onChange={(e) => {
                            const newArray = [...editValues[section]];
                            newArray[index] = { ...newArray[index], [key]: e.target.value };
                            setEditValues({ ...editValues, [section]: newArray });
                          }}
                        />
                        <IconButton 
                          color="primary"
                          onClick={() => handleOptimizeContent(section, value as string, index)}
                          disabled={isOptimizing[optimizeId]}
                          sx={{ ml: 1 }}
                        >
                          {isOptimizing[optimizeId] ? (
                            <CircularProgress size={24} />
                          ) : (
                            <AutoFixHighIcon />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                  );
                }
                
                // String array fields (like responsibilities)
                else if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'string')) {
                  return (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                      </Typography>
                      
                      {(value as string[]).map((bullet, bulletIndex) => {
                        const optimizeId = `${section}-${index}-${key}-${bulletIndex}`;
                        return (
                          <Box key={bulletIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TextField
                              fullWidth
                              multiline
                              size="small"
                              value={bullet || ''}
                              onChange={(e) => {
                                const newArray = [...editValues[section]];
                                const newBullets = [...(newArray[index][key] as string[])];
                                newBullets[bulletIndex] = e.target.value;
                                newArray[index] = { ...newArray[index], [key]: newBullets };
                                setEditValues({ ...editValues, [section]: newArray });
                              }}
                            />
                            <IconButton 
                              color="primary"
                              onClick={() => handleOptimizeContent(section, bullet, index, bulletIndex)}
                              disabled={isOptimizing[optimizeId]}
                              sx={{ ml: 1 }}
                            >
                              {isOptimizing[optimizeId] ? (
                                <CircularProgress size={20} />
                              ) : (
                                <AutoFixHighIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                const newArray = [...editValues[section]];
                                const newBullets = [...(newArray[index][key] as string[])];
                                newBullets.splice(bulletIndex, 1);
                                newArray[index] = { ...newArray[index], [key]: newBullets };
                                setEditValues({ ...editValues, [section]: newArray });
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                      
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                          const newArray = [...editValues[section]];
                          const newBullets = [...(newArray[index][key] as string[]), ''];
                          newArray[index] = { ...newArray[index], [key]: newBullets };
                          setEditValues({ ...editValues, [section]: newArray });
                        }}
                      >
                        Add Item
                      </Button>
                    </Box>
                  );
                }
                
                // Object array fields (like projects)
                else if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'object')) {
                  return (
                    <Box key={key} sx={{ mb: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                      </Typography>
                      
                      {(value as any[]).map((project, projectIndex) => (
                        <Paper key={projectIndex} elevation={1} sx={{ p: 2, mb: 2, position: 'relative' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" fontWeight="bold">
                              Project {projectIndex + 1}
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                const newArray = [...editValues[section]];
                                const newProjects = [...(newArray[index][key] as any[])];
                                newProjects.splice(projectIndex, 1);
                                newArray[index] = { ...newArray[index], [key]: newProjects };
                                setEditValues({ ...editValues, [section]: newArray });
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          {/* Recursive rendering of nested object structure */}
                          {Object.entries(project).map(([projectKey, projectValue]) => {
                            // Simple string fields in project
                            if (typeof projectValue === 'string') {
                              const optimizeId = `${section}-${index}-${key}-${projectIndex}-${projectKey}`;
                              return (
                                <Box key={projectKey} sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {projectKey.charAt(0).toUpperCase() + projectKey.slice(1).replace(/_/g, ' ')}:
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      size="small"
                                      value={projectValue || ''}
                                      onChange={(e) => {
                                        const newArray = [...editValues[section]];
                                        const newProjects = [...(newArray[index][key] as any[])];
                                        newProjects[projectIndex] = { 
                                          ...newProjects[projectIndex], 
                                          [projectKey]: e.target.value 
                                        };
                                        newArray[index] = { ...newArray[index], [key]: newProjects };
                                        setEditValues({ ...editValues, [section]: newArray });
                                      }}
                                    />
                                    <IconButton 
                                      color="primary"
                                      onClick={() => handleOptimizeContent(
                                        section, 
                                        projectValue as string, 
                                        index, 
                                        undefined, 
                                        key, 
                                        projectIndex
                                      )}
                                      disabled={isOptimizing[optimizeId]}
                                      sx={{ ml: 1 }}
                                    >
                                      {isOptimizing[optimizeId] ? (
                                        <CircularProgress size={20} />
                                      ) : (
                                        <AutoFixHighIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Box>
                                </Box>
                              );
                            }
                            
                            // String array fields in project
                            else if (Array.isArray(projectValue) && (projectValue.length === 0 || typeof projectValue[0] === 'string')) {
                              return (
                                <Box key={projectKey} sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {projectKey.charAt(0).toUpperCase() + projectKey.slice(1).replace(/_/g, ' ')}:
                                  </Typography>
                                  
                                  {(projectValue as string[]).map((bullet, bulletIndex) => {
                                    const optimizeId = `${section}-${index}-${key}-${projectIndex}-${projectKey}-${bulletIndex}`;
                                    return (
                                      <Box key={bulletIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TextField
                                          fullWidth
                                          multiline
                                          size="small"
                                          value={bullet || ''}
                                          onChange={(e) => {
                                            const newArray = [...editValues[section]];
                                            const newProjects = [...(newArray[index][key] as any[])];
                                            const newBullets = [...(newProjects[projectIndex][projectKey] as string[])];
                                            newBullets[bulletIndex] = e.target.value;
                                            newProjects[projectIndex] = { 
                                              ...newProjects[projectIndex], 
                                              [projectKey]: newBullets 
                                            };
                                            newArray[index] = { ...newArray[index], [key]: newProjects };
                                            setEditValues({ ...editValues, [section]: newArray });
                                          }}
                                        />
                                        <IconButton 
                                          color="primary"
                                          onClick={() => handleOptimizeContent(
                                            section, 
                                            bullet, 
                                            index, 
                                            bulletIndex, 
                                            key, 
                                            projectIndex
                                          )}
                                          disabled={isOptimizing[optimizeId]}
                                          sx={{ ml: 1 }}
                                        >
                                          {isOptimizing[optimizeId] ? (
                                            <CircularProgress size={20} />
                                          ) : (
                                            <AutoFixHighIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          color="error"
                                          onClick={() => {
                                            const newArray = [...editValues[section]];
                                            const newProjects = [...(newArray[index][key] as any[])];
                                            const newBullets = [...(newProjects[projectIndex][projectKey] as string[])];
                                            newBullets.splice(bulletIndex, 1);
                                            newProjects[projectIndex] = { 
                                              ...newProjects[projectIndex], 
                                              [projectKey]: newBullets 
                                            };
                                            newArray[index] = { ...newArray[index], [key]: newProjects };
                                            setEditValues({ ...editValues, [section]: newArray });
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    );
                                  })}
                                  
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => {
                                      const newArray = [...editValues[section]];
                                      const newProjects = [...(newArray[index][key] as any[])];
                                      const newBullets = [...(newProjects[projectIndex][projectKey] as string[]), ''];
                                      newProjects[projectIndex] = { 
                                        ...newProjects[projectIndex], 
                                        [projectKey]: newBullets 
                                      };
                                      newArray[index] = { ...newArray[index], [key]: newProjects };
                                      setEditValues({ ...editValues, [section]: newArray });
                                    }}
                                  >
                                    Add Item
                                  </Button>
                                </Box>
                              );
                            }
                            
                            return null;
                          })}
                        </Paper>
                      ))}
                      
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => {
                          const newArray = [...editValues[section]];
                          const newProjects = [...(newArray[index][key] as any[])];
                          
                          // Create new project template
                          const newProjectTemplate: Record<string, any> = {};
                          if (newProjects.length > 0) {
                            // Create based on existing project structure
                            Object.keys(newProjects[0]).forEach(k => {
                              if (Array.isArray(newProjects[0][k])) {
                                newProjectTemplate[k] = [];
                              } else {
                                newProjectTemplate[k] = '';
                              }
                            });
                          } else {
                            // Default project template
                            newProjectTemplate.name = '';
                            newProjectTemplate.responsibilities = [''];
                          }
                          
                          newProjects.push(newProjectTemplate);
                          newArray[index] = { ...newArray[index], [key]: newProjects };
                          setEditValues({ ...editValues, [section]: newArray });
                        }}
                      >
                        Add Project
                      </Button>
                    </Box>
                  );
                }
                
                return null;
              })}
            </HighlightedItem>
          ))}
          
          <Button 
            variant="outlined" 
            onClick={() => {
              const newItem: Record<string, any> = {};
              if (editValues[section].length > 0) {
                // Create new item based on existing structure
                Object.entries(editValues[section][0]).forEach(([key, value]) => {
                  if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object') {
                      newItem[key] = []; // Empty array for object arrays
                    } else {
                      newItem[key] = ['']; // String array with empty item
                    }
                  } else {
                    newItem[key] = '';
                  }
                });
              }
              setEditValues({
                ...editValues,
                [section]: [...editValues[section], newItem]
              });
            }}
          >
            Add Item
          </Button>
        </Box>
      ) : (
        <SortableList 
          items={sectionData} 
          sectionKey={section}
          onReorder={(newItems) => handleItemsReorder(section, newItems)}
        />
      );
    }
    // 处理对象型字段，如skills
    else if (typeof sectionData === 'object' && sectionData !== null) {
      return isEditing ? (
        <Box>
          {/* 对象类型编辑界面 */}
          {Object.entries(editValues[section] || {}).map(([key, value]) => {
            // 处理字符串类型的值
            if (typeof value === 'string') {
              const optimizeId = `${section}-${key}`;
              return (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      multiline
                      size="small"
                      value={value || ''}
                      onChange={(e) => {
                        setEditValues({
                          ...editValues,
                          [section]: {
                            ...editValues[section],
                            [key]: e.target.value
                          }
                        });
                      }}
                    />
                    <OptimizeButton 
                      onClick={() => handleOptimizeContent(section, value as string)}
                      isOptimizing={!!isOptimizing[optimizeId]}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>
              );
            }
            // 处理数组类型的值
            else if (Array.isArray(value)) {
              return (
                <Box key={key} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                  </Typography>
                  
                  {(value as string[]).map((item, itemIndex) => {
                    const optimizeId = `${section}-${key}-${itemIndex}`;
                    return (
                      <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          size="small"
                          value={item || ''}
                          onChange={(e) => {
                            const newArray = [...(editValues[section][key] as string[])];
                            newArray[itemIndex] = e.target.value;
                            setEditValues({
                              ...editValues,
                              [section]: {
                                ...editValues[section],
                                [key]: newArray
                              }
                            });
                          }}
                        />
                        <IconButton 
                          color="primary"
                          onClick={() => handleOptimizeContent(section, item, undefined, itemIndex)}
                          disabled={isOptimizing[optimizeId]}
                          sx={{ ml: 1 }}
                        >
                          {isOptimizing[optimizeId] ? (
                            <CircularProgress size={20} />
                          ) : (
                            <AutoFixHighIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            const newArray = [...(editValues[section][key] as string[])];
                            newArray.splice(itemIndex, 1);
                            setEditValues({
                              ...editValues,
                              [section]: {
                                ...editValues[section],
                                [key]: newArray
                              }
                            });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                  
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                      const currentArray = editValues[section][key] as string[] || [];
                      setEditValues({
                        ...editValues,
                        [section]: {
                          ...editValues[section],
                          [key]: [...currentArray, '']
                        }
                      });
                    }}
                  >
                    Add Item
                  </Button>
                </Box>
              );
            }
            
            return null;
          })}
          
          {/* 添加新类别按钮 */}
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={() => {
                // 弹出对话框让用户输入新的技能类别
                const categoryName = prompt("Enter new skill category name:");
                if (categoryName) {
                  setEditValues({
                    ...editValues,
                    [section]: {
                      ...editValues[section],
                      [categoryName.toLowerCase().replace(/\s+/g, '_')]: ['']
                    }
                  });
                }
              }}
            >
              Add New Category
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleSave(section)}
            >
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          {Object.entries(sectionData).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
              </Typography>
              <Typography>
                {Array.isArray(value) 
                  ? (value as string[]).join(', ')
                  : value as string}
              </Typography>
            </Box>
          ))}
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(section)}
            sx={{ mt: 1 }}
          >
            Edit
          </Button>
        </Box>
      );
    }

    return null;
  };

  const renderScoreCard = () => {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resume Score
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <Box 
            sx={{ 
              position: 'relative', 
              display: 'inline-flex',
              width: 120,
              height: 120
            }}
          >
            <CircularProgress 
              variant="determinate" 
              value={score} 
              size={120} 
              thickness={5} 
              sx={{ color: score > 80 ? 'success.main' : score > 60 ? 'warning.main' : 'error.main' }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color="text.secondary">
                {score}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            out of 100
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mt: 3 }}>Improvement Areas</Typography>
        <List dense>
          {analysisData ? (
            <>
              <ListItem>
                <ListItemText 
                  primary="Technical Skills" 
                  secondary={`${analysisData.technical_score || 0}%`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ATS Compatibility" 
                  secondary={`${analysisData.ats_compatibility_score || 0}%`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Communication" 
                  secondary={`${analysisData.communication_score || 0}%`} 
                />
              </ListItem>
              {analysisData.areas_for_improvement && analysisData.areas_for_improvement.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Suggestions:</Typography>
                  <List dense>
                    {analysisData.areas_for_improvement.slice(0, 3).map((area: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={<Typography variant="body2" component="div">{area}</Typography>}
                          sx={{ m: 0 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </>
          ) : (
            // Fallback for when analysis data is not available
            <>
              <ListItem>
                <ListItemText 
                  primary="Skills Matching" 
                  secondary="Loading..." 
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ATS Compatibility" 
                  secondary="Loading..." 
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Impact Statements" 
                  secondary="Loading..." 
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </>
          )}
        </List>
      </Paper>
    );
  };

  const renderJobTargetOptimization = () => {
    return (
      <Paper>
        <Typography variant="h6" gutterBottom>
          Job Target Optimization
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter your target job position, and AI will optimize your resume content for this role
        </Typography>
        <TextField
          fullWidth
          placeholder="e.g. Software Engineer, Product Manager, Data Analyst"
          variant="outlined"
          value={targetJobTitle}
          onChange={(e) => setTargetJobTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary" paragraph>
          Adding a target position will help AI customize content based on industry standards
        </Typography>
      </Paper>
    );
  };

  const renderSkillsEditor = () => {
    if (!resumeData?.skills) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Skills</Typography>
        
        {/* Dynamically render editors for each skill category */}
        {Object.entries(resumeData.skills).map(([key, value]) => {
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          
          // Handle array values
          if (Array.isArray(value)) {
            return (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{formattedKey}</Typography>
                <ArrayFieldEditor
                  value={value as string[]}
                  onChange={(newValue: string[]) => {
                    const updatedSkills = {
                      ...resumeData.skills,
                      [key]: newValue
                    };
                    setResumeData({
                      ...resumeData,
                      skills: updatedSkills
                    });
                  }}
                  onOptimize={() => handleOptimizeContent('skills', key)}
                />
              </Box>
            );
          }
          
          // Handle string values
          if (typeof value === 'string') {
            return (
              <Box key={key} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{formattedKey}</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={value}
                  onChange={(e) => {
                    const updatedSkills = {
                      ...resumeData.skills,
                      [key]: e.target.value
                    };
                    setResumeData({
                      ...resumeData,
                      skills: updatedSkills
                    });
                  }}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<AutoFixHighIcon />}
                  onClick={() => handleOptimizeContent('skills', key)}
                >
                  Optimize
                </Button>
              </Box>
            );
          }
          
          return null;
        })}

        {/* Add New Skill Category Button */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            // Show dialog to add new skill category
            setDialogState({
              open: true,
              title: 'Add Skill Category',
              content: (
                <>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="category"
                    label="Category Name"
                    fullWidth
                    variant="outlined"
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <FormLabel id="skill-type">Type</FormLabel>
                    <RadioGroup
                      row
                      aria-labelledby="skill-type"
                      name="skill-type"
                      value={newSkillType}
                      onChange={(e) => setNewSkillType(e.target.value)}
                    >
                      <FormControlLabel value="array" control={<Radio />} label="List of Skills" />
                      <FormControlLabel value="string" control={<Radio />} label="Text Description" />
                    </RadioGroup>
                  </FormControl>
                </>
              ),
              actions: (
                <>
                  <Button onClick={() => setDialogState({ ...dialogState, open: false })}>Cancel</Button>
                  <Button onClick={() => {
                    // Format category name to snake_case
                    const categoryKey = newSkillCategory.toLowerCase().replace(/\s+/g, '_');
                    
                    // Create new skills object with the new category
                    const updatedSkills = {
                      ...resumeData.skills,
                      [categoryKey]: newSkillType === 'array' ? [] : ''
                    };
                    
                    // Update resume data
                    setResumeData({
                      ...resumeData,
                      skills: updatedSkills
                    });
                    
                    // Reset state and close dialog
                    setNewSkillCategory('');
                    setNewSkillType('array');
                    setDialogState({ ...dialogState, open: false });
                  }}>
                    Add
                  </Button>
                </>
              )
            });
          }}
        >
          Add Skill Category
        </Button>
      </Box>
    );
  };

  const renderCustomDialog = () => {
    return (
      <Dialog
        open={dialogState.open}
        onClose={() => setDialogState({ ...dialogState, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialogState.title}</DialogTitle>
        <DialogContent>
          {dialogState.content}
        </DialogContent>
        <DialogActions>
          {dialogState.actions}
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Analyzing your resume...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!resumeData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No resume data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: 1, // 减少上下边距
      px: 0, 
      width: '100%', 
      maxWidth: '100%', 
      mx: 'auto',
      height: 'calc(100vh - 20px)', // 使用接近全屏高度
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Typography variant="h5">
          Resume Content
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Resume File: {fileName}
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={0} sx={{ 
        flex: 1, // 让Stack填充剩余空间
        overflow: 'hidden' // 避免页面滚动条
      }}>
        {/* 左侧编辑区 */}
        <Box sx={{ 
          width: '50%', 
          height: '100%', 
          overflow: 'auto', 
          borderRight: '1px solid #eee',
          pr: 2,
          pl: 2,
          maxWidth: 'none'
        }}>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={sectionOrder}
                strategy={verticalListSortingStrategy}
              >
                {sectionOrder.map((section) => (
                  resumeData && (
                    <SortableSection
                      key={section}
                      id={section}
                      section={section}
                      resumeData={resumeData}
                      editMode={editMode}
                      handleEdit={handleEdit}
                      handleSave={handleSave}
                      renderSectionEditor={renderSectionEditor}
                    ref={(el: HTMLDivElement | null) => {
                      sectionRefs.current[section] = el;
                    }}
                    />
                  )
                ))}
              </SortableContext>
            </DndContext>
          </Box>
          
        {/* 右侧预览区 */}
        <Box sx={{ 
          width: '50%', 
          height: '100%', 
          overflow: 'auto',
          bgcolor: '#f8f9fa',
          borderRadius: 0,
          p: 3,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
          maxWidth: 'none'
        }}>
          <ResumePreview 
            resumeData={resumeData} 
            onSectionClick={handlePreviewSectionClick}
            sectionOrder={sectionOrder}
            />
          </Box>
        </Stack>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<VisibilityIcon />}
            onClick={() => {
            setLoading(true);
            
            resumeApi.generateCustomPDF(resumeId)
              .then(response => {
                const file = new Blob(
                  [response.data], 
                  { type: 'application/pdf' }
                );
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL, '_blank');
              })
              .catch(error => {
                console.error('Error generating PDF preview:', error);
                alert('Failed to generate PDF preview. Please try again.');
              })
              .finally(() => {
                setLoading(false);
              });
            }}
          >
            Preview PDF
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<WorkOutlineIcon />}
            onClick={handleNavigateToJobRecommendations}
          >
            Recommend Jobs
          </Button>
          
          <Tooltip title="Complete editing and proceed to download step">
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<FileDownloadIcon />}
              onClick={onComplete}
            >
              Continue to Download
            </Button>
          </Tooltip>
      </Box>
      
      {/* 职位目标优化悬浮按钮 */}
      <Tooltip title="Set target job position to optimize your resume">
        <JobTargetFab 
          color="primary" 
          aria-label="set job target"
          onClick={handleJobTargetDialogOpen}
        >
          <WorkIcon />
        </JobTargetFab>
      </Tooltip>

      {/* 职位目标优化弹窗 */}
      <Dialog 
        open={jobTargetDialogOpen} 
        onClose={handleJobTargetDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Job Target Optimization</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your target job position, and AI will optimize your resume content for this role
          </Typography>
          <TextField
            fullWidth
            label="Target Position"
            placeholder="e.g. Software Engineer, Product Manager, Data Analyst"
            variant="outlined"
            value={targetJobTitle}
            onChange={(e) => setTargetJobTitle(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Adding a target position will help AI customize content based on industry standards
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJobTargetDialogClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleJobTargetDialogClose}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Snackbar notification */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {renderCustomDialog()}
    </Box>
  );
};

export default ResumeEditor; 