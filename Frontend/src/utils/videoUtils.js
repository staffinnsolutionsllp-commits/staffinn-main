/**
 * Video utility functions for debugging and validation
 */

export const validateVideoUrl = (url) => {
  if (!url) {
    return { valid: false, error: 'No URL provided' };
  }

  try {
    const urlObj = new URL(url);
    
    // Check if it's an S3 URL
    const isS3Url = urlObj.hostname.includes('s3') || urlObj.hostname.includes('amazonaws.com');
    
    return {
      valid: true,
      isS3Url,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      fullUrl: url
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const testVideoLoad = (url) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    const timeout = setTimeout(() => {
      resolve({ 
        canLoad: false, 
        error: 'Timeout - Video took too long to load',
        url 
      });
    }, 10000); // 10 second timeout

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve({ 
        canLoad: true, 
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        url 
      });
    };

    video.onerror = (e) => {
      clearTimeout(timeout);
      resolve({ 
        canLoad: false, 
        error: `Video load error: ${e.target.error?.message || 'Unknown error'}`,
        errorCode: e.target.error?.code,
        url 
      });
    };

    video.src = url;
    video.load();
  });
};

export const debugVideoContent = async (content) => {
  console.group(`🎥 Video Debug: ${content.contentTitle}`);
  
  console.log('Content Object:', content);
  
  const urlValidation = validateVideoUrl(content.contentUrl);
  console.log('URL Validation:', urlValidation);
  
  if (urlValidation.valid && content.contentUrl) {
    console.log('Testing video load...');
    const loadTest = await testVideoLoad(content.contentUrl);
    console.log('Load Test Result:', loadTest);
  }
  
  console.groupEnd();
  
  return {
    content,
    urlValidation,
    loadTest: urlValidation.valid ? await testVideoLoad(content.contentUrl) : null
  };
};

export const logVideoError = (error, videoUrl, context = {}) => {
  console.error('🚨 Video Error:', {
    error: error.message || error,
    url: videoUrl,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    supportedFormats: {
      mp4: document.createElement('video').canPlayType('video/mp4'),
      webm: document.createElement('video').canPlayType('video/webm'),
      ogg: document.createElement('video').canPlayType('video/ogg')
    }
  });
};