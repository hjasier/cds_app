import { useEffect, useState } from 'react';
import * as turf from '@turf/helpers';
import distance from '@turf/distance';
import { DETECTION_RADIUS } from './constants';
import useUserLocation from './useUserLocation';
/**
 * Custom hook to check proximity to a challenge
 * @param {[number, number]} userLocation - Current user location [longitude, latitude]
 * @param {Object} challengeLocation - Challenge location object with latitude and longitude
 * @param {number} radiusInMeters - Radius to check (default 100 meters)
 * @returns {boolean} - Whether the user is within the specified radius
 */
export function useProximityToChallenge(
  challengeLocation, 
  radiusInMeters = DETECTION_RADIUS
) {
  const [isNearChallenge, setIsNearChallenge] = useState(false);
  const { location } = useUserLocation();

  useEffect(() => {
    // Only check if both locations are valid and have coordinates
    if (!location || !challengeLocation || 
        challengeLocation.latitude === undefined || 
        challengeLocation.longitude === undefined) return;

    // Create point features for user and challenge
    const userPoint = turf.point([location[0], location[1]]);
    const challengePoint = turf.point([
      challengeLocation.longitude, 
      challengeLocation.latitude
    ]);

    // Calculate distance between points
    const distanceToChallenge = distance(userPoint, challengePoint, {
      units: 'meters'
    });

    // Update proximity state
    setIsNearChallenge(distanceToChallenge <= radiusInMeters);
  }, [location, challengeLocation, radiusInMeters]);

  return isNearChallenge;
}

