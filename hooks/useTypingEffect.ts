
import { useState, useEffect } from 'react';

/**
 * A custom React hook for creating a typing effect with a fade-out transition between phrases.
 * @param phrases - An array of strings to type out.
 * @param typingSpeed - The speed of typing in milliseconds.
 * @param delayBetweenPhrases - The pause duration in milliseconds after a phrase is typed before fading out.
 * @param fadeOutDuration - The duration of the fade-out animation in milliseconds.
 * @param onCycleComplete - A callback function that fires when the phrase cycle completes.
 * @returns An object containing the current `text` to display and a boolean `isWaiting` which is true during the pause and fade-out phase.
 */
export const useTypingEffect = (
  phrases: string[], 
  typingSpeed = 100, 
  delayBetweenPhrases = 2000,
  fadeOutDuration = 500,
  onCycleComplete?: () => void
) => {
  const [text, setText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!phrases || phrases.length === 0 || !phrases[0]) {
        setText(''); 
        return;
    }
    
    const currentPhrase = phrases[phraseIndex % phrases.length];
    if (typeof currentPhrase !== 'string') {
        return;
    }
    
    // State 1: Typing characters
    if (!isWaiting && charIndex < currentPhrase.length) {
      const typingTimeout = setTimeout(() => {
        setText(currentPhrase.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, typingSpeed);
      return () => clearTimeout(typingTimeout);
    }
    
    // State 2: Phrase finished, pause before fading
    if (!isWaiting && charIndex === currentPhrase.length) {
      const waitTimeout = setTimeout(() => {
        setIsWaiting(true); // Trigger fade out
      }, delayBetweenPhrases);
      return () => clearTimeout(waitTimeout);
    }
    
    // State 3: Fading is complete, switch to next phrase
    if (isWaiting) {
      const switchPhraseTimeout = setTimeout(() => {
        const nextPhraseIndex = (phraseIndex + 1) % phrases.length;
        setPhraseIndex(nextPhraseIndex);
        setCharIndex(0);
        setText(''); // Clear text for new phrase to appear
        setIsWaiting(false); // End fade out, ready to type
        if (nextPhraseIndex === 0 && onCycleComplete) {
            onCycleComplete();
        }
      }, fadeOutDuration);
      return () => clearTimeout(switchPhraseTimeout);
    }

  }, [charIndex, isWaiting, phraseIndex, phrases, typingSpeed, delayBetweenPhrases, fadeOutDuration, onCycleComplete]);

  return { text, isWaiting };
};
