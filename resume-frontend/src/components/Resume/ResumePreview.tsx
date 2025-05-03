import React from 'react';
import { 
  Box,
  Typography,
  Paper,
  Divider,
  styled,
  Link,
} from '@mui/material';

// LaTeX-styled components
const ResumeContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  padding: theme.spacing(4),
  backgroundColor: '#fff',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: '"Computer Modern", "Times New Roman", serif',
  lineHeight: '1.2',
  '@media print': {
    maxWidth: '100%',
    boxShadow: 'none',
    margin: 0,
    padding: theme.spacing(2)
  }
}));

const CornerDecoration = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: '120px',
  height: '120px',
  backgroundColor: theme.palette.primary.main,
  transform: 'rotate(45deg) translate(50px, -50px)',
  zIndex: 0,
  '&::before': {
    content: '"Preview"',
    position: 'absolute',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    top: '75px',
    left: '15px',
    transform: 'rotate(-45deg)',
  },
  '@media print': {
    '&::before': {
      content: '""'
    }
  }
}));

const ResumeHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  position: 'relative',
  zIndex: 1
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(0.5),
  marginBottom: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '1.1rem'
}));

const ListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(0.5),
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1),
  }
}));

// Clickable sections for editor
const HoverHighlight = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  border: '2px dashed transparent',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.2s ease',
  pointerEvents: 'none',
  zIndex: 1,
  '& .edit-hint': {
    position: 'absolute',
    right: '50%',
    top: '50%',
    transform: 'translate(50%, -50%)',
    backgroundColor: 'rgba(25, 118, 210, 0.9)',
    color: 'white',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    zIndex: 10
  }
}));

const ClickableSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius,
    '& .edit-button': {
      opacity: 1,
    },
    '& .section-highlight': {
      border: `2px dashed ${theme.palette.primary.main}`,
    },
    '& .edit-hint': {
      opacity: 1,
    }
  },
  padding: theme.spacing(1),
  marginBottom: theme.spacing(0.5)
}));

// LaTeX specific styled components
const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(0.5)
}));

const Institution = styled(Typography)({
  fontWeight: 'bold',
  display: 'inline',
  fontSize: '0.95rem'
});

const Degree = styled(Typography)({
  display: 'inline',
  fontSize: '0.9rem'
});

const DateLocation = styled(Typography)({
  fontSize: '0.9rem',
  fontStyle: 'italic'
});

const JobTitle = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '0.95rem'
});

const Company = styled(Typography)({
  fontStyle: 'italic',
  fontSize: '0.9rem'
});

const BulletPoint = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(0.5),
  paddingLeft: theme.spacing(2),
  fontSize: '0.9rem',
  '&:before': {
    content: '"•"',
    marginRight: theme.spacing(1),
    alignSelf: 'flex-start'
  }
}));

