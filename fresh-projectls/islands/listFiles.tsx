// routes/listFiles.tsx
import { useEffect,useState } from "preact/hooks";
import { signal } from "@preact/signals";

export default function GoogleDriveFiles() {
  const [files,setFiles] =  useState([]);

  useEffect(() => {
    async function fetchFiles() {
      const response = await fetch("/api/google_drive");
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    }

    fetchFiles();
  }, []);

  return (
    <div>
      <h1>Google Drive Files</h1>
      <ul>
        {files.map((file) => (
          <li key={file.id}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}
