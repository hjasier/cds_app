import { useChallenges } from "./useChallenges";
import { useCurrentChallenge } from "./useCurrentChallenge";
import { useCurrentRoute } from "./useCurrentRoute";
import WKB from 'ol/format/WKB';
import * as Location from 'expo-location';
import { supabase } from "../database/supabase";

/**
 * Hook for accepting challenges and navigating to them
 */
export const useAcceptChallenge = () => {

  const { challenges, fetchChallenges, loading, error } = useChallenges();
  const { setCurrentChallenge } = useCurrentChallenge();
  const { setCurrentRoute } = useCurrentRoute();
  

  const hexToUint8Array = (hex) => {
    return new Uint8Array(
      hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
  };

  // Parsear WKB
  const parseWKB = (hex) => {
    const wkb = new WKB();
    const feature = wkb.readFeature(hexToUint8Array(hex));
    if (feature) {
      const [longitude, latitude] = feature.getGeometry().getCoordinates();
      return { latitude, longitude };
    }
    return null;
  };


  /**
   * Accept a challenge and navigate to it
   * @param {Object} challenge - The complete challenge object
   */
  const acceptChallenge = async (challenge) => {
    setCurrentChallenge(challenge);
    const coordinates = parseWKB(challenge.Location?.point);
    const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
    });
    setCurrentRoute({
      startCoordinates: [location.coords.longitude, location.coords.latitude], // User's current coordinates
      endCoordinates: [coordinates.longitude, coordinates.latitude], // Challenge coordinates
      profile: 'walking'
    });
    handleAcceptChallengeSupabase(challenge);
  };
  
  /**
   * Accept a challenge by ID and navigate to it
   * @param {string} challengeId - The ID of the challenge to accept
   */
  const acceptChallengeById = async (challengeId) => {
    await fetchChallenges();

    console.log('Accepting challenge with ID:', challengeId);

    // Buscar el challenge en los desafíos cargados
    const challenge = challenges.find(challenge => challenge.id === challengeId);
    
    console.log('Found challenge:', challenge);
  
    if (challenge) {
      acceptChallenge(challenge);
    } else {
      console.error('Challenge not found');
    }
  };
  


  const handleAcceptChallengeSupabase = async (challenge) => {
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting user session:', sessionError.message);
        return;
      }
      
      if (!session || !session.user) {
        console.error('No active user session found');
        return;
      }
      
      const userId = session.user.id;
      
      // Insert a new record into AcceptedChallenge table
      const { data, error } = await supabase
        .from('AcceptedChallenge')
        .insert({
          user_id: userId,
          challenge_id: challenge.id,
          completed: false,
          location_id: challenge.Location.id || null
        })
        .select();
      
      if (error) {
        console.error('Error accepting challenge:', error.message);
        return;
      }
      
      console.log('Challenge accepted successfully:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error while accepting challenge:', error);
    }
  };
  
  return {
    acceptChallenge,
    acceptChallengeById
  };
};

export default useAcceptChallenge;