// src/modules/setup/google-drive.ts
import { generateBackupData, restoreFromData } from './backup-service';

declare global {
  interface Window { google: any; }
}

// ⚠️ THAY CLIENT_ID CỦA BẠN VÀO DƯỚI ĐÂY
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'mindcap_db.json';

let tokenClient: any;
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

export const initGoogleClient = () => {
  if (typeof window === 'undefined' || !window.google) return;
  
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.access_token) {
        accessToken = response.access_token;
        tokenExpiresAt = Date.now() + (response.expires_in - 60) * 1000;
      }
    },
  });
};

const getValidToken = async (): Promise<string> => {
  return new Promise((resolve) => {
    if (accessToken && Date.now() < tokenExpiresAt) {
      resolve(accessToken);
      return;
    }
    tokenClient.requestAccessToken({ prompt: '' });
    
    const originalCallback = tokenClient.callback;
    tokenClient.callback = (resp: any) => {
       if (resp.access_token) {
         accessToken = resp.access_token;
         tokenExpiresAt = Date.now() + (resp.expires_in - 60) * 1000;
         resolve(accessToken as string);
       }
       tokenClient.callback = originalCallback;
    };
  });
};

const findBackupFile = async (token: string) => {
  const q = `name = '${BACKUP_FILENAME}' and trashed = false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.files?.[0] || null;
};

// --- PUBLIC ACTIONS ---

export const syncToDrive = async () => {
  const token = await getValidToken();
  const data = await generateBackupData(); // ✅ Đã sửa tên hàm
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  
  const existingFile = await findBackupFile(token);
  
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const url = existingFile 
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
  const method = existingFile ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) throw new Error('Upload Failed');
  return { success: true };
};

export const loadFromDrive = async () => {
  const token = await getValidToken();
  const file = await findBackupFile(token);
  if (!file) throw new Error('Không tìm thấy bản backup trên Drive');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const json = await res.json();
  await restoreFromData(json); // ✅ Đã sửa tên hàm
  return { success: true };
};