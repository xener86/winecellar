import React from 'react';
import { Card, CardContent, Typography, Chip, Rating, Box } from '@mui/material';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalBarIcon from '@mui/icons-material/LocalBar';

// Define the allowed tag types
type TagType = 'Classique' | 'Audacieux' | 'Caviste';

// Define the color type for MUI Chip component
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface SuggestionCardProps {
  title: string;
  score: number;
  explanation: string;
  tag: TagType;
}

const tagStyle = {
  Classique: { label: 'Classique', color: 'primary' as ChipColor, icon: <VerifiedIcon /> },
  Audacieux: { label: 'Audacieux', color: 'secondary' as ChipColor, icon: <EmojiObjectsIcon /> },
  Caviste: { label: 'Suggestion Caviste', color: 'success' as ChipColor, icon: <LocalBarIcon /> },
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, score, explanation, tag }) => {
  const style = tagStyle[tag];

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{title}</Typography>
          <Chip icon={style.icon} label={style.label} color={style.color} size="small" />
        </Box>
        <Rating value={score} readOnly precision={0.5} sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {explanation}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SuggestionCard;