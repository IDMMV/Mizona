export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export const isAndroidLike = () =>
  /Android/i.test(window.navigator.userAgent || '');

export const isCapacitorRuntime = () =>
  Boolean(window.Capacitor?.isNativePlatform?.());

export const getRuntimeKind = () => {
  if (isCapacitorRuntime()) return 'android-native';
  if (isStandalone()) return 'pwa';
  return 'web';
};

export const canUseSecureDeviceApis = () =>
  window.isSecureContext || location.hostname === 'localhost';

export const vibrate = pattern => {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
};

export const shareContent = async ({ title, text, url, files } = {}) => {
  if (navigator.share) {
    await navigator.share({ title, text, url, files });
    return { shared: true, fallback: false };
  }

  const value = [title, text, url].filter(Boolean).join('\n');
  if (navigator.clipboard && value) {
    await navigator.clipboard.writeText(value);
    return { shared: false, fallback: true };
  }

  return { shared: false, fallback: false };
};
