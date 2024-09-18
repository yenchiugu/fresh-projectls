// utils/google_drive.ts
export async function listGoogleDriveFiles(accessToken: string) {
    const response = await fetch("https://www.googleapis.com/drive/v3/files/?q=mimeType%3D%27image%2Fpng%27&fields=files(id,name,webContentLink,hasThumbnail)", {
      //"https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27image%2Fpng%27"
      ///1JZ8cNz5J7JnUbXohj1wnnQnQAyyoPcI3?fields=id,name,thumbnailLink
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
  