interface ResumePreviewProps {
  resumeData: any;
  onSectionClick?: (section: string, itemIndex?: number) => void;
  sectionOrder?: string[];
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData, onSectionClick, sectionOrder = [] }) => {
  if (!resumeData) return null;
  
  const { 
    personal_information, 
    objective,
    summary,
    education = [],
    professional_experience = [],
    experience = [],
    skills = {}
  } = resumeData;

  // Default to experience array if professional_experience is not available
  const experienceData = professional_experience.length > 0 ? professional_experience : experience;

  // Click handler for editor
  const handleSectionClick = (section: string, itemIndex?: number) => {
    if (onSectionClick) {
      onSectionClick(section, itemIndex);
    }
  };

  // Function to render each section based on section key
  const renderSection = (sectionKey: string) => {
    switch(sectionKey) {
      case 'personal_information':
  return (
          <ClickableSection key="personal_information" onClick={() => handleSectionClick('personal_information')}>
      <ResumeHeader>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: '1.5rem', letterSpacing: '0.5px' }}>
          {personal_information?.name?.toUpperCase() || 'YOUR NAME'}
        </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', fontSize: '0.9rem' }}>
          {personal_information?.email && (
                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              {personal_information.email}
            </Typography>
          )}
                {personal_information?.phone && (
                  <>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {personal_information.phone}
                    </Typography>
                  </>
                )}
          {personal_information?.linkedin && (
                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                    LinkedIn: {personal_information.linkedin}
            </Typography>
          )}
        </Box>
              {objective && (
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, fontSize: '0.9rem' }}>
                  {objective}
                </Typography>
              )}
      </ResumeHeader>
            <HoverHighlight className="section-highlight">
              <Typography className="edit-hint">Click to edit personal info</Typography>
            </HoverHighlight>
          </ClickableSection>
        );
      
      case 'education':
        return education.length > 0 ? (
          <Box key="education" sx={{ mb: 2 }}>
            <SectionTitle variant="h6">
              Education
            </SectionTitle>
            
        {education.map((edu: any, index: number) => (
              <ClickableSection key={index} onClick={() => handleSectionClick('education', index)}>
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Institution>{edu.institution}</Institution>
                    <DateLocation>{edu.location}</DateLocation>
              </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Degree>
                      {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                      {edu.GPA ? ` • GPA: ${edu.GPA}` : ''}
                    </Degree>
                    <DateLocation>{edu.dates}</DateLocation>
              </Box>
            </Box>
                <HoverHighlight className="section-highlight">
                  <Typography className="edit-hint">Click to edit this education entry</Typography>
                </HoverHighlight>
              </ClickableSection>
            ))}
          </Box>
        ) : null;
      
      case 'summary':
        return summary ? (
          <Box key="summary" sx={{ mb: 2 }}>
            <SectionTitle variant="h6">
              Summary
            </SectionTitle>
            <ClickableSection onClick={() => handleSectionClick('summary')}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                {summary}
              </Typography>
              <HoverHighlight className="section-highlight">
                <Typography className="edit-hint">Click to edit summary</Typography>
              </HoverHighlight>
            </ClickableSection>
        </Box>
        ) : null;
      
      case 'experience':
      case 'professional_experience':
        return experienceData.length > 0 ? (
          <Box key="experience" sx={{ mb: 2 }}>
            <SectionTitle variant="h6">
              Professional Experience
            </SectionTitle>
            
            {experienceData.map((exp: any, index: number) => (
              <ClickableSection 
                key={index} 
                sx={{ mb: 1.5 }} 
                onClick={() => handleSectionClick(professional_experience.length > 0 ? 'professional_experience' : 'experience', index)}
              >
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <JobTitle>{exp.position || exp.title}</JobTitle>
                    <DateLocation>{exp.dates}</DateLocation>
                  </Box>
                  <Company>{exp.company}</Company>
                  {exp.location && (
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                      {exp.location}
                </Typography>
                  )}
            </Box>
            
                {/* Responsibilities/Description */}
            {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                {exp.responsibilities.map((resp: string, i: number) => (
                      <BulletPoint key={i}>
                        <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{resp}</Typography>
                      </BulletPoint>
                ))}
              </Box>
            )}
            
                {/* Projects Section (if exists) */}
            {exp.projects && exp.projects.length > 0 && (
                  <Box sx={{ mt: 1, pl: 1 }}>
                {exp.projects.map((project: any, i: number) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                      {project.name}
                    </Typography>
                        
                        {project.responsibilities && project.responsibilities.length > 0 && (
                          <Box>
                            {project.responsibilities.map((resp: string, j: number) => (
                              <BulletPoint key={j}>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{resp}</Typography>
                              </BulletPoint>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
                )}
                
                <HoverHighlight className="section-highlight">
                  <Typography className="edit-hint">Click to edit this work experience</Typography>
                </HoverHighlight>
              </ClickableSection>
            ))}
          </Box>
        ) : null;
      
      case 'skills':
        return skills && Object.keys(skills).length > 0 ? (
          <Box key="skills" sx={{ mb: 2 }}>
            <SectionTitle variant="h6">
              Skills
            </SectionTitle>
            
            <ClickableSection onClick={() => handleSectionClick('skills')}>
              <Box sx={{ fontSize: '0.9rem' }}>
                {/* 动态渲染所有技能类别，不再依赖硬编码字段名称 */}
                {Object.entries(skills).map(([key, value]) => {
                  // 格式化类别名称，将下划线替换为空格并首字母大写
                  const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                  
                  // 根据值类型处理显示方式
                  const displayValue = Array.isArray(value) 
                    ? (value as string[]).join(', ')
                    : typeof value === 'string' 
                      ? value 
                      : JSON.stringify(value);
                      
                  return (
                    <Box key={key} sx={{ mb: 0.5 }}>
                      <Typography component="span" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                        {formattedKey}:
                      </Typography>{' '}
                      <Typography component="span" sx={{ fontSize: '0.9rem' }}>
                        {displayValue}
              </Typography>
                    </Box>
                  );
                })}
              </Box>
              
              <HoverHighlight className="section-highlight">
                <Typography className="edit-hint">Click to edit skills</Typography>
              </HoverHighlight>
            </ClickableSection>
          </Box>
        ) : null;
      
      default:
        // Handle other sections if they are objects or arrays
        const value = resumeData[sectionKey];
        if (typeof value === 'object' && value !== null) {
          const sectionTitle = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/_/g, ' ');
          
          return (
            <Box key={sectionKey} sx={{ mb: 2 }}>
              <SectionTitle variant="h6">
                {sectionTitle}
              </SectionTitle>
              
              <ClickableSection onClick={() => handleSectionClick(sectionKey)}>
                {Array.isArray(value) ? (
                  // Render array items
                  value.map((item, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      {typeof item === 'object' ? (
                        // Object properties
                        Object.entries(item).map(([itemKey, itemValue]) => (
                          <Box key={itemKey} sx={{ mb: 0.5 }}>
                            <Typography component="span" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                              {itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/_/g, ' ')}:
                            </Typography>{' '}
                            <Typography component="span" sx={{ fontSize: '0.9rem' }}>
                              {itemValue as string}
              </Typography>
            </Box>
                        ))
                      ) : (
                        // Simple string array
                        <BulletPoint>
                          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{item}</Typography>
                        </BulletPoint>
                      )}
                    </Box>
                  ))
                ) : (
                  // Render object properties
                  Object.entries(value).map(([itemKey, itemValue]) => (
                    <Box key={itemKey} sx={{ mb: 0.5 }}>
                      <Typography component="span" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                        {itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/_/g, ' ')}:
                      </Typography>{' '}
                      <Typography component="span" sx={{ fontSize: '0.9rem' }}>
                        {typeof itemValue === 'string' 
                          ? itemValue 
                          : Array.isArray(itemValue) 
                            ? (itemValue as string[]).join(', ')
                            : JSON.stringify(itemValue)}
              </Typography>
            </Box>
                  ))
                )}
                
                <HoverHighlight className="section-highlight">
                  <Typography className="edit-hint">Click to edit {sectionTitle.toLowerCase()}</Typography>
                </HoverHighlight>
              </ClickableSection>
            </Box>
          );
        }
        return null;
    }
  };

  // Determine order to render sections
  // If sectionOrder is provided, use it; otherwise use a default order with personal_info first
  const sectionsToRender = sectionOrder.length > 0 
    ? sectionOrder 
    : ['personal_information', 'summary', 'education', 'experience', 'professional_experience', 'skills', ...Object.keys(resumeData)];

  // Filter out duplicates and sections that have already been handled
  const uniqueSections = Array.from(new Set(sectionsToRender));

  return (
    <ResumeContainer elevation={3} className="resume-preview">
      <CornerDecoration className="print-hide" />
      
      {/* Always render personal information first */}
      {renderSection('personal_information')}
      
      {/* Render other sections in the specified order */}
      {uniqueSections
        .filter(section => section !== 'personal_information' && section !== 'raw_text')
        .map(section => renderSection(section))}
    </ResumeContainer>
  );
};

export default ResumePreview; 