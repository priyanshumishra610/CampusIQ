import React, {useMemo} from 'react';
import {Circle} from 'react-native-maps';
import {HeatmapDataPoint, HeatmapMode} from '../../config/maps.config';

interface HeatmapLayerProps {
  mode: HeatmapMode;
  data: HeatmapDataPoint[];
}

/**
 * Heatmap Layer Component
 * Displays heatmap visualization for analytics using Circles
 * (Fallback implementation - native Heatmap component may not be available on all platforms)
 */
export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({mode, data}) => {
  // Get color based on intensity (green -> yellow -> red gradient)
  const getHeatmapColor = (intensity: number): string => {
    if (intensity < 0.33) {
      // Green to Yellow
      const ratio = intensity / 0.33;
      const r = Math.round(ratio * 255);
      const g = 255;
      const b = 0;
      return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.4})`;
    } else if (intensity < 0.66) {
      // Yellow to Red
      const ratio = (intensity - 0.33) / 0.33;
      const r = 255;
      const g = Math.round(255 * (1 - ratio));
      const b = 0;
      return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.4})`;
    } else {
      // Red
      return `rgba(255, 0, 0, ${0.3 + intensity * 0.4})`;
    }
  };

  if (!mode || data.length === 0) {
    return null;
  }

  return (
    <>
      {data.map((point, index) => (
        <Circle
          key={`heatmap-${index}`}
          center={{latitude: point.latitude, longitude: point.longitude}}
          radius={30 + point.intensity * 20} // Radius based on intensity
          fillColor={getHeatmapColor(point.intensity)}
          strokeColor={getHeatmapColor(point.intensity)}
          strokeWidth={1}
        />
      ))}
    </>
  );
};

