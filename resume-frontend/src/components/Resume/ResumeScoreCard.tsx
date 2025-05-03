import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Typography 
} from '@mui/material';

interface ResumeScoreCardProps {
  score: number;
  analysisData: any | null;
}

const ResumeScoreCard: React.FC<ResumeScoreCardProps> = ({ score, analysisData }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader title="Resume Score" />
      <Divider />
      <CardContent>
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
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ATS Compatibility" 
                  secondary={`${analysisData.ats_compatibility_score || 0}%`} 
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Communication" 
                  secondary={`${analysisData.communication_score || 0}%`} 
                  secondaryTypographyProps={{ component: 'div' }}
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
      </CardContent>
    </Card>
  );
};

export default ResumeScoreCard; 