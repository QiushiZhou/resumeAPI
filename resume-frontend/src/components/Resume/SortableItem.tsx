import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, ListItem, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export interface SortableItemProps {
  id: string;
  item: any;
  index: number;
  sectionKey: string;
  isLast: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, item, index, sectionKey, isLast }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
    position: 'relative' as const
  };

  // 渲染Secondary内容为单独组件，避免嵌套问题
  const renderSecondaryContent = () => {
    return (
      <Box component="div" sx={{ mt: 1 }}>
        {Object.entries(item)
          .filter(([key]) => !['title', 'position', 'degree', 'company', 'institution'].includes(key))
          .map(([key, value]) => {
            // Simple string fields
            if (typeof value === 'string') {
              return (
                <Typography key={key} variant="body2" component="div" sx={{ mb: 1 }}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:</strong> {value}
                </Typography>
              );
            }
            
            // String array fields (like responsibilities)
            if (Array.isArray(value) && typeof value[0] === 'string') {
              return (
                <Box key={key} component="div" sx={{ mb: 2 }}>
                  <Typography variant="body2" component="div" fontWeight="bold">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
                    {value.map((item: string, i: number) => (
                      <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              );
            }
            
            // Object array fields (like projects)
            if (Array.isArray(value) && typeof value[0] === 'object') {
              return (
                <Box key={key} component="div" sx={{ mb: 2 }}>
                  <Typography variant="body2" component="div" fontWeight="bold">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                  </Typography>
                  <Box component="div" sx={{ pl: 2, mt: 0.5 }}>
                    {value.map((project: any, i: number) => (
                      <Box key={i} component="div" sx={{ mb: 2 }}>
                        {/* Recursive rendering of nested object structure */}
                        {Object.entries(project).map(([projectKey, projectValue]) => {
                          if (projectKey === 'name') {
                            return (
                              <Typography key={projectKey} variant="body2" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                                {projectValue as string}
                              </Typography>
                            );
                          }
                          
                          // Simple string fields in project
                          if (typeof projectValue === 'string') {
                            return (
                              <Typography key={projectKey} variant="body2" component="div" sx={{ mb: 1 }}>
                                <strong>{projectKey.charAt(0).toUpperCase() + projectKey.slice(1).replace(/_/g, ' ')}:</strong>{' '}
                                {projectValue}
                              </Typography>
                            );
                          }
                          
                          // String array fields in project
                          if (Array.isArray(projectValue) && typeof projectValue[0] === 'string') {
                            return (
                              <Box key={projectKey} component="div" sx={{ mb: 1 }}>
                                <Typography variant="body2" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
                                  {projectKey.charAt(0).toUpperCase() + projectKey.slice(1).replace(/_/g, ' ')}:
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 0, mb: 0 }}>
                                  {(projectValue as string[]).map((item: string, j: number) => (
                                    <Typography key={j} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            );
                          }
                          
                          return (
                            <Typography key={projectKey} variant="body2" component="div" sx={{ mb: 1 }}>
                              <strong>{projectKey.charAt(0).toUpperCase() + projectKey.slice(1).replace(/_/g, ' ')}:</strong>{' '}
                              {String(projectValue)}
                            </Typography>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            }
            
            return (
              <Typography key={key} variant="body2" component="div" sx={{ mb: 1 }}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:</strong> {String(value)}
              </Typography>
            );
          })}
      </Box>
    );
  };

  // 完全自定义ListItem布局，不使用ListItemText
  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      key={index}
      alignItems="flex-start"
      divider={!isLast}
      {...attributes}
    >
      <Box 
        {...listeners} 
        sx={{ 
          position: 'absolute', 
          left: -30, 
          top: '50%', 
          transform: 'translateY(-50%)',
          cursor: 'grab',
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': { color: 'primary.main' }
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      
      {/* 完全自定义实现，不使用ListItemText */}
      <Box sx={{ width: '100%' }}>
        {/* 主要标题 */}
        <Typography variant="subtitle1" component="div" fontWeight="bold">
          {item.title || item.position || item.degree || item.company || item.institution || `Item ${index + 1}`}
        </Typography>
        
        {/* 详细内容 */}
        {renderSecondaryContent()}
      </Box>
    </ListItem>
  );
};

export default SortableItem; 