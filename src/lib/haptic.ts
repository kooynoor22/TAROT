/**
 * Safely triggers haptic feedback (vibration) on compatible mobile devices.
 * If vibration is not supported or errors out, it fails silently.
 */
export function triggerHaptic(pattern: number | number[] = 20) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore security errors or environment restrictions
    }
  }
}
