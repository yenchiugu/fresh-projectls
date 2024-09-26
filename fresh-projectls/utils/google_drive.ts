// utils/google_drive.ts
async function listGoogleDriveFiles(accessToken: string) {
  /*
  const url = 'https://www.googleapis.com/drive/v3/files';
  const params = new URLSearchParams();

  // Query to get PNG and JPG files in the specified folder
  const q = `'${folderId}' in parents and (mimeType='image/png' or mimeType='image/jpeg') and trashed = false`;
  params.append('q', q);
  params.append('fields', 'files(id, name, thumbnailLink)');
  params.append('pageSize', '1000'); // Adjust as needed
*/
  //const requestUrl = `${url}?${params.toString()}`;

    const response = await fetch(
      //"https://www.googleapis.com/drive/v3/files/",
      "https://www.googleapis.com/drive/v3/files/?q=mimeType%3d%27image%2Fpng%27%20or%20mimeType%3d%27image%2Fjpeg%27&fields=files(id,name,webContentLink,parents)",
      //"https://www.googleapis.com/drive/v3/files/?q=mimeType%3D%27image%2Fpng%27&fields=files(id,name,webContentLink,hasThumbnail)",
       {
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
  
  export async function getThumbnails(folderId: string, accessToken: string): Promise<string[]> {
    const thumbnails: string[] = [];
    const url = 'https://www.googleapis.com/drive/v3/files';
    const params = new URLSearchParams();

    // Query to get PNG and JPG files in the specified folder
    const q = `'${folderId}' in parents and (mimeType='image/png' or mimeType='image/jpeg') and trashed = false`;
    params.append('q', q);
    params.append('fields', 'files(id, name, hasThumbnail, thumbnailLink,mimeType,webContentLink, imageMediaMetadata), nextPageToken');
    params.append('pageSize', '1000'); // Adjust as needed
    //params.append('alt','media');

    console.log(params.toString());
    const requestUrl = `${url}?${params.toString()}`;

    const response = await fetch(requestUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching files: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const files = data.files;

    console.log(data);

    for (const file of files) {
        if (file.thumbnailLink) {
            thumbnails.push(file.thumbnailLink);
        } else {
            // Handle cases where thumbnailLink is not available
            console.warn(`No thumbnail available for file: ${file.name}`);
        }
    }

    return thumbnails;
}
