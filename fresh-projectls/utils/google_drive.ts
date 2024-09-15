// utils/google_drive.ts
export async function listGoogleDriveFiles(accessToken: string) {
    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch Google Drive files");
    }
  
    const data = await response.json();
    return data.files;
  }
  