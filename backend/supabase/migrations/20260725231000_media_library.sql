-- Media Library Database Schema

CREATE TABLE media_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure a folder can't have duplicate names in the same parent (or root)
CREATE UNIQUE INDEX idx_media_folders_name_parent ON media_folders (name, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  folder_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  dimensions VARCHAR(50),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure file name is unique within a folder
CREATE UNIQUE INDEX idx_media_files_name_folder ON media_files (file_name, COALESCE(folder_id, '00000000-0000-0000-0000-000000000000'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_folders_modtime
BEFORE UPDATE ON media_folders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_media_files_modtime
BEFORE UPDATE ON media_files
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
