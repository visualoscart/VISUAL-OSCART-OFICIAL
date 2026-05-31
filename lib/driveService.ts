export const getAccessToken = async (): Promise<string> => {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = import.meta.env.VITE_GOOGLE_REFRESH_TOKEN;
  
  // Simple cache in window object or variable
  const cached = (window as any)._driveToken;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  const token = data.access_token;
  
  (window as any)._driveToken = {
    token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  };
  
  return token;
};

export const createBrandFolder = async (brandName: string): Promise<string> => {
  const MASTER_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_MASTER_FOLDER_ID;
  const token = await getAccessToken();
  
  const query = `name='${brandName.replace(/'/g, "\\'")}' and '${MASTER_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id; // Return existing
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: brandName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [MASTER_FOLDER_ID],
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create folder');
  }

  const createData = await createRes.json();
  
  // Set permissions so anyone with the link can view
  await fetch(`https://www.googleapis.com/drive/v3/files/${createData.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  return createData.id;
};

export const createSubFolder = async (folderName: string, parentId: string): Promise<string> => {
  const token = await getAccessToken();
  
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create subfolder');
  }

  const createData = await createRes.json();
  
  // Set permissions
  await fetch(`https://www.googleapis.com/drive/v3/files/${createData.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  return createData.id;
};

export const uploadFileResumable = async (
  file: File, 
  folderId: string, 
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId: string; thumbnailUrl?: string }> => {
  const MASTER_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_MASTER_FOLDER_ID;
  const token = await getAccessToken();
  
  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': file.type || 'application/octet-stream',
      'X-Upload-Content-Length': file.size.toString(),
    },
    body: JSON.stringify({
      name: file.name,
      parents: [folderId || MASTER_FOLDER_ID],
    }),
  });

  if (!initRes.ok) {
    throw new Error('Failed to initialize upload session');
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('No upload URL returned from Google');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        const fileId = response.id;
        
        // Ensure file is accessible
        try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone'
                })
            });
        } catch (e) {
            console.error("Could not set permissions", e);
        }

        let thumbnailUrl = undefined;
        try {
            const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const meta = await metaRes.json();
            if (meta.thumbnailLink) {
                thumbnailUrl = meta.thumbnailLink.replace(/=s\d+$/, '=s800');
            }
        } catch (e) {
            console.error("Could not fetch thumbnail", e);
        }

        resolve({
          url: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
          fileId,
          thumbnailUrl
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.send(file);
  });
};